"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type TeamActionState = { ok?: boolean; error?: string } | undefined;
export type MemberActionState =
  | { ok?: boolean; error?: string }
  | undefined;

const teamSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter"),
  description: z.string().trim().max(500).optional(),
  seasonStart: z.string().trim().optional(),
  seasonEnd: z.string().trim().optional(),
});

const memberSchema = z.object({
  athleteId: z.string().min(1, "Pilih atlet."),
  roleInTeam: z.enum(["player", "assistant_coach"], {
    message: "Peran tidak valid.",
  }),
  jerseyNumber: z.string().trim().max(4).optional(),
  status: z.enum(["active", "inactive"], { message: "Status tidak valid." }),
});

const memberUpdateSchema = z.object({
  roleInTeam: z.enum(["player", "assistant_coach"], {
    message: "Peran tidak valid.",
  }),
  jerseyNumber: z.string().trim().max(4).optional(),
  status: z.enum(["active", "inactive"], { message: "Status tidak valid." }),
});

function toDateOrNull(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getCoachTeam(teamId: string) {
  const user = await requireUser();
  const team = await prisma.team.findFirst({
    where: { coachId: user.id, id: teamId },
    select: { id: true },
  });
  return team ? { user, team } : null;
}

export async function createTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();
  if (user.role !== "COACH") {
    return { error: "Hanya pelatih yang dapat membuat tim." };
  }

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    seasonStart: formData.get("seasonStart"),
    seasonEnd: formData.get("seasonEnd"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const { seasonStart, seasonEnd, ...rest } = parsed.data;
  const start = toDateOrNull(seasonStart);
  const end = toDateOrNull(seasonEnd);
  if (start && end && end < start) {
    return { error: "Tanggal akhir musim harus setelah tanggal mulai." };
  }

  const team = await prisma.team.create({
    data: {
      ...rest,
      description: null,
      coachId: user.id,
      seasonStart: start,
      seasonEnd: end,
    },
    select: { id: true },
  });
  revalidatePath("/pelatih/tim");
  redirect(`/pelatih/tim/${team.id}`);
}

export async function updateTeam(
  teamId: string,
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    seasonStart: formData.get("seasonStart"),
    seasonEnd: formData.get("seasonEnd"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const { seasonStart, seasonEnd, ...rest } = parsed.data;
  const start = toDateOrNull(seasonStart);
  const end = toDateOrNull(seasonEnd);
  if (start && end && end < start) {
    return { error: "Tanggal akhir musim harus setelah tanggal mulai." };
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { ...rest, seasonStart: start, seasonEnd: end },
  });
  revalidatePath(`/pelatih/tim/${teamId}`);
  revalidatePath("/pelatih/tim");
  redirect(`/pelatih/tim/${teamId}`);
}

export async function deleteTeam(
  teamId: string,
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/pelatih/tim");
  redirect("/pelatih/tim");
}

export async function addTeamMember(
  teamId: string,
  _prevState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  const parsed = memberSchema.safeParse({
    athleteId: formData.get("athleteId"),
    roleInTeam: formData.get("roleInTeam"),
    jerseyNumber: formData.get("jerseyNumber"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const athlete = await prisma.profile.findFirst({
    where: { id: parsed.data.athleteId, deletedAt: null },
    select: { id: true },
  });
  if (!athlete) return { error: "Atlet tidak ditemukan." };

  const exists = await prisma.teamMember.findFirst({
    where: { teamId, athleteId: parsed.data.athleteId },
    select: { id: true },
  });
  if (exists) return { error: "Atlet sudah terdaftar di tim ini." };

  await prisma.teamMember.create({
    data: {
      teamId,
      athleteId: parsed.data.athleteId,
      roleInTeam: parsed.data.roleInTeam,
      jerseyNumber: parsed.data.jerseyNumber || null,
      status: parsed.data.status,
    },
  });
  revalidatePath(`/pelatih/tim/${teamId}`);
  redirect(`/pelatih/tim/${teamId}`);
}

export async function updateTeamMember(
  teamId: string,
  memberId: string,
  _prevState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  const parsed = memberUpdateSchema.safeParse({
    roleInTeam: formData.get("roleInTeam"),
    jerseyNumber: formData.get("jerseyNumber"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
    select: { id: true },
  });
  if (!member) return { error: "Anggota tidak ditemukan." };

  await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      roleInTeam: parsed.data.roleInTeam,
      jerseyNumber: parsed.data.jerseyNumber || null,
      status: parsed.data.status,
    },
  });
  revalidatePath(`/pelatih/tim/${teamId}`);
  redirect(`/pelatih/tim/${teamId}`);
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
  _prevState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  await prisma.teamMember.deleteMany({
    where: { id: memberId, teamId },
  });
  revalidatePath(`/pelatih/tim/${teamId}`);
  redirect(`/pelatih/tim/${teamId}`);
}

export async function setAssistantCoach(
  teamId: string,
  athleteId: string,
  isAssistant: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const found = await getCoachTeam(teamId);
  if (!found) return { error: "Tim tidak ditemukan." };

  await prisma.teamMember.updateMany({
    where: { teamId, athleteId },
    data: { roleInTeam: isAssistant ? "assistant_coach" : "player" },
  });
  revalidatePath(`/pelatih/tim/${teamId}`);
  return { ok: true };
}
