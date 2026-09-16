import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export default async function CoachTeamStatsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: { id: true, name: true },
  });
  if (!team) notFound();

  const [members, logs] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: team.id, status: "active", roleInTeam: "player" },
      orderBy: { joinedAt: "asc" },
      include: {
        athlete: {
          include: {
            readinessRecords: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
    }),
    prisma.sessionLog.findMany({
      where: { session: { teamId: team.id } },
      select: {
        athleteId: true,
        attendanceStatus: true,
        completed: true,
        session: { select: { scheduledAt: true } },
      },
    }),
  ]);

  const totalLogs = logs.length;
  const attendedLogs = logs.filter(
    (l) => l.attendanceStatus === "present" || l.attendanceStatus === "late",
  ).length;
  const attendanceRate =
    totalLogs > 0 ? Math.round((attendedLogs / totalLogs) * 100) : 0;

  const completedLogs = logs.filter((l) => l.completed).length;
  const completionRate =
    totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  // Kehadiran per atlet
  const attByAthlete = new Map<string, { present: number; total: number }>();
  for (const l of logs) {
    const cur = attByAthlete.get(l.athleteId) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (l.attendanceStatus === "present" || l.attendanceStatus === "late") cur.present += 1;
    attByAthlete.set(l.athleteId, cur);
  }

  // Drill results via sessionLog relation (free throw % as default metric)
  const drillResults = await prisma.drillResult.findMany({
    where: { sessionLog: { session: { teamId: team.id } } },
    select: {
      actualValue: true,
      unit: true,
      sessionLog: { select: { athleteId: true } },
      sessionDrill: { select: { drill: { select: { name: true } } } },
    },
  });

  const FT_TERMS = ["free throw", "free-throw", "free_throw", "freethrow"];
  const ftByAthlete = new Map<string, { made: number; total: number }>();
  for (const d of drillResults) {
    const n = (d.sessionDrill.drill.name ?? "").toLowerCase();
    if (!FT_TERMS.some((t) => n.includes(t))) continue;
    const aid = d.sessionLog.athleteId;
    const cur = ftByAthlete.get(aid) ?? { made: 0, total: 0 };
    cur.made += Math.round(d.actualValue);
    cur.total += 1;
    ftByAthlete.set(aid, cur);
  }

  type Row = {
    id: string;
    name: string;
    jerseyNumber: string | null;
    position: string | null;
    ftPct: number | null;
    attendance: { rate: number; n: number } | null;
    readiness: string | null;
  };

  const rows: Row[] = members.map((m) => {
    const ft = ftByAthlete.get(m.athleteId);
    const att = attByAthlete.get(m.athleteId);
    return {
      id: m.athleteId,
      name: m.athlete.fullName,
      jerseyNumber: m.jerseyNumber,
      position: m.athlete.position,
      ftPct: ft && ft.total > 0 ? Math.round((ft.made / ft.total) * 100) : null,
      attendance: att ? { rate: Math.round((att.present / att.total) * 100), n: att.total } : null,
      readiness: m.athlete.readinessRecords[0]?.status ?? null,
    };
  });

  const sorted = [...rows].sort((a, b) => (b.ftPct ?? -1) - (a.ftPct ?? -1));

  const needsAttention = rows.filter((r) => {
    const lowAtt = r.attendance !== null && r.attendance.rate < 60;
    return lowAtt || (r.readiness !== null && r.readiness !== "full");
  });

  const maxFt = Math.max(1, ...sorted.map((r) => r.ftPct ?? 0));

  const READINESS_LABEL: Record<string, string> = {
    full: "Siap penuh",
    limited: "Dibatasi",
    rest: "Istirahat",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <SectionTitle
          title="Statistik Tim"
          description={`${team.name} · Performa kolektif & pemain perlu perhatian.`}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Rata-rata kehadiran"
          value={`${attendanceRate}%`}
          hint={`${attendedLogs}/${totalLogs} log sesi`}
          tone={attendanceRate >= 80 ? "success" : attendanceRate >= 60 ? "warning" : "danger"}
        />
        <StatCard
          title="Penyelesaian program"
          value={`${completionRate}%`}
          hint={`${completedLogs}/${totalLogs} log`}
          tone={completionRate >= 80 ? "success" : completionRate >= 60 ? "warning" : "danger"}
        />
        <StatCard
          title="Perlu perhatian"
          value={needsAttention.length}
          hint="atlet yang perlu dipantau"
          tone={needsAttention.length === 0 ? "success" : "warning"}
        />
      </div>

      {/* Bar perbandingan Free Throw % */}
      <section className="mb-8 rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-h4 font-bold tracking-tight">Perbandingan Free Throw %</h2>
          <Badge variant="neutral">metrik default</Badge>
        </div>
        <p className="mb-4 text-tiny text-ink-soft">
          Bar horizontal memudahkan membaca banyak nama pemain sekaligus.
        </p>

        {sorted.length === 0 ? (
          <p className="py-4 text-center text-tiny text-ink-soft">Belum ada data pemain.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <Link
                  href={`/pelatih/atlet/${r.id}`}
                  className="w-40 shrink-0 truncate text-small font-semibold hover:text-primary"
                >
                  {r.jerseyNumber ? `#${r.jerseyNumber} ` : ""}{r.name}
                </Link>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (r.ftPct ?? 0) >= 70 ? "bg-primary" : (r.ftPct ?? 0) >= 50 ? "bg-warning" : "bg-danger",
                    )}
                    style={{ width: `${r.ftPct !== null ? Math.max(4, (r.ftPct / maxFt) * 100) : 4}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-small font-bold tabular-nums">
                  {r.ftPct !== null ? `${r.ftPct}%` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Daftar pemain perlu perhatian */}
      <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-1 text-h4 font-bold tracking-tight">Pemain perlu perhatian</h2>
        <p className="mb-4 text-tiny text-ink-soft">
          Kehadiran rendah atau status kesiapan belum penuh — klik untuk masuk ke profil atlet.
        </p>

        {needsAttention.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-neutral-soft py-10 text-center">
            <p className="text-h4">🏆</p>
            <p className="mt-1 text-small font-bold">Semua atlet on-track</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {needsAttention.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/pelatih/atlet/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-neutral-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-small font-semibold">
                      {r.jerseyNumber ? `#${r.jerseyNumber} ` : ""}{r.name}
                    </p>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      Kehadiran {r.attendance ? `${r.attendance.rate}%` : "—"} · FT{" "}
                      {r.ftPct !== null ? `${r.ftPct}%` : "—"}
                      {r.readiness && r.readiness !== "full"
                        ? ` · Kesiapan: ${READINESS_LABEL[r.readiness] ?? r.readiness}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-tiny text-ink-faint">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
