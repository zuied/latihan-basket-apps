import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

type PhaseTone = { bar: string; chip: string; dot: string; label: string };

const TONES: PhaseTone[] = [
  {
    label: "Pra-Musim",
    bar: "bg-primary",
    chip: "border-primary-soft bg-primary-faint text-primary",
    dot: "bg-primary",
  },
  {
    label: "Musim / Kompetisi",
    bar: "bg-purple",
    chip: "border-purple-soft bg-purple-faint text-purple",
    dot: "bg-purple",
  },
  {
    label: "Pemulihan / Off-Season",
    bar: "bg-success",
    chip: "border-success-soft bg-success-faint text-success",
    dot: "bg-success",
  },
];

function toneFor(name: string): PhaseTone {
  const n = name.toLowerCase();
  if (/pra|pre|persiapan|pramusim/.test(n)) return TONES[0];
  if (/musim|kompetisi|liga|pertandingan/.test(n)) return TONES[1];
  return TONES[2];
}

function fmt(iso: Date | number | string | null | undefined): string {
  if (iso === null || iso === undefined) return "…";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type PhaseBrief = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  focusNotes: string | null;
  sessionCount: number;
};

type Segment = PhaseBrief & {
  left: number;
  width: number;
  tone: PhaseTone;
  startTs: number;
  endTs: number;
};

function buildSegments(
  phases: PhaseBrief[],
  rangeStart: number,
  rangeEnd: number,
): Segment[] {
  if (phases.length === 0) return [];
  const span = Math.max(1, rangeEnd - rangeStart);
  const step = span / phases.length;
  return phases.map((ph, i) => {
    const startTs =
      ph.startDate?.getTime() ?? rangeStart + step * i;
    let endTs =
      ph.endDate?.getTime() ?? (ph.startDate ? startTs + step : startTs + step);
    if (endTs <= startTs) endTs = startTs + Math.max(1, span * 0.02);
    const left = Math.max(
      0,
      Math.min(100, ((startTs - rangeStart) / span) * 100),
    );
    const width = Math.max(
      3,
      Math.min(100 - left, ((endTs - startTs) / span) * 100),
    );
    return {
      ...ph,
      startTs,
      endTs,
      left,
      width,
      tone: toneFor(ph.name),
    };
  });
}

export default async function PelatihTimelinePeriodisasiPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: {
      id: true,
      name: true,
      seasonStart: true,
      seasonEnd: true,
      programs: {
        where: { type: "team" },
        orderBy: [{ startDate: "asc" }],
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          phases: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              focusNotes: true,
              cycles: {
                orderBy: { weekNumber: "asc" },
                select: { id: true, name: true, sessions: { select: { id: true } } },
              },
            },
          },
        },
      },
    },
  });

  const seasonStart = team?.seasonStart ?? null;
  const seasonEnd = team?.seasonEnd ?? null;

  const allDateTs = (team?.programs ?? [])
    .flatMap((p) => [
      p.startDate,
      p.endDate,
      ...p.phases.flatMap((ph) => [ph.startDate, ph.endDate]),
    ])
    .filter((d): d is Date => Boolean(d))
    .map((d) => d.getTime());

  const earliest =
    seasonStart?.getTime() ??
    (allDateTs.length > 0 ? Math.min(...allDateTs) : null);
  const latest =
    seasonEnd?.getTime() ??
    (allDateTs.length > 0 ? Math.max(...allDateTs) : null);

  const hasRange = earliest !== null && latest !== null && latest > earliest;

  const programMaps = (team?.programs ?? []).map((p) => {
    const phases: PhaseBrief[] = p.phases.map((ph) => ({
      id: ph.id,
      name: ph.name,
      startDate: ph.startDate,
      endDate: ph.endDate,
      focusNotes: ph.focusNotes,
      sessionCount: ph.cycles.reduce((acc, c) => acc + c.sessions.length, 0),
    }));
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      phases,
      segments: hasRange
        ? buildSegments(phases, earliest as number, latest as number)
        : [],
    };
  });

  const personalPrograms = await prisma.program.findMany({
    where: { ownerId: user.id, type: "personal" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      phases: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
  });

  const statusLabel: Record<string, string> = {
    draft: "Draf",
    active: "Aktif",
    completed: "Selesai",
    archived: "Arsip",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <SectionTitle
          title="Timeline Periodisasi Musim"
          description={
            team
              ? `${team.name} · ${fmt(seasonStart)} – ${fmt(seasonEnd)}`
              : "Rencana fase latihan satu musim dalam satu tampilan."
          }
        />
      </div>

      {!team ? (
        <EmptyState
          title="Belum ada tim"
          description="Buat tim terlebih dahulu untuk menyusun rencana periodisasi musim."
          action={
            <Link
              href="/pelatih/tim"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-small font-medium text-white transition-colors hover:bg-primary-strong"
            >
              Buat tim
            </Link>
          }
        />
      ) : team.programs.length === 0 ? (
        <EmptyState
          title="Belum ada program tim"
          description="Susun program pertama di Program Builder, lalu fase periodisasinya akan tampil di timeline ini."
          action={
            <Link
              href="/pelatih/program"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-small font-medium text-white transition-colors hover:bg-primary-strong"
            >
              Buka Program Builder
            </Link>
          }
        />
      ) : (
        <>
          {!hasRange ? (
            <div className="mb-6 rounded-2xl border border-line bg-panel p-4 text-small text-ink-soft shadow-sm">
              Atur tanggal mulai/akhir musim di Kelola Tim, atau lengkapi
              tanggal fase di Program Builder, supaya timeline menampilkan
              posisi fase yang proporsional.
            </div>
          ) : null}

          <div className="space-y-6">
            {programMaps.map((p) => (
              <section
                key={p.id}
                className="rounded-2xl border border-line bg-panel p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-h4 font-bold tracking-tight">{p.name}</h2>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      {fmt(p.startDate ?? p.phases[0]?.startDate)} –{" "}
                      {fmt(p.endDate ?? p.phases[p.phases.length - 1]?.endDate)}
                      {" · "}
                      {p.phases.reduce((acc, ph) => acc + ph.sessionCount, 0)} sesi
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-tiny font-semibold",
                      p.status === "active"
                        ? "bg-success-faint text-success"
                        : p.status === "completed"
                          ? "bg-primary-faint text-primary"
                          : "bg-neutral-soft text-ink-soft",
                    )}
                  >
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>

                {p.segments.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <div className="relative h-12 min-w-[640px] rounded-xl bg-canvas ring-1 ring-line">
                        {p.segments.map((seg) => (
                          <div
                            key={seg.id}
                            title={`${seg.name} (${fmt(seg.startTs)} – ${fmt(seg.endTs)})`}
                            className={cn(
                              "absolute top-1 bottom-1 rounded-lg",
                              seg.tone.bar,
                            )}
                            style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                          >
                            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 truncate px-2 text-[10px] font-bold text-white">
                              {seg.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      {p.segments.length > 0 ? (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-faint">
                          <span>{fmt(earliest)}</span>
                          <span>{fmt(latest)}</span>
                        </div>
                      ) : null}
                    </div>

                    <ul className="mt-4 space-y-3">
                      {p.segments.map((seg) => (
                        <li key={seg.id}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-tiny font-semibold",
                                seg.tone.chip,
                              )}
                            >
                              <span className={cn("size-2 rounded-full", seg.tone.dot)} />
                              {seg.name}
                            </span>
                            <span className="text-tiny text-ink-soft">
                              {fmt(seg.startTs)} → {fmt(seg.endTs)} · {seg.sessionCount} sesi
                            </span>
                          </div>
                          {seg.focusNotes ? (
                            <p className="mt-1 text-tiny text-ink-faint">
                              {seg.focusNotes}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.phases.map((ph) => (
                      <li key={ph.id}>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-semibold",
                            toneFor(ph.name).chip,
                          )}
                        >
                          <span className={cn("size-2 rounded-full", toneFor(ph.name).dot)} />
                          {ph.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Legenda warna fase */}
          <section className="mt-8 rounded-2xl border border-line bg-panel p-5 shadow-sm">
            <h2 className="mb-3 text-h4 font-bold tracking-tight">Makna warna fase</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TONES.map((t) => (
                <li key={t.label} className="flex items-start gap-2.5">
                  <span
                    className={cn("mt-0.5 size-3 shrink-0 rounded-md", t.bar)}
                  />
                  <span className="min-w-0">
                    <p className="text-tiny font-bold">{t.label}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-ink-faint">
                      {t.label === "Pra-Musim"
                        ? "Persiapan fisik & instalasi sistem."
                        : t.label === "Musim / Kompetisi"
                          ? "Pemeliharaan performa & taktik pertandingan."
                          : "Recovery & pengembangan skill individu."}
                    </p>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {personalPrograms.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-h4 font-bold tracking-tight">
            Program personal
          </h2>
          <div className="space-y-3">
            {personalPrograms.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <p className="text-small font-bold">{p.name}</p>
                {p.description ? (
                  <p className="mt-0.5 text-tiny text-ink-soft">{p.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.phases.length === 0 ? (
                    <span className="text-tiny text-ink-faint">
                      Tidak ada fase — program difokuskan ke drill individu.
                    </span>
                  ) : (
                    p.phases.map((ph) => (
                      <span
                        key={ph.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-semibold",
                          toneFor(ph.name).chip,
                        )}
                      >
                        <span className={cn("size-2 rounded-full", toneFor(ph.name).dot)} />
                        {ph.name}
                        {ph.startDate ? ` · ${fmt(ph.startDate)}` : ""}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}