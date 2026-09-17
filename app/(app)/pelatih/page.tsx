import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { createNotification } from "@/app/(app)/notifications/actions";

const WEEKDAY_DATE = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const READINESS_META: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  full: { label: "Siap penuh", variant: "success" },
  limited: { label: "Dibatasi", variant: "warning" },
  rest: { label: "Istirahat", variant: "danger" },
};

function greetingWord(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export default async function CoachDashboard() {
  const user = await requireUser();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    include: {
      members: {
        where: { status: "active", athlete: { deletedAt: null } },
        include: {
          athlete: {
            include: {
              readinessRecords: {
                where: { validUntil: { gte: now } },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
              injuriesSuffered: { where: { status: "active" } },
            },
          },
        },
      },
      programs: {
        where: { status: "active" },
        select: { id: true },
      },
    },
  });

  if (!team) notFound();

  const athleteCount = team.members.length;
  const activePrograms = team.programs.length;

  const recentLogs = await prisma.sessionLog.findMany({
    where: { session: { teamId: team.id }, loggedAt: { gte: weekAgo } },
    select: { attendanceStatus: true },
  });

  const totalRecent = recentLogs.length;
  const attendedRecent = recentLogs.filter(
    (l) => l.attendanceStatus === "present" || l.attendanceStatus === "late",
  ).length;
  const compliancePercent =
    totalRecent > 0 ? Math.round((attendedRecent / totalRecent) * 100) : null;

  const needsAttention = team.members.filter((m) => {
    const r = m.athlete.readinessRecords[0];
    return (r && r.status !== "full") || m.athlete.injuriesSuffered.length > 0;
  });

  const feedLogs = await prisma.sessionLog.findMany({
    where: { session: { teamId: team.id } },
    orderBy: { loggedAt: "desc" },
    take: 6,
    include: {
      athlete: { select: { fullName: true } },
      session: { select: { name: true } },
    },
  });

  const loadAlerts: {
    athleteName: string;
    detail: string;
    severity: "warning" | "danger";
  }[] = [];

  for (const member of team.members) {
    const r = member.athlete.readinessRecords[0];
    if (r && r.status !== "full") {
      loadAlerts.push({
        athleteName: member.athlete.fullName,
        detail: r.reason ?? `Status kesiapan: ${READINESS_META[r.status].label}`,
        severity: r.status === "rest" ? "danger" : "warning",
      });
    }
    for (const inj of member.athlete.injuriesSuffered) {
      loadAlerts.push({
        athleteName: member.athlete.fullName,
        detail: `Cedera ${inj.bodyPart} (${inj.severity})`,
        severity: inj.severity === "berat" ? "danger" : "warning",
      });
    }
  }

  // ── Load spike detection (acute:chronic RPE ratio) ──
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const rpeLogs = await prisma.sessionLog.findMany({
    where: {
      session: { teamId: team.id },
      rpe: { not: null },
      loggedAt: { gte: fourWeeksAgo },
    },
    select: {
      athleteId: true,
      rpe: true,
      loggedAt: true,
    },
  });

  const rpeByAthlete = new Map<string, { current: number[]; previous: number[] }>();
  for (const log of rpeLogs) {
    const aid = log.athleteId;
    if (!rpeByAthlete.has(aid)) rpeByAthlete.set(aid, { current: [], previous: [] });
    const bucket = rpeByAthlete.get(aid)!;
    const diffWeeks = (now.getTime() - log.loggedAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
    if (diffWeeks <= 1) {
      bucket.current.push(log.rpe!);
    } else {
      bucket.previous.push(log.rpe!);
    }
  }

  for (const member of team.members) {
    const rpeData = rpeByAthlete.get(member.athleteId);
    if (!rpeData || rpeData.current.length === 0 || rpeData.previous.length === 0) continue;

    const currentAvg = rpeData.current.reduce((a, b) => a + b, 0) / rpeData.current.length;
    const prevAvg = rpeData.previous.reduce((a, b) => a + b, 0) / rpeData.previous.length;
    const ratio = prevAvg > 0 ? currentAvg / prevAvg : 0;

    if (ratio > 1.5) {
      const detail = `Beban naik ${Math.round((ratio - 1) * 100)}% (RPE minggu ini: ${currentAvg.toFixed(1)}, rata-rata: ${prevAvg.toFixed(1)})`;
      loadAlerts.push({
        athleteName: member.athlete.fullName,
        detail,
        severity: ratio > 2 ? "danger" : "warning",
      });

      // Create notification (fire-and-forget)
      createNotification(
        user.id,
        "load_alert",
        `Peringatan beban: ${member.athlete.fullName}`,
        detail,
        `/pelatih/atlet/${member.athleteId}`,
      ).catch(() => {});
    }
  }

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-soft via-panel to-purple-soft p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-h1 font-semibold tracking-tight">
              {greetingWord()}, Coach {firstName}
            </h1>
            <p className="mt-1 text-small text-ink-soft">
              Ringkasan hal yang perlu diperhatikan hari ini.
            </p>
          </div>
          <Badge>{WEEKDAY_DATE.format(now)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Atlet aktif"
          value={athleteCount}
          hint={`Tim ${team.name}`}
          tone="primary"
        />
        <StatCard
          title="Tim berjalan"
          value={activePrograms}
          hint="Program aktif"
        />
        <StatCard
          title="Kepatuhan minggu ini"
          value={compliancePercent !== null ? `${compliancePercent}%` : "—"}
          hint={
            compliancePercent !== null
              ? compliancePercent >= 80
                ? "On-track"
                : "Perlu diperhatikan"
              : "Belum ada data 7 hari terakhir"
          }
          tone={
            compliancePercent !== null
              ? compliancePercent >= 80
                ? "success"
                : "warning"
              : "default"
          }
        />
        <StatCard
          title="Perlu perhatian"
          value={needsAttention.length}
          hint={
            needsAttention.length > 0
              ? needsAttention
                  .map((m) => m.athlete.fullName.split(" ")[0])
                  .join(", ")
              : "Semua atlet siap"
          }
          tone={needsAttention.length > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Aktivitas terbaru</CardTitle>
              <CardDescription>Ringkasan aktivitas atlet & tim</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {feedLogs.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState
                  title="Belum ada aktivitas"
                  description="Aktivitas akan muncul setelah sesi latihan dicatat."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line/70">
                {feedLogs.map((log) => {
                  const done = log.completed;
                  const late = log.attendanceStatus === "late";
                  const absent = log.attendanceStatus === "absent";
                  return (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-tiny font-semibold ${
                            done
                              ? "bg-success-soft text-success-strong"
                              : absent
                                ? "bg-danger-soft text-danger-strong"
                                : "bg-warning-soft text-warning"
                          }`}
                        >
                          {log.athlete.fullName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-small font-medium">
                            {log.athlete.fullName}
                          </p>
                          <p className="text-tiny text-ink-soft">
                            {done
                              ? `Menyelesaikan sesi ${log.session.name}`
                              : late
                                ? `Hadir terlambat di ${log.session.name}`
                                : absent
                                  ? `Absen pada sesi ${log.session.name}`
                                  : `Mencatat hasil ${log.session.name}`}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-tiny text-ink-faint">
                        {relativeTime(log.loggedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Peringatan beban latihan</CardTitle>
              <CardDescription>Atlet yang perlu dipantau</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadAlerts.length === 0 ? (
              <p className="text-small text-ink-soft">
                Tidak ada peringatan aktif. Semua atlet dalam kondisi siap.
              </p>
            ) : (
              <>
                {loadAlerts.map((alert, i) => (
                  <Link
                    key={`${alert.athleteName}-${i}`}
                    href="/pelatih/atlet"
                    className="flex items-start gap-3 rounded-xl border border-line bg-panel p-4 transition-colors hover:bg-neutral-soft"
                  >
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${
                        alert.severity === "danger" ? "bg-danger" : "bg-warning"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-small font-semibold">
                          {alert.athleteName}
                        </p>
                        <Badge
                          variant={
                            alert.severity === "danger" ? "danger" : "warning"
                          }
                        >
                          {alert.severity === "danger"
                            ? "Perlu perhatian"
                            : "Perlu ditinjau"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-tiny text-ink-soft">
                        {alert.detail}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/pelatih/atlet"
                  className="inline-flex items-center text-small font-medium text-primary hover:underline"
                >
                  Lihat profil atlet
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
