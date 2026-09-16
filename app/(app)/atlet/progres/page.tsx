import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

export default async function AthleteProgressPage() {
  const user = await requireUser();
  if (user.role !== "ATHLETE") notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last90 = new Date(now.getTime() - 90 * 86400000);

  const [allLogs, drillResults] = await Promise.all([
    prisma.sessionLog.findMany({
      where: { athleteId: user.id, loggedAt: { gte: last90 } },
      orderBy: { loggedAt: "asc" },
      include: { session: { select: { name: true, durationMinutes: true, scheduledAt: true } } },
    }),
    prisma.drillResult.findMany({
      where: {
        sessionLog: { athleteId: user.id, loggedAt: { gte: last90 } },
      },
      include: {
        sessionDrill: {
          include: { drill: { select: { name: true, subCategory: true } } },
        },
      },
      orderBy: { sessionLog: { loggedAt: "desc" } },
    }),
  ]);

  const totalSessions = allLogs.length;
  const attendanceRate =
    totalSessions > 0
      ? Math.round(
          (allLogs.filter((l) => l.attendanceStatus === "present").length /
            totalSessions) *
            100,
        )
      : 0;
  const avgRpe =
    allLogs.filter((l) => l.rpe).length > 0
      ? (
          allLogs.reduce((s, l) => s + (l.rpe ?? 0), 0) /
          allLogs.filter((l) => l.rpe).length
        ).toFixed(1)
      : "—";
  const monthLogs = allLogs.filter((l) => l.loggedAt >= monthStart);
  const monthTotalMinutes = monthLogs.reduce(
    (s, l) => s + (l.durationActualMinutes ?? l.session.durationMinutes),
    0,
  );

  // RPE bar chart (per session, max 10)
  const rpeEntries = allLogs.filter((l) => l.rpe);
  const maxRpe = 10;

  // Group drill results by session date for "Riwayat Hasil"
  const recentResults: {
    date: string;
    sessionName: string;
    items: { drillName: string; subCategory: string; actualValue: number; unit: string | null }[];
  }[] = [];
  const logMap = new Map<string, typeof recentResults[0]>();
  for (const dr of drillResults) {
    const logId = dr.sessionLogId;
    if (!logMap.has(logId)) {
      const log = allLogs.find((l) => l.id === logId);
      logMap.set(logId, {
        date: log
          ? new Intl.DateTimeFormat("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }).format(log.loggedAt)
          : "",
        sessionName: log?.session.name ?? "",
        items: [],
      });
    }
    logMap.get(logId)!.items.push({
      drillName: dr.sessionDrill.drill.name,
      subCategory: dr.sessionDrill.drill.subCategory,
      actualValue: dr.actualValue,
      unit: dr.unit,
    });
  }
  for (const entry of logMap.values()) recentResults.push(entry);

  const statCard = (label: string, value: string | number, sub?: string, tone?: string) => (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <p className="text-tiny text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-1 text-h4 font-bold",
          tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-tiny text-ink-faint">{sub}</p> : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-h2 font-bold tracking-tight">Perkembangan</h1>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statCard("Kehadiran", `${attendanceRate}%`, `30 hari terakhir`, attendanceRate >= 80 ? "success" : undefined)}
        {statCard("Rata-rata RPE", avgRpe, `skala 1–10`, Number(avgRpe) >= 7 ? "primary" : undefined)}
        {statCard("Sesi bulan ini", monthTotalMinutes, "menit", "primary")}
        {statCard("Total drill", drillResults.length, "sejak awal musim")}
      </div>

      {rpeEntries.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="mb-3 text-small font-bold">Tren RPE — 3 bulan terakhir</p>
          <div className="flex h-28 items-end gap-1">
            {rpeEntries.map((entry, i) => {
              const pct = ((entry.rpe ?? 0) / maxRpe) * 100;
              const dateLabel = new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "short",
              }).format(entry.loggedAt);
              return (
                <div
                  key={entry.id}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                >
                  <div className="absolute -top-5 hidden text-tiny text-ink-soft group-hover:block">
                    {entry.rpe}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  {i % Math.max(1, Math.floor(rpeEntries.length / 5)) === 0 ? (
                    <span className="text-[10px] text-ink-faint">{dateLabel}</span>
                  ) : (
                    <span className="text-[10px] text-ink-faint">&nbsp;</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-tiny text-ink-faint">
            Skala 1 (mudah) – 10 (sangat berat). Data dari {rpeEntries.length} sesi.
          </p>
        </div>
      )}

      {recentResults.length > 0 && (
        <div>
          <p className="mb-3 text-h4 font-bold tracking-tight">Riwayat hasil drill</p>
          <div className="space-y-3">
            {recentResults.slice(0, 5).map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-small font-bold">{r.sessionName}</p>
                  <span className="text-tiny text-ink-faint">{r.date}</span>
                </div>
                <div className="space-y-1">
                  {r.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between rounded-lg bg-canvas px-3 py-1.5 text-tiny"
                    >
                      <span className="text-ink">
                        <span className="text-ink-faint">{item.subCategory}</span>
                        {" · "}
                        {item.drillName}
                      </span>
                      <span className="font-semibold text-primary">
                        {item.actualValue}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentResults.length === 0 && totalSessions === 0 && (
        <div className="rounded-2xl border border-line bg-panel p-8 text-center">
          <p className="text-h4">📊</p>
          <p className="mt-2 text-small font-bold">Belum ada data progres</p>
          <p className="mt-1 text-tiny text-ink-soft">
            Mulai sesi latihan pertama Anda untuk mulai melihat progres di sini.
          </p>
        </div>
      )}
    </div>
  );
}