"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ConsentState = { ok?: boolean; error?: string } | undefined;

export async function approveConsent(
  linkId: string,
): Promise<ConsentState> {
  const user = await requireUser();
  if (user.role !== "PARENT") return { error: "Akses ditolak." };

  const link = await prisma.parentAthleteLink.findFirst({
    where: { id: linkId, parentId: user.id, status: "pending" },
    select: { id: true, athleteId: true },
  });
  if (!link) return { error: "Undangan tidak ditemukan atau sudah diproses." };

  await prisma.$transaction([
    prisma.parentAthleteLink.update({
      where: { id: link.id },
      data: { status: "active" },
    }),
    prisma.profile.update({
      where: { id: link.athleteId },
      data: { parentConsentStatus: "approved" },
    }),
  ]);

  revalidatePath("/orangtua");
  revalidatePath("/orangtua/consent");
  return { ok: true };
}

export async function rejectConsent(
  linkId: string,
): Promise<ConsentState> {
  const user = await requireUser();
  if (user.role !== "PARENT") return { error: "Akses ditolak." };

  const link = await prisma.parentAthleteLink.findFirst({
    where: { id: linkId, parentId: user.id, status: "pending" },
    select: { id: true, athleteId: true },
  });
  if (!link) return { error: "Undangan tidak ditemukan atau sudah diproses." };

  await prisma.$transaction([
    prisma.parentAthleteLink.update({
      where: { id: link.id },
      data: { status: "revoked" },
    }),
    prisma.profile.update({
      where: { id: link.athleteId },
      data: { parentConsentStatus: "rejected" },
    }),
  ]);

  revalidatePath("/orangtua");
  revalidatePath("/orangtua/consent");
  return { ok: true };
}
