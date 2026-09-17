import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "@/components/ui/icons";
import { TeamFormModal, DeleteTeamModal, type TeamInput } from "@/components/tim/team-form";
import { TeamRoster, type AvailableAthlete, type RosterMember } from "@/components/tim/team-roster";

const DATE_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(d: Date | null): string | null {
  return d ? DATE_FMT.format(d) : null;
}

function countUpcoming(sessions: readonly { scheduledAt: Date }[]): number {
  const now = Date.now();
  return sessions.filter((s) => s.scheduledAt.getTime() > now).length;
}

export default async function CoachTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const { id } = await params;

  const team = await prisma.team.findFirst({
    where:
      user.role === "COACH"
        ? { id, coachId: user.id }
        : { id, members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } },
    include: {
      coach: { select: { fullName: true } },
      members: {
        where: { athlete: { deletedAt: null } },
        orderBy: [{ roleInTeam: "asc" }, { joinedAt: "asc" }],
        include: {
          athlete: { select: { id: true, fullName: true, position: true } },
        },
      },
      sessions: { select: { id: true, scheduledAt: true } },
    },
  });

  if (!team) notFound();

  const isCoach = user.role === "COACH";

  const members: RosterMember[] = team.members.map((m) => ({
    id: m.id,
    athleteId: m.athlete.id,
    fullName: m.athlete.fullName,
    position: m.athlete.position,
    jerseyNumber: m.jerseyNumber,
    roleInTeam: m.roleInTeam,
    status: m.status,
  }));

  const athletes: AvailableAthlete[] = isCoach
    ? await prisma.profile.findMany({
        where: {
          role: { in: ["ATHLETE", "ASSISTANT"] },
          deletedAt: null,
          teamMemberships: { none: { teamId: team.id } },
        },
        select: { id: true, fullName: true, position: true },
        orderBy: { fullName: "asc" },
      })
    : [];

  const playerCount = members.filter((m) => m.roleInTeam === "player").length;
  const upcomingSessions = countUpcoming(team.sessions);
  const teamInput: TeamInput = {
    id: team.id,
    name: team.name,
    description: team.description,
    seasonStart: team.seasonStart?.toISOString() ?? null,
    seasonEnd: team.seasonEnd?.toISOString() ?? null,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/pelatih/tim"
        className="mb-4 inline-flex items-center gap-1.5 text-small font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Daftar tim
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 font-semibold tracking-tight">{team.name}</h1>
            <Badge variant="primary">{team.coach.fullName}</Badge>
          </div>
          {team.description ? (
            <p className="mt-1 max-w-2xl text-small text-ink-soft">{team.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon />
              Musim {formatDate(team.seasonStart) ?? "—"}
              {team.seasonEnd ? <> – {formatDate(team.seasonEnd)}</> : null}
            </span>
            <span>{members.length} anggota</span>
            <span>{playerCount} pemain</span>
            <span>{upcomingSessions} sesi mendatang</span>
          </div>
        </div>
        {isCoach ? (
          <div className="flex shrink-0 items-center gap-2">
            <TeamFormModal team={teamInput} triggerLabel="Edit" variant="secondary" />
            <DeleteTeamModal team={{ id: team.id, name: team.name }} />
          </div>
        ) : null}
      </header>

      <TeamRoster
        teamId={team.id}
        isCoach={isCoach}
        members={members}
        athletes={athletes}
      />
    </div>
  );
}