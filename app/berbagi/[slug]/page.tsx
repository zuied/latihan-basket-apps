import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { RaporSummary, RaporStructuredData } from "@/app/(app)/pelatih/rapor/actions";
import { PrintButton } from "./print-button";

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

  let structured: RaporStructuredData | null = null;
  try {
    structured = report.structuredData as unknown as RaporStructuredData | null;
  } catch {
    structured = null;
  }

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <header className="border-b border-line bg-panel print:border-b print:border-gray-300">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft print:hidden">
              🏀
            </span>
            <span className="text-small font-bold">Rapor Latihan Basket</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-tiny text-ink-soft print:hidden">
              Dibagikan oleh {report.creator.fullName}
            </span>
            <PrintButton />
          </div>
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
        ) : (
          <div className="mb-6 rounded-2xl border border-line bg-panel p-5 text-center shadow-sm">
            <p className="text-small font-semibold">Belum ada data asesmen awal</p>
            <p className="mt-1 text-tiny text-ink-soft">
              Asesmen awal {summary.athleteName} belum dilakukan.
            </p>
          </div>
        )}

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
        ) : (
          <div className="rounded-2xl border border-line bg-panel p-5 text-center shadow-sm">
            <p className="text-small font-semibold">Belum ada catatan kehadiran</p>
            <p className="mt-1 text-tiny text-ink-soft">
              Belum ada sesi yang tercatat untuk rapor ini.
            </p>
          </div>
        )}

        {structured ? (
          <>
            {structured.categories.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
                <p className="mb-3 text-small font-bold">Penilaian per kategori</p>
                <div className="space-y-3">
                  {structured.categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between">
                        <span className="text-small font-medium">{cat.name}</span>
                        <span className="text-small font-bold text-primary">{cat.score}/{cat.maxScore}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                        />
                      </div>
                      {cat.notes ? (
                        <p className="mt-1 text-tiny text-ink-soft">{cat.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(structured.qualitativeNotes.strengths || structured.qualitativeNotes.improvements || structured.qualitativeNotes.attitudeNotes) ? (
              <div className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
                <p className="mb-3 text-small font-bold">Evaluasi kualitatif</p>
                <div className="space-y-3">
                  {structured.qualitativeNotes.strengths ? (
                    <div>
                      <p className="text-tiny font-bold text-success">Kekuatan</p>
                      <p className="mt-0.5 text-small text-ink">{structured.qualitativeNotes.strengths}</p>
                    </div>
                  ) : null}
                  {structured.qualitativeNotes.improvements ? (
                    <div>
                      <p className="text-tiny font-bold text-warning">Area perbaikan</p>
                      <p className="mt-0.5 text-small text-ink">{structured.qualitativeNotes.improvements}</p>
                    </div>
                  ) : null}
                  {structured.qualitativeNotes.attitudeNotes ? (
                    <div>
                      <p className="text-tiny font-bold text-purple">Sikap & perilaku</p>
                      <p className="mt-0.5 text-small text-ink">{structured.qualitativeNotes.attitudeNotes}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {(structured.recommendations || structured.nextCycleFocus) ? (
              <div className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
                <p className="mb-3 text-small font-bold">Rekomendasi & fokus berikutnya</p>
                {structured.recommendations ? (
                  <p className="text-small text-ink">{structured.recommendations}</p>
                ) : null}
                {structured.nextCycleFocus ? (
                  <p className="mt-2 text-tiny text-ink-soft">
                    <span className="font-semibold">Fokus siklus berikutnya:</span> {structured.nextCycleFocus}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}