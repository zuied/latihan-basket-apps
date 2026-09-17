import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function ParentReportsPage() {
  const user = await requireUser();
  if (user.role !== "PARENT") notFound();

  const links = await prisma.parentAthleteLink.findMany({
    where: { parentId: user.id, status: "active" },
    include: {
      athlete: {
        include: {
          teamMemberships: {
            include: { team: { select: { name: true } } },
          },
          readinessRecords: {
            where: { validUntil: { gte: new Date() } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
          injuriesSuffered: {
            where: { status: "active" },
            take: 1,
          },
          assessmentResults: {
            where: { isBaseline: true },
            orderBy: { conductedAt: "desc" },
            take: 1,
            include: {
              resultItems: {
                include: {
                  item: {
                    include: {
                      drill: {
                        select: { name: true, subCategory: true },
                      },
                    },
                  },
                },
              },
            },
          },
          sessionLogs: {
            orderBy: { loggedAt: "desc" },
            take: 5,
            include: {
              session: {
                select: { name: true, scheduledAt: true, durationMinutes: true },
              },
            },
          },
        },
      },
    },
  });

  if (links.length === 0) notFound();

  // Compute summary stats for first child
  const athlete = links[0].athlete;
  const allLogs = await prisma.sessionLog.findMany({
    where: { athleteId: athlete.id },
  });
  const totalSessions = allLogs.length;
  const presentCount = allLogs.filter((l) => l.attendanceStatus === "present").length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  const avgRpe =
    allLogs.filter((l) => l.rpe).length > 0
      ? (
          allLogs.reduce((s, l) => s + (l.rpe ?? 0), 0) /
          allLogs.filter((l) => l.rpe).length
        ).toFixed(1)
      : "—";

  const readiness = athlete.readinessRecords[0];
  const readinessMeta =
    readiness?.status === "full"
      ? { label: "Siap penuh", variant: "success" as const }
      : readiness?.status === "limited"
        ? { label: "Dibatasi", variant: "warning" as const }
        : readiness?.status === "rest"
          ? { label: "Istirahat", variant: "danger" as const }
          : null;

  const hasInjury = athlete.injuriesSuffered.length > 0;
  const team = athlete.teamMemberships[0]?.team;

  const dateFormat = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-h2 font-bold tracking-tight">Rapor</h1>
      <p className="mb-6 text-small text-ink-soft">
        Ringkasan perkembangan {athlete.fullName}
      </p>

      <div className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-h4 font-bold">{athlete.fullName}</p>
            <p className="mt-0.5 text-small text-ink-soft">
              {athlete.position ?? "Posisi belum diisi"}
              {team ? ` · ${team.name}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {readinessMeta ? (
              <Badge variant={readinessMeta.variant}>{readinessMeta.label}</Badge>
            ) : (
              <Badge variant="success">Siap</Badge>
            )}
            {hasInjury && (
              <Badge variant="warning" className="bg-warning-soft text-warning">
                Cedera aktif
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {[
          { label: "Kehadiran", value: `${attendanceRate}%` },
          { label: "Rata-rata RPE", value: avgRpe },
          { label: "Total sesi", value: `${totalSessions}` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-panel p-4 text-center shadow-sm"
          >
            <p className="text-tiny text-ink-faint">{s.label}</p>
            <p className="mt-1 text-h4 font-bold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {athlete.assessmentResults[0] ? (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="mb-3 text-small font-bold">Baseline asesmen awal</p>
          <p className="mb-3 text-tiny text-ink-soft">
            {dateFormat.format(athlete.assessmentResults[0].conductedAt)}
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {athlete.assessmentResults[0].resultItems.map((ri) => (
              <div
                key={ri.id}
                className="rounded-lg bg-canvas px-2.5 py-2"
              >
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                  {ri.item.drill.subCategory}
                </p>
                <p className="mt-0.5 text-small font-bold text-primary">
                  {ri.actualValue}
                  {ri.unit ? ` ${ri.unit}` : ""}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                  {ri.item.drill.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-5 text-center shadow-sm">
          <p className="text-small font-semibold">Belum ada data asesmen awal</p>
          <p className="mt-1 text-tiny text-ink-soft">
            Asesmen awal {athlete.fullName} belum dilakukan.
          </p>
        </div>
      )}

      {athlete.sessionLogs.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="mb-3 text-small font-bold">Sesi terakhir</p>
          <div className="space-y-2">
            {athlete.sessionLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2.5"
              >
                <div>
                  <p className="text-small font-medium">{log.session.name}</p>
                  <p className="mt-0.5 text-tiny text-ink-faint">
                    {dateFormat.format(log.session.scheduledAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {log.rpe ? (
                    <span className="text-tiny text-ink-soft">
                      RPE {log.rpe}
                    </span>
                  ) : null}
                  <Badge
                    variant={
                      log.attendanceStatus === "present"
                        ? "success"
                        : log.attendanceStatus === "late"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {log.attendanceStatus === "present"
                      ? "Hadir"
                      : log.attendanceStatus === "late"
                        ? "Terlambat"
                        : log.attendanceStatus === "absent"
                          ? "Absen"
                          : log.attendanceStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-panel p-5 text-center shadow-sm">
          <p className="text-small font-semibold">Belum ada catatan sesi</p>
          <p className="mt-1 text-tiny text-ink-soft">
            {athlete.fullName} belum mengikuti sesi yang tercatat.
          </p>
        </div>
      )}
    </div>
  );
}