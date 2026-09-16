"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AttendanceEntry = {
  sessionId: string;
  athleteId: string;
  status: "present" | "late" | "absent";
};

export async function saveAttendance(entries: AttendanceEntry[]): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: { id: true },
  });
  if (!team) notFound();

  if (entries.length === 0) {
    return { ok: false, error: "Tidak ada data kehadiran." };
  }

  const session = await prisma.session.findFirst({
    where: { id: entries[0].sessionId, teamId: team.id },
    select: { id: true },
  });
  if (!session) notFound();

  // Pastikan semua atlet benar-benar anggota aktif tim (jangan izinkan ID asing).
  const ids = [...new Set(entries.map((e) => e.athleteId))];
  const valid = await prisma.teamMember.findMany({
    where: {
      teamId: team.id,
      athleteId: { in: ids },
      status: "active",
      roleInTeam: "player",
    },
    select: { athleteId: true },
  });
  const validSet = new Set(valid.map((v) => v.athleteId));

  await prisma.$transaction(
    entries
      .filter((e) => validSet.has(e.athleteId))
      .map((e) =>
        prisma.sessionLog.upsert({
          where: { sessionId_athleteId: { sessionId: e.sessionId, athleteId: e.athleteId } },
          update: { attendanceStatus: e.status },
          create: {
            sessionId: e.sessionId,
            athleteId: e.athleteId,
            attendanceStatus: e.status,
            loggedAt: new Date(),
          },
        }),
      ),
  );

  revalidatePath("/pelatih/kalender");
  revalidatePath("/pelatih/rapor");
  return { ok: true };
}
