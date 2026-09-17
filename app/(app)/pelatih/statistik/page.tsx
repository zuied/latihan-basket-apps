import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { MetricComparison, type AthleteStat } from "@/components/statistik/metric-comparison";

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

  // Drill results — fetch all with category info for metric selector
  const drillResults = await prisma.drillResult.findMany({
    where: { sessionLog: { session: { teamId: team.id } } },
    select: {
      actualValue: true,
      unit: true,
      sessionLog: { select: { athleteId: true } },
      sessionDrill: {
        select: {
          drill: {
            select: { name: true, mainCategory: true, subCategory: true },
          },
        },
      },
    },
  });

  // Metric keys matching MetricComparison component
  const METRIC_DRILLS: Record<string, string[]> = {
    "free-throw": ["free throw", "free-throw", "free_throw", "freethrow"],
    scoring: ["shooting", "mikan", "form shooting"],
    "ball-handling": [
      "crossover",
      "behind-back",
      "dribble",
      "ball handling",
    ],
    agility: ["defensive slide", "agility", "slide"],
    speed: ["sprint", "speed", "kecepatan"],
  };

  // Accumulate per-athlete, per-metric sums
  const metricAccum = new Map<
    string,
    Record<string, { sum: number; count: number }>
  >();
  for (const d of drillResults) {
    const aid = d.sessionLog.athleteId;
    const drillName = (d.sessionDrill.drill.name ?? "").toLowerCase();
    if (!metricAccum.has(aid)) metricAccum.set(aid, {});
    const acc = metricAccum.get(aid)!;
    for (const [key, terms] of Object.entries(METRIC_DRILLS)) {
      if (terms.some((t) => drillName.includes(t))) {
        const cur = acc[key] ?? { sum: 0, count: 0 };
        cur.sum += d.actualValue;
        cur.count += 1;
        acc[key] = cur;
      }
    }
    // Completion rate: all drills with actualValue
    const cur = acc["completion"] ?? { sum: 0, count: 0 };
    cur.sum += d.actualValue;
    cur.count += 1;
    acc["completion"] = cur;
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

  // Build athlete stat rows for MetricComparison
  const athleteStats: AthleteStat[] = members.map((m) => {
    const acc = metricAccum.get(m.athleteId) ?? {};
    const values: Record<string, number | null> = {};
    for (const key of [
      "free-throw",
      "scoring",
      "ball-handling",
      "agility",
      "speed",
      "completion",
    ]) {
      const a = acc[key];
      values[key] = a && a.count > 0 ? Math.round((a.sum / a.count) * 10) / 10 : null;
    }
    return {
      id: m.athleteId,
      name: m.athlete.fullName,
      jerseyNumber: m.jerseyNumber,
      position: m.athlete.position,
      values,
    };
  });

  // Rows for "perlu perhatian" section
  const rows: Row[] = members.map((m) => {
    const att = attByAthlete.get(m.athleteId);
    const ftAcc = metricAccum.get(m.athleteId)?.["free-throw"];
    return {
      id: m.athleteId,
      name: m.athlete.fullName,
      jerseyNumber: m.jerseyNumber,
      position: m.athlete.position,
      ftPct:
        ftAcc && ftAcc.count > 0
          ? Math.round((ftAcc.sum / ftAcc.count) * 10)
          : null,
      attendance: att
        ? { rate: Math.round((att.present / att.total) * 100), n: att.total }
        : null,
      readiness: m.athlete.readinessRecords[0]?.status ?? null,
    };
  });

  const needsAttention = rows.filter((r) => {
    const lowAtt = r.attendance !== null && r.attendance.rate < 60;
    return lowAtt || (r.readiness !== null && r.readiness !== "full");
  });

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

      {/* Metrik drill interaktif */}
      <div className="mb-8">
        <MetricComparison athletes={athleteStats} />
      </div>

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
                      Kehadiran {r.attendance ? `${r.attendance.rate}%` : "—"}
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
