import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { RaporSummary } from "@/app/(app)/pelatih/rapor/actions";

const badgeFor: Record<string, { label: string; cls: string }> = {
  present: { label: "Hadir", cls: "bg-success-soft text-success" },
  late: { label: "Terlambat", cls: "bg-warning-soft text-warning" },
  absent: { label: "Absen", cls: "bg-danger-soft text-danger" },
  excused: { label: "Izin", cls: "bg-neutral-soft text-ink-soft" },
};

export default async function SharedRaporPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const report = await prisma.sharedReport.findUnique({
    where: { slug },
    include: { creator: { select: { fullName: true } } },
  });
  if (!report || report.expiresAt < new Date()) notFound();

  let summary: RaporSummary | null = null;
  try {
    summary = JSON.parse(report.summary ?? "null") as RaporSummary | null;
  } catch {
    summary = null;
  }
  if (!summary) notFound();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft">
              🏀
            </span>
            <span className="text-small font-bold">Rapor Latihan Basket</span>
          </div>
          <span className="text-tiny text-ink-soft">
            Dibagikan oleh {report.creator.fullName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Rapor ringkas
        </p>
        <h1 className="text-h2 font-bold">{summary.athleteName}</h1>
        <p className="mt-1 text-small text-ink-soft">
          {summary.position ?? "Posisi belum diisi"}
          {summary.teamName ? ` · ${summary.teamName}` : ""} · Dipublikasikan{" "}
          {summary.generatedAt}
        </p>

        <div className="my-6 grid grid-cols-3 gap-2">
          {[
            { label: "Kehadiran", value: `${summary.attendanceRate}%` },
            { label: "Rata-rata RPE", value: summary.avgRpe },
            { label: "Total sesi", value: `${summary.totalSessions}` },
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

        {summary.baseline.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
            <p className="mb-3 text-small font-bold">Baseline asesmen awal</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {summary.baseline.map((b, i) => (
                <div key={i} className="rounded-lg bg-canvas px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                    {b.name}
                  </p>
                  <p className="mt-0.5 text-small font-bold text-primary">
                    {b.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {summary.latestSessions.length > 0 ? (
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
            <p className="mb-3 text-small font-bold">Kehadiran terkini</p>
            <div className="space-y-2">
              {summary.latestSessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2.5"
                >
                  <div>
                    <p className="text-small font-medium">{s.name}</p>
                    <p className="mt-0.5 text-tiny text-ink-faint">{s.date}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-tiny font-semibold ${
                      badgeFor[s.status]?.cls ?? "bg-neutral-soft text-ink-soft"
                    }`}
                  >
                    {badgeFor[s.status]?.label ?? s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}