"use server";

import { revalidatePath } from "next/cache";
import { type InputJsonValue } from "@prisma/client/runtime/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOwnerIds } from "@/lib/program-access";

function isOwner(role: string) {
  return role === "COACH" || role === "ASSISTANT";
}

async function getProgram(programId: string, user: { id: string; role: string }) {
  const ownerIds = await resolveOwnerIds(user);
  return prisma.program.findFirst({
    where: { id: programId, ownerId: { in: ownerIds } },
    select: { id: true, type: true },
  });
}

const DAY_MS = 86_400_000;

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

function toDate(input: string): Date {
  return new Date(`${input}T00:00:00`);
}

export async function createProgram(input: {
  name: string;
  type: "team" | "personal";
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nama program wajib diisi." };

  const start = input.startDate ? toDate(input.startDate) : new Date();
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Tanggal mulai tidak valid." };
  }
  let end = input.endDate ? toDate(input.endDate) : addDays(start, 28);
  if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = addDays(start, 28);
  }

  let teamId: string | null = null;
  let ownerId = user.id;
  if (input.type === "team") {
    const team = await prisma.team.findFirst({
      where:
        user.role === "ASSISTANT"
          ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
          : { coachId: user.id },
      select: { id: true, coachId: true },
    });
    if (!team) {
      return {
        ok: false,
        error: "Buat tim terlebih dahulu sebelum membuat program tim.",
      };
    }
    teamId = team.id;
    // Program tim dimiliki oleh pelatih utama (coach), bukan asisten
    ownerId = team.coachId;
  }

  const program = await prisma.program.create({
    data: {
      name,
      type: input.type,
      ownerId,
      teamId,
      description: input.description?.trim() || null,
      startDate: start,
      endDate: end,
      status: "draft",
    },
  });

  const phase = await prisma.programPhase.create({
    data: {
      programId: program.id,
      name: "Pra-Musim",
      orderIndex: 1,
      startDate: start,
      endDate: end,
      focusNotes: null,
    },
  });

  for (let i = 0; i < 4; i += 1) {
    const cycleStart = addDays(start, i * 7);
    const cycle = await prisma.programCycle.create({
      data: {
        phaseId: phase.id,
        name: `Minggu ${i + 1}`,
        weekNumber: i + 1,
        startDate: cycleStart,
        endDate: addDays(start, i * 7 + 6),
      },
    });
    await prisma.session.create({
      data: {
        programId: program.id,
        cycleId: cycle.id,
        name: `Minggu ${i + 1} — Sesi utama`,
        teamId: input.type === "team" ? teamId : null,
        scheduledAt: cycleStart,
        durationMinutes: 90,
      },
    });
  }

  revalidatePath("/pelatih/program");
  return { ok: true, id: program.id };
}

export async function createPlay(
  programId: string,
  name: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const play = await prisma.play.create({
    data: { programId, name: name.trim() || "Set Play Baru", elements: [] as InputJsonValue[] },
  });
  revalidatePath("/pelatih/program");
  return { ok: true, id: play.id };
}

export async function updatePlay(
  playId: string,
  data: {
    name?: string;
    description?: string;
    elements?: Record<string, unknown>[];
  },
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const play = await prisma.play.findUnique({
    where: { id: playId },
    include: { program: { select: { ownerId: true } } },
  });
  if (!play || play.program?.ownerId !== user.id) {
    return { ok: false, error: "Play tidak ditemukan." };
  }

  await prisma.play.update({
    where: { id: playId },
    data: {
      name: data.name !== undefined ? data.name.trim() || play.name : play.name,
      description:
        data.description !== undefined
          ? data.description.trim() || null
          : play.description,
      ...(data.elements !== undefined
        ? { elements: data.elements as unknown as InputJsonValue[] }
        : {}),
    },
  });
  revalidatePath("/pelatih/program");
  return { ok: true };
}

export async function deletePlay(playId: string): Promise<boolean> {
  const user = await requireUser();
  if (!isOwner(user.role)) return false;

  const play = await prisma.play.findUnique({
    where: { id: playId },
    include: { program: { select: { ownerId: true } } },
  });
  if (!play || play.program?.ownerId !== user.id) return false;

  await prisma.play.delete({ where: { id: playId } });
  revalidatePath("/pelatih/program");
  return true;
}

export async function clonePlay(
  templateId: string,
  programId: string,
): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
  play?: {
    id: string;
    name: string;
    description: string | null;
    elements: Record<string, unknown>[];
  };
}> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const template = await prisma.play.findUnique({ where: { id: templateId } });
  if (!template || !template.isTemplate) {
    return { ok: false, error: "Template tidak ditemukan." };
  }

  const play = await prisma.play.create({
    data: {
      programId,
      name:
        template.name.startsWith("Salinan: ")
          ? template.name
          : `Salinan: ${template.name}`,
      description: template.description,
      tags: template.tags as InputJsonValue,
      elements: template.elements as InputJsonValue,
    },
  });
  revalidatePath("/pelatih/program");
  return {
    ok: true,
    id: play.id,
    play: {
      id: play.id,
      name: play.name,
      description: play.description,
      elements: Array.isArray(play.elements)
        ? (play.elements as Record<string, unknown>[])
        : [],
    },
  };
}

export async function savePlayElements(
  playId: string,
  elements: Record<string, unknown>[],
): Promise<{ ok: boolean; error?: string }> {
  return updatePlay(playId, { elements });
}

export async function addDrillToSession(
  sessionId: string,
  drillId: string,
  programId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const session = await prisma.session.findFirst({
    where: { id: sessionId, programId },
    include: {
      _count: { select: { sessionDrills: true } },
    },
  });
  if (!session) return { ok: false, error: "Sesi tidak ditemukan." };

  const exists = await prisma.sessionDrill.findFirst({
    where: { sessionId, drillId },
  });
  if (exists) return { ok: false, error: "Drill sudah ada di sesi ini." };

  // Program berlapis (spec wireframe 3.4): drill dengan posisi spesifik masuk
  // blok "individu per posisi"; drill "Semua" menjadi "wajib semua".
  const drill = await prisma.drill.findUnique({
    where: { id: drillId },
    select: { relevantPositions: true },
  });
  const positions = Array.isArray(drill?.relevantPositions)
    ? drill.relevantPositions.map(String)
    : [];
  const isMandatory =
    positions.length === 0 || positions.includes("Semua");

  await prisma.sessionDrill.create({
    data: {
      sessionId,
      drillId,
      orderIndex: session._count.sessionDrills + 1,
      isMandatory,
      ...(isMandatory
        ? {}
        : { assignedPositions: positions as unknown as InputJsonValue }),
    },
  });
  revalidatePath("/pelatih/program");
  return { ok: true };
}

export async function removeDrillFromSession(
  sessionId: string,
  drillId: string,
  programId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const session = await prisma.session.findFirst({
    where: { id: sessionId, programId },
  });
  if (!session) return { ok: false, error: "Sesi tidak ditemukan." };

  await prisma.sessionDrill.deleteMany({
    where: { sessionId, drillId },
  });
  revalidatePath("/pelatih/program");
  return { ok: true };
}

export async function setDrillScope(
  sessionDrillId: string,
  programId: string,
  scope: "mandatory" | "positional",
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const sd = await prisma.sessionDrill.findFirst({
    where: { id: sessionDrillId, session: { programId } },
    include: { drill: { select: { relevantPositions: true } } },
  });
  if (!sd) return { ok: false, error: "Drill tidak ditemukan." };

  const data: { isMandatory: boolean; assignedPositions: InputJsonValue } =
    scope === "mandatory"
      ? { isMandatory: true, assignedPositions: ["Semua"] }
      : (() => {
          const positions = Array.isArray(sd.drill.relevantPositions)
            ? sd.drill.relevantPositions.map(String)
            : [];
          const broad =
            positions.length === 0 || positions.includes("Semua");
          const list = broad ? ["Guard"] : positions;
          return {
            isMandatory: false,
            assignedPositions: list as unknown as InputJsonValue,
          };
        })();

  await prisma.sessionDrill.update({
    where: { id: sessionDrillId },
    data,
  });

  revalidatePath("/pelatih/program");
  return { ok: true };
}

export async function reorderSessionDrills(
  sessionId: string,
  programId: string,
  orderedIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user);
  if (!program) return { ok: false, error: "Program tidak ditemukan." };

  const session = await prisma.session.findFirst({
    where: { id: sessionId, programId },
    select: { id: true },
  });
  if (!session) return { ok: false, error: "Sesi tidak ditemukan." };

  const existing = await prisma.sessionDrill.findMany({
    where: { sessionId },
    select: { id: true },
  });
  const valid = new Set(existing.map((d) => d.id));
  const ids = orderedIds.filter((id) => valid.has(id));
  if (ids.length === 0) return { ok: true };

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.sessionDrill.update({ where: { id }, data: { orderIndex: index + 1 } }),
    ),
  );

  revalidatePath("/pelatih/program");
  return { ok: true };
}
