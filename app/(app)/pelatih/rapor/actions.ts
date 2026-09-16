"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RaporSummary = {
  athleteId: string;
  athleteName: string;
  position: string | null;
  teamName: string | null;
  attendanceRate: number;
  totalSessions: number;
  avgRpe: string;
  baseline: {
    name: string;
    value: string;
  }[];
  latestSessions: {
    name: string;
    date: string;
    status: string;
  }[];
  generatedAt: string;
};

export async function createSharedReport(
  athleteId: string,
): Promise<{ ok: boolean; slug?: string; url?: string; error?: string }> {
  const user = await requireUser();
  if (user.role !== "COACH") {
    return { ok: false, error: "Hanya pelatih yang dapat membuat tautan rapor." };
  }

  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    select: { id: true, name: true },
  });
  if (!team) return { ok: false, error: "Tim tidak ditemukan." };

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: team.id, athleteId, status: "active" },
    select: { athlete: { select: { fullName: true, position: true } } },
  });
  if (!membership) {
    return { ok: false, error: "Atlet bukan anggota tim Anda." };
  }

  const [logs, baseline] = await Promise.all([
    prisma.sessionLog.findMany({
      where: { athleteId },
      include: { session: { select: { name: true, scheduledAt: true } } },
    }),
    prisma.assessmentResult.findFirst({
      where: { athleteId, isBaseline: true },
      orderBy: { conductedAt: "desc" },
      include: {
        resultItems: {
          include: {
            item: {
              include: { drill: { select: { name: true } } },
            },
          },
        },
      },
    }),
  ]);

  const attendanceRate =
    logs.length > 0
      ? Math.round(
          (logs.filter((l) => l.attendanceStatus === "present").length /
            logs.length) *
            100,
        )
      : 0;

  const avgRpe =
    logs.filter((l) => l.rpe).length > 0
      ? (
          logs.reduce((s, l) => s + (l.rpe ?? 0), 0) /
          logs.filter((l) => l.rpe).length
        ).toFixed(1)
      : "—";

  const dateFormat = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  });

  const summary: RaporSummary = {
    athleteId,
    athleteName: membership.athlete.fullName,
    position: membership.athlete.position,
    teamName: team.name,
    attendanceRate,
    totalSessions: logs.length,
    avgRpe,
    baseline: baseline?.resultItems.map((ri) => ({
      name: ri.item.drill.name,
      value: `${ri.actualValue}${ri.unit ? ` ${ri.unit}` : ""}`,
    })) ?? [],
    latestSessions: logs
      .sort((a, b) => b.session.scheduledAt.getTime() - a.session.scheduledAt.getTime())
      .slice(0, 5)
      .map((l) => ({
        name: l.session.name,
        date: shortDate.format(l.session.scheduledAt),
        status: l.attendanceStatus,
      })),
    generatedAt: dateFormat.format(new Date()),
  };

  const slug = randomBytes(8).toString("hex");
  const baseUrl =
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

  await prisma.sharedReport.create({
    data: {
      slug,
      createdBy: user.id,
      title: `Rapor ${membership.athlete.fullName}`,
      summary: JSON.stringify(summary),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/pelatih/rapor");
  return {
    ok: true,
    slug,
    url: `${baseUrl}/berbagi/${slug}`,
  };
}

export async function deleteSharedReport(reportId: string): Promise<boolean> {
  const user = await requireUser();
  const existing = await prisma.sharedReport.findUnique({
    where: { id: reportId },
  });
  if (!existing || existing.createdBy !== user.id) return false;

  await prisma.sharedReport.delete({ where: { id: reportId } });
  revalidatePath("/pelatih/rapor");
  return true;
}