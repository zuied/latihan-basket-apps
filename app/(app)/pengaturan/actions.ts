"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SettingsState = { ok?: boolean; error?: string } | undefined;

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  phone: z.string().trim().optional(),
  position: z.string().trim().optional(),
  heightCm: z.string().trim().optional(),
  weightKg: z.string().trim().optional(),
});

export async function updateProfile(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const heightCm = parsed.data.heightCm
    ? parseFloat(parsed.data.heightCm)
    : null;
  const weightKg = parsed.data.weightKg
    ? parseFloat(parsed.data.weightKg)
    : null;
  if (parsed.data.heightCm && (Number.isNaN(heightCm) || heightCm! < 50)) {
    return { error: "Tinggi badan tidak valid." };
  }
  if (parsed.data.weightKg && (Number.isNaN(weightKg) || weightKg! < 20)) {
    return { error: "Berat badan tidak valid." };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      position: parsed.data.position || null,
      heightCm,
      weightKg,
    },
  });

  revalidatePath("/pengaturan");
  return { ok: true };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

export async function changePassword(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  if (!user.passwordHash) {
    return { error: "Akun ini tidak menggunakan password." };
  }
  const matches = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return { error: "Password saat ini salah." };
  }

  const hashed = await hash(parsed.data.newPassword, 10);
  await prisma.profile.update({
    where: { id: user.id },
    data: { passwordHash: hashed },
  });

  return { ok: true };
}