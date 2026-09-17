"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { destroySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type DataDeletionResult = {
  ok: boolean;
  error?: string;
};

export async function requestDataDeletion(): Promise<DataDeletionResult> {
  const user = await requireUser();

  // For parents: soft delete their account + notify coach
  // For athletes: soft delete their account
  await prisma.profile.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  // If parent, also revoke their access links
  if (user.role === "PARENT") {
    await prisma.parentAthleteLink.updateMany({
      where: { parentId: user.id, status: { not: "revoked" } },
      data: { status: "revoked" },
    });
  }

  await destroySession();
  revalidatePath("/");
  return { ok: true };
}

export async function exportMyData(): Promise<{ ok: boolean; data?: string; error?: string }> {
  const user = await requireUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      sessionLogs: {
        include: {
          session: { select: { name: true, scheduledAt: true } },
          drillResults: true,
        },
      },
      injuriesSuffered: true,
      readinessRecords: true,
    },
  });

  if (!profile) return { ok: false, error: "Profil tidak ditemukan." };

  const exportData = {
    profile: {
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      position: profile.position,
      dateOfBirth: profile.dateOfBirth,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
    },
    sessionHistory: profile.sessionLogs.map((l) => ({
      session: l.session.name,
      date: l.session.scheduledAt,
      attendance: l.attendanceStatus,
      rpe: l.rpe,
      drillResults: l.drillResults.map((r) => ({
        actualValue: r.actualValue,
        unit: r.unit,
      })),
    })),
    injuries: profile.injuriesSuffered.map((i) => ({
      bodyPart: i.bodyPart,
      type: i.injuryType,
      severity: i.severity,
      startDate: i.startDate,
      status: i.status,
    })),
    readinessHistory: profile.readinessRecords.map((r) => ({
      status: r.status,
      reason: r.reason,
      validUntil: r.validUntil,
    })),
  };

  return { ok: true, data: JSON.stringify(exportData, null, 2) };
}
