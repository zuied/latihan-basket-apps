import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/pengaturan/settings-form";
import {
  AccessManager,
  type AssistantRow,
  type ParentLinkRow,
} from "@/components/pengaturan/access-manager";

export default async function PengaturanPage() {
  const user = await requireUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      phone: true,
      position: true,
      heightCm: true,
      weightKg: true,
    },
  });
  if (!profile) notFound();

  let teams: { id: string; name: string }[] = [];
  let assistants: AssistantRow[] = [];
  let parentLinks: ParentLinkRow[] = [];

  if (user.role === "COACH") {
    const teamData = await prisma.team.findMany({
      where: { coachId: user.id },
      select: {
        id: true,
        name: true,
        members: {
          where: { roleInTeam: "assistant_coach" },
          orderBy: { joinedAt: "asc" },
          select: {
            id: true,
            athlete: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    teams = teamData.map((t) => ({ id: t.id, name: t.name }));
    assistants = teamData.flatMap((t) =>
      t.members.map((m) => ({
        memberId: m.id,
        fullName: m.athlete.fullName,
        email: m.athlete.email,
        teamName: t.name,
      })),
    );

    const athleteRows = await prisma.teamMember.findMany({
      where: {
        team: { coachId: user.id },
        roleInTeam: "player",
        status: "active",
      },
      select: { athleteId: true },
    });

    const links = await prisma.parentAthleteLink.findMany({
      where: { athleteId: { in: athleteRows.map((r) => r.athleteId) } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        relationship: true,
        status: true,
        parent: { select: { fullName: true, email: true } },
        athlete: { select: { fullName: true } },
      },
    });

    parentLinks = links.map((l) => ({
      linkId: l.id,
      parentName: l.parent.fullName,
      parentEmail: l.parent.email,
      athleteName: l.athlete.fullName,
      relationship: l.relationship,
      status: l.status,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-h2 font-bold tracking-tight">Pengaturan</h1>
      <p className="mb-6 text-small text-ink-soft">
        Kelola data profil, keamanan, dan akses akun Anda.
      </p>
      <div className="space-y-6">
        <SettingsForm
          fullName={profile.fullName}
          phone={profile.phone}
          position={profile.position}
          heightCm={profile.heightCm}
          weightKg={profile.weightKg}
          role={user.role}
        />
        {user.role === "COACH" ? (
          <AccessManager
            teams={teams}
            assistants={assistants}
            parentLinks={parentLinks}
          />
        ) : null}
      </div>
    </div>
  );
}