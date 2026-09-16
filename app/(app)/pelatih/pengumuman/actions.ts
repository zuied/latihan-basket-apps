"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AnnouncementState = { error?: string } | undefined;

export async function createAnnouncement(
  _prevState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const user = await requireUser();

  const title = (formData.get("title") as string)?.trim() ?? "";
  const content = (formData.get("content") as string)?.trim() ?? "";

  if (!title) return { error: "Judul pengumuman wajib diisi." };
  if (!content) return { error: "Isi pengumuman wajib diisi." };

  await prisma.announcement.create({
    data: {
      authorId: user.id,
      teamId: formData.get("teamId") as string | null,
      athleteId: formData.get("athleteId") as string | null,
      title,
      content,
    },
  });

  revalidatePath("/pengumuman");
  revalidatePath("/atlet");
  revalidatePath("/orangtua");
  redirect("/pengumuman");
}

export async function deleteAnnouncement(announcementId: string): Promise<boolean> {
  const user = await requireUser();

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!existing || existing.authorId !== user.id) return false;

  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath("/pengumuman");
  return true;
}