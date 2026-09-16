"use server";

import { revalidatePath } from "next/cache";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isOwner(role: string) {
  return role === "COACH" || role === "ASSISTANT";
}

function getProgram(programId: string, userId: string) {
  return prisma.program.findFirst({
    where: { id: programId, ownerId: userId },
    select: { id: true, type: true },
  });
}

export async function createPlay(
  programId: string,
  name: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user.id);
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
        data.description !== undefined ? data.description : play.description,
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
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUser();
  if (!isOwner(user.role)) return { ok: false, error: "Akses ditolak." };

  const program = await getProgram(programId, user.id);
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
  return { ok: true, id: play.id };
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

  const program = await getProgram(programId, user.id);
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

  await prisma.sessionDrill.create({
    data: {
      sessionId,
      drillId,
      orderIndex: session._count.sessionDrills,
      isMandatory: true,
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

  const program = await getProgram(programId, user.id);
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
