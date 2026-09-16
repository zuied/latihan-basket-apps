"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

type ResultInput = {
  sessionDrillId: string;
  actualValue: number;
  unit: string;
};

const saveSchema = z.object({
  sessionId: z.string().min(1),
  athleteId: z.string().min(1),
  results: z.array(
    z.object({
      sessionDrillId: z.string().min(1),
      actualValue: z.number().finite(),
      unit: z.string(),
    }),
  ),
});

export async function saveSessionResults(
  input: ResultInput[] | { sessionId: string; athleteId: string; results: ResultInput[] },
) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message };
  }
  const { sessionId, athleteId, results } = parsed.data;

  const { prisma } = await import("@/lib/prisma");

  // Pastikan log sesi ada (upsert), lalu tulis hasil per drill.
  // SessionLog punya unique constraint [sessionId, athleteId].
  try {
    await prisma.sessionLog.upsert({
      where: { sessionId_athleteId: { sessionId, athleteId } },
      update: {
        completed: true,
        loggedAt: new Date(),
      },
      create: {
        sessionId,
        athleteId,
        attendanceStatus: "present",
        completed: true,
      },
    });

    const sessionLog = await prisma.sessionLog.findUnique({
      where: { sessionId_athleteId: { sessionId, athleteId } },
      select: { id: true },
    });
    if (!sessionLog) return { ok: false as const, error: "Log tidak ditemukan" };

    for (const r of results) {
      await prisma.drillResult.deleteMany({
        where: { sessionLogId: sessionLog.id, sessionDrillId: r.sessionDrillId },
      });
      await prisma.drillResult.create({
        data: {
          sessionLogId: sessionLog.id,
          sessionDrillId: r.sessionDrillId,
          actualValue: r.actualValue,
          unit: r.unit,
        },
      });
    }

    revalidatePath("/atlet");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Gagal menyimpan hasil.",
    };
  }
}

export async function addSessionComment(sessionId: string, content: string) {
  const trimmed = content.trim();
  if (!sessionId || !trimmed) {
    return { ok: false as const, error: "Komentar tidak boleh kosong." };
  }
  if (trimmed.length > 500) {
    return { ok: false as const, error: "Komentar maksimal 500 karakter." };
  }

  const { prisma } = await import("@/lib/prisma");
  const { requireUser } = await import("@/lib/auth");

  try {
    const user = await requireUser();
    await prisma.sessionComment.create({
      data: { sessionId, authorId: user.id, content: trimmed },
    });
    revalidatePath("/atlet");
    revalidatePath(`/pelatih/sesi/${sessionId}`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Gagal menambah komentar.",
    };
  }
}