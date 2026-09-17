"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const Schema = z.object({
  athleteId: z.string(),
  status: z.enum(["full", "limited", "rest"]),
  reason: z.string().max(200).optional(),
  days: z.number().int().min(1).max(30).default(7),
});

export async function setReadiness(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "COACH") return { ok: false, error: "Unauthorized" };

  const parsed = Schema.safeParse({
    athleteId: formData.get("athleteId"),
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
    days: Number(formData.get("days") || 7),
  });
  if (!parsed.success) return { ok: false, error: "Data tidak valid" };

  const { athleteId, status, reason, days } = parsed.data;

  // Verify athlete belongs to coach's team
  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    select: { id: true },
  });
  if (!team) return { ok: false, error: "Tim tidak ditemukan" };

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: team.id, athleteId, status: "active" },
  });
  if (!membership) return { ok: false, error: "Atlet tidak ada di tim" };

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + days);

  // Upsert: invalidate previous active readiness, create new one
  await prisma.$transaction([
    prisma.athleteReadiness.updateMany({
      where: { athleteId, validUntil: { gte: new Date() } },
      data: { validUntil: new Date() }, // expire old ones
    }),
    prisma.athleteReadiness.create({
      data: {
        athleteId,
        status,
        reason: reason || null,
        validUntil,
        updatedBy: user.id,
      },
    }),
  ]);

  return { ok: true };
}
