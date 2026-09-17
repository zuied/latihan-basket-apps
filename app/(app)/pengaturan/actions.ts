"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { requireUser, destroySession } from "@/lib/auth";
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

// ─────────────────────────────────────────────────────────────
// Kelola akses (layar #23 PRD UI/UX)
// ─────────────────────────────────────────────────────────────

const ACCESS_ROLES = ["COACH"];

function isAccessManager(role: string) {
  return ACCESS_ROLES.includes(role);
}

export async function addAssistant(
  teamId: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isAccessManager(user.role)) return { ok: false, error: "Akses ditolak." };

  const team = await prisma.team.findFirst({
    where: { id: teamId, coachId: user.id },
    select: { id: true },
  });
  if (!team) return { ok: false, error: "Tim tidak ditemukan." };

  const em = email.trim().toLowerCase();
  if (!em) return { ok: false, error: "Email wajib diisi." };

  const candidate = await prisma.profile.findUnique({
    where: { email: em },
    select: { id: true, fullName: true, role: true },
  });
  if (!candidate) {
    return { ok: false, error: `Tidak ada akun dengan email ${em}.` };
  }
  if (candidate.role !== "ASSISTANT") {
    return {
      ok: false,
      error: `Akun ${em} berperan ${candidate.role}, bukan asisten pelatih.`,
    };
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_athleteId: { teamId, athleteId: candidate.id } },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Asisten ini sudah terdaftar di tim." };
  }

  await prisma.teamMember.create({
    data: {
      teamId,
      athleteId: candidate.id,
      roleInTeam: "assistant_coach",
      status: "active",
    },
  });

  revalidatePath("/pengaturan");
  return { ok: true };
}

export async function removeAssistant(
  teamMemberId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isAccessManager(user.role)) return { ok: false, error: "Akses ditolak." };

  const member = await prisma.teamMember.findFirst({
    where: {
      id: teamMemberId,
      roleInTeam: "assistant_coach",
      team: { coachId: user.id },
    },
    select: { id: true },
  });
  if (!member) return { ok: false, error: "Anggota tidak ditemukan." };

  await prisma.teamMember.delete({ where: { id: member.id } });

  revalidatePath("/pengaturan");
  return { ok: true };
}

export async function setParentAccess(
  linkId: string,
  status: "active" | "revoked",
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isAccessManager(user.role)) return { ok: false, error: "Akses ditolak." };

  const link = await prisma.parentAthleteLink.findFirst({
    where: {
      id: linkId,
      athlete: {
        teamMemberships: { some: { team: { coachId: user.id } } },
      },
    },
    select: { id: true },
  });
  if (!link) return { ok: false, error: "Link orang tua tidak ditemukan." };

  await prisma.parentAthleteLink.update({
    where: { id: link.id },
    data: { status },
  });

  revalidatePath("/pengaturan");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Tambah link orang tua (coach → parent)
// ─────────────────────────────────────────────────────────────

export async function addParentLink(
  athleteEmail: string,
  parentEmail: string,
  relationship: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isAccessManager(user.role)) return { ok: false, error: "Akses ditolak." };

  const ae = athleteEmail.trim().toLowerCase();
  const pe = parentEmail.trim().toLowerCase();
  if (!ae || !pe) return { ok: false, error: "Email atlet dan orang tua wajib diisi." };
  if (!relationship.trim()) return { ok: false, error: "Hubungan wajib diisi." };

  // Find athlete
  const athlete = await prisma.profile.findUnique({
    where: { email: ae },
    select: { id: true, role: true },
  });
  if (!athlete) return { ok: false, error: `Tidak ada akun atlet dengan email ${ae}.` };
  if (athlete.role !== "ATHLETE") {
    return { ok: false, error: `Email ${ae} bukan akun atlet.` };
  }

  // Verify athlete is on coach's team
  const member = await prisma.teamMember.findFirst({
    where: { athleteId: athlete.id, team: { coachId: user.id } },
    select: { id: true },
  });
  if (!member) {
    return { ok: false, error: "Atlet tidak ada di tim Anda." };
  }

  // Find or create parent
  let parent = await prisma.profile.findUnique({
    where: { email: pe },
    select: { id: true, role: true },
  });
  if (!parent) {
    // Create parent account with default password
    const { hash } = await import("bcryptjs");
    const passwordHash = await hash("parent123", 10);
    parent = await prisma.profile.create({
      data: {
        fullName: pe.split("@")[0],
        email: pe,
        role: "PARENT",
        passwordHash,
      },
      select: { id: true, role: true },
    });
  }

  // Check duplicate link
  const existing = await prisma.parentAthleteLink.findFirst({
    where: { parentId: parent.id, athleteId: athlete.id },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "Link antara orang tua ini dan atlet sudah ada." };

  // Create link with pending status
  await prisma.parentAthleteLink.create({
    data: {
      parentId: parent.id,
      athleteId: athlete.id,
      relationship: relationship.trim(),
      status: "pending",
    },
  });

  // Set athlete consent status to pending
  await prisma.profile.update({
    where: { id: athlete.id },
    data: { parentConsentStatus: "pending" },
  });

  revalidatePath("/pengaturan");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Hapus akun (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteAccount(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "Password wajib diisi untuk menghapus akun." };
  }

  if (!user.passwordHash) {
    return { error: "Akun ini tidak menggunakan password." };
  }
  const matches = await compare(password, user.passwordHash);
  if (!matches) {
    return { error: "Password salah." };
  }

  // Soft delete: set deletedAt
  await prisma.profile.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  // Destroy session → clear cookie
  await destroySession();

  return { ok: true };
}