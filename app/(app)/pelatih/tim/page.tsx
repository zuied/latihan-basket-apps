import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamFormModal } from "@/components/tim/team-form";
import { DashDash } from "@/components/ui/icons";

async function getTeams() {
  const user = await requireUser();
  const now = Date.now();
  const include = {
    members: { where: { status: "active" } },
    sessions: { select: { id: true, scheduledAt: true } },
  } as const;
  const teams =
    user.role === "COACH"
      ? await prisma.team.findMany({
          where: { coachId: user.id },
          include,
          orderBy: { createdAt: "desc" },
        })
      : await prisma.team.findMany({
          where: {
            members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } },
          },
          include,
          orderBy: { createdAt: "desc" },
        });
  return teams.map((team) => {
    const upcoming = team.sessions.filter((s) => s.scheduledAt.getTime() > now).length;
    const playerCount = team.members.filter((m) => m.roleInTeam === "player").length;
    return { team, upcoming, playerCount };
  });
}

function dateLabel(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export default async function CoachTeamsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const teams = await getTeams();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-3">
        <SectionTitle
          title="Kelola Tim"
          description="Buat tim, kelola roster, dan tunjuk asisten pelatih."
        />
        <TeamFormModal />
      </div>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-10 text-center">
          <p className="mb-1 text-h4 font-bold">Belum ada tim</p>
          <p className="mx-auto max-w-md text-small text-ink-soft">
            Buat tim pertama Anda untuk mulai menyusun roster dan menjadwalkan sesi latihan.
          </p>
          <TeamFormModal triggerLabel="Buat tim pertama" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(({ team, upcoming, playerCount }) => {
            return (
              <Link
                key={team.id}
                href={`/pelatih/tim/${team.id}`}
                className="rounded-2xl border border-line bg-panel p-5 shadow-sm transition-colors hover:border-primary hover:bg-primary-soft/20"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-h4 font-bold tracking-tight">{team.name}</h3>
                    {team.seasonStart ? (
                      <p className="mt-1 text-tiny text-ink-soft">
                        Musim {dateLabel(team.seasonStart)}
                        {team.seasonEnd ? <> – {dateLabel(team.seasonEnd)}</> : null}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/pelatih/tim/${team.id}`}
                    aria-label={`Kelola ${team.name}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink"
                  >
                    <DashDash className="size-4" />
                  </Link>
                </div>

                {team.description ? (
                  <p className="mb-3 line-clamp-2 text-tiny text-ink-soft">{team.description}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">{team.members.length} anggota</Badge>
                  <Badge variant="neutral">{playerCount} pemain</Badge>
                  {upcoming > 0 ? (
                    <Badge variant="warning">{upcoming} sesi mendatang</Badge>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
