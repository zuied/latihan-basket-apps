"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { PlaybookEditor, type PlayData } from "@/components/playbook/court-editor";
import { PlayTemplateLibrary, type TemplatePlay } from "@/components/playbook/play-template-library";
import { createPlay, addDrillToSession, removeDrillFromSession } from "@/app/(app)/pelatih/program/actions";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type BuilderCycle = {
  id: string;
  name: string;
  weekNumber: number;
  sessions: {
    id: string;
    name: string;
    durationMinutes: number;
    dateLabel: string;
    drills: {
      id: string;
      drillId: string;
      drillName: string;
      subCategory: string;
      targetText: string;
    }[];
  }[];
};

export type BuilderPhase = {
  id: string;
  name: string;
  orderIndex: number;
  startDate: string | null;
  endDate: string | null;
  focusNotes: string | null;
};

export type BuilderPlay = {
  id: string;
  name: string;
  description: string | null;
  elements: { kind: string; id: string; [k: string]: unknown }[];
};

export type BuilderProgram = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  phaseName: string | null;
  phases: BuilderPhase[];
  cycles: BuilderCycle[];
  plays: BuilderPlay[];
};

export type BankDrill = {
  id: string;
  name: string;
  subCategory: string;
  difficulty: string;
};

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "…";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(iso));
}

function phaseDateRange(phases: BuilderPhase[]): string {
  const f = phases[0]?.startDate;
  const l = phases[phases.length - 1]?.endDate;
  if (!f && !l) return "";
  return `${fmtDate(f)} – ${fmtDate(l)}`;
}

// Ikon pegangan seret (penuh, tidak bergantung pada font Unicode)
function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      aria-hidden
      className={cn("shrink-0 text-ink-faint", className)}
      fill="currentColor"
    >
      <circle cx="6" cy="3.5" r="1.1" />
      <circle cx="10" cy="3.5" r="1.1" />
      <circle cx="6" cy="8" r="1.1" />
      <circle cx="10" cy="8" r="1.1" />
      <circle cx="6" cy="12.5" r="1.1" />
      <circle cx="10" cy="12.5" r="1.1" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Struktur & Drill tab
// ─────────────────────────────────────────────────────────────

function StructureTab({
  program,
  bank,
}: {
  program: BuilderProgram;
  bank: BankDrill[];
}) {
  const router = useRouter();
  const [activeCycle, setActiveCycle] = useState(program.cycles[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [overSessionId, setOverSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const cycle = program.cycles.find((c) => c.id === activeCycle) ?? null;

  const filteredBank = useMemo(
    () =>
      bank.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.subCategory.toLowerCase().includes(query.toLowerCase()),
      ),
    [bank, query],
  );

  const onDragStart = useCallback(
    (e: React.DragEvent, drillId: string) => {
      e.dataTransfer.setData("text/plain", drillId);
      e.dataTransfer.effectAllowed = "copy";
    },
    [],
  );

  const onDrop = useCallback(
    (e: React.DragEvent, sessionId: string) => {
      e.preventDefault();
      setOverSessionId(null);
      const drillId = e.dataTransfer.getData("text/plain");
      if (!drillId) return;
      setBusy(sessionId);
      addDrillToSession(sessionId, drillId, program.id)
        .then((res) => {
          if (!res.ok) {
            console.error(res.error ?? "Gagal menambahkan drill");
          }
          setBusy(null);
          router.refresh();
        })
        .catch(() => {
          setBusy(null);
        });
    },
    [program.id, router],
  );

  const onRemove = useCallback(
    (sessionId: string, drillId: string) => {
      removeDrillFromSession(sessionId, drillId, program.id)
        .then(() => router.refresh())
        .catch(() => {});
    },
    [program.id, router],
  );

  return (
    <>
      {program.phases.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-small font-bold">Timeline periodisasi</p>
            <span className="text-tiny text-ink-faint">
              {phaseDateRange(program.phases)}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {program.phases.map((ph, i) => (
              <div key={ph.id} className="flex items-center gap-2 sm:flex-1">
                <div
                  className={cn(
                    "flex-1 rounded-xl border-l-4 px-3 py-2.5",
                    i === 0
                      ? "border-primary bg-primary-faint"
                      : i === 1
                        ? "border-purple bg-purple-faint"
                        : "border-line-strong bg-canvas",
                  )}
                >
                  <p className="text-tiny font-bold">{ph.name}</p>
                  <p className="mt-0.5 text-[10px] text-ink-soft">
                    {fmtDate(ph.startDate)} → {fmtDate(ph.endDate)}
                  </p>
                  {ph.focusNotes ? (
                    <p className="mt-1 line-clamp-2 text-[10px] text-ink-faint">{ph.focusNotes}</p>
                  ) : null}
                </div>
                {i < program.phases.length - 1 ? (
                  <span className="hidden shrink-0 text-ink-faint sm:block">→</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {program.cycles.length === 0 ? (
            <p className="text-small text-ink-soft">Belum ada siklus untuk program ini.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {program.cycles.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCycle(c.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-small font-medium transition-colors",
                      c.id === activeCycle ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-neutral-soft",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {cycle?.sessions.length === 0 ? (
                <p className="text-small text-ink-soft">Tidak ada sesi pada minggu ini.</p>
              ) : (
                cycle?.sessions.map((session) => (
                  <div
                    key={session.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      setOverSessionId(session.id);
                    }}
                    onDragLeave={() => setOverSessionId((v) => (v === session.id ? null : v))}
                    onDrop={(e) => onDrop(e, session.id)}
                    className={cn(
                      "mb-4 rounded-2xl border bg-panel shadow-sm transition-colors",
                      overSessionId === session.id
                        ? "border-primary ring-2 ring-primary-soft"
                        : "border-line",
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3 p-4 pb-0">
                      <div>
                        <p className="text-small font-bold">{session.name}</p>
                        <p className="mt-0.5 text-tiny text-ink-soft">
                          {session.dateLabel} · {session.durationMinutes} menit
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-tiny font-semibold uppercase tracking-wide text-primary">Tim</span>
                    </div>
                    <div className="space-y-1.5 p-4 pt-3">
                      {session.drills.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-line-strong bg-canvas px-3 py-4 text-center text-tiny text-ink-faint">
                          Seret drill dari Bank Materi ke sini.
                        </p>
                      ) : (
                        session.drills.map((drill) => (
                          <div
                            key={drill.drillId ?? drill.id}
                            className="group flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-tiny"
                          >
                            <span className="min-w-0">
                              <span className="mr-2 inline-flex align-middle"><GripIcon /></span>
                              <span className="font-medium text-ink">{drill.drillName}</span>
                              <span className="ml-2 text-ink-faint">{drill.subCategory}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-ink-soft">{drill.targetText}</span>
                              <button
                                type="button"
                                onClick={() => onRemove(session.id, drill.drillId)}
                                title="Hapus drill dari sesi"
                                className="rounded text-ink-faint transition-colors hover:text-danger"
                              >
                                <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                                  <path d="M3 3l10 10M13 3L3 13" />
                                </svg>
                              </button>
                            </span>
                          </div>
                        ))
                      )}
                      {busy === session.id ? (
                        <p className="py-1 text-center text-tiny text-primary">Menambahkan drill...</p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
                <p className="text-small font-bold">
                  Blok individu — 15 menit{" "}
                  <span className="font-normal text-ink-soft">(beda per posisi)</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary-faint px-3 py-1 text-tiny font-medium text-primary">Guard: ball handling</span>
                  <span className="rounded-full bg-purple-faint px-3 py-1 text-tiny font-medium text-purple">Big: post move</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
            <p className="mb-1 text-small font-bold">Bank Materi Latihan</p>
            <p className="mb-3 text-tiny text-ink-soft">
              Seret drill ke salah satu sesi untuk menyusun program.
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari drill..."
              className="mb-3 w-full rounded-lg border border-line-strong bg-panel px-3 py-2 text-small text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
            />
            <div className="space-y-1.5">
              {filteredBank.length === 0 ? (
                <p className="py-2 text-center text-tiny text-ink-faint">Tidak ada drill yang cocok.</p>
              ) : (
                filteredBank.map((d) => (
                  <div
                    key={d.id}
                    draggable={!busy}
                    onDragStart={(e) => onDragStart(e, d.id)}
                    className="flex cursor-grab items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2 text-tiny transition-colors hover:bg-neutral-soft active:cursor-grabbing"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 inline-flex align-middle"><GripIcon /></span>
                      <span className="font-medium text-ink">{d.name}</span>
                      <span className="ml-2 text-ink-faint">
                        {d.subCategory} ·{" "}
                        {d.difficulty === "pemula" ? "Pemula" : d.difficulty === "menengah" ? "Menengah" : "Lanjut"}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Playbook tab
// ─────────────────────────────────────────────────────────────

function PlaybookTab({
  program,
  templates,
}: {
  program: BuilderProgram;
  templates: TemplatePlay[];
}) {
  const [plays, setPlays] = useState<PlayData[]>(program.plays);
  const [activePlayId, setActivePlayId] = useState<string | null>(plays[0]?.id ?? null);
  const [creating, startCreate] = useTransition();

  const activePlay = plays.find((p) => p.id === activePlayId) ?? null;

  const handleCreate = () => {
    startCreate(async () => {
      const res = await createPlay(program.id, "Set Play Baru");
      if (res.ok && res.id) {
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <p className="text-small font-bold">Playbook — {program.name}</p>
          <p className="mt-0.5 text-tiny text-ink-soft">
            Susun formasi, pergerakan pemain, screen, dan cutting pada diagram lapangan.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating} size="sm">
          + Tambah play
        </Button>
      </div>

      {plays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-panel p-8 text-center">
          <p className="mb-2 text-small font-bold text-ink">Belum ada set play</p>
          <p className="mb-4 text-tiny text-ink-soft">
            Buat play baru, lalu gambar formasi &amp; pergerakan di atas diagram lapangan.
          </p>
          <Button onClick={handleCreate} disabled={creating} variant="soft" size="sm">
            Buat set play pertama
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {plays.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePlayId(p.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-tiny font-medium transition-colors",
                  p.id === activePlayId
                    ? "bg-primary text-white"
                    : "bg-canvas text-ink-soft hover:bg-neutral-soft",
                )}
              >
                {p.name}
                {p.elements.length > 0 ? (
                  <span className="ml-1 text-primary-dark">{p.elements.length}</span>
                ) : null}
              </button>
            ))}
          </div>

          {activePlay ? (
            <PlaybookEditor
              play={activePlay}
              programId={program.id}
              onSaved={(updated) => setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
              onDeleted={(id) => {
                setPlays((prev) => prev.filter((p) => p.id !== id));
                setActivePlayId((prev) => (prev === id ? null : prev));
              }}
            />
          ) : null}
        </>
      )}

      {templates.length > 0 ? (
        <PlayTemplateLibrary templates={templates} programId={program.id} />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Personal Program panel
// ─────────────────────────────────────────────────────────────

function PersonalProgramCard({ program }: { program: BuilderProgram }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-small font-bold">{program.name}</p>
            <p className="mt-0.5 text-tiny text-ink-soft">
              {program.description ?? "Program latihan individu tanpa siklus formal."}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-purple-faint px-2.5 py-0.5 text-tiny font-semibold text-purple">Personal</span>
        </div>
      </div>

      {program.cycles.length > 0 ? (
        <StructureTab program={program} bank={[]} />
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-panel p-6 text-center">
          <p className="mb-1 text-small font-bold text-ink">Struktur belum dibuat</p>
          <p className="text-tiny text-ink-soft">
            Program personal difokuskan ke drill individu yang dikerjakan lewat halaman sesi latihan atlet.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ProgramBuilder
// ─────────────────────────────────────────────────────────────

export function ProgramBuilder({
  teamPrograms,
  personalPrograms,
  bank,
  templates,
}: {
  teamPrograms: BuilderProgram[];
  personalPrograms: BuilderProgram[];
  bank: BankDrill[];
  templates: TemplatePlay[];
}) {
  const [mode, setMode] = useState<"team" | "personal">(
    teamPrograms.length > 0 ? "team" : "personal",
  );

  const activePrograms = mode === "team" ? teamPrograms : personalPrograms;
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    activePrograms[0]?.id ?? null,
  );
  const [teamTab, setTeamTab] = useState<"structure" | "playbook">("structure");

  const selected = activePrograms.find((p) => p.id === selectedProgramId) ?? activePrograms[0] ?? null;

  // Auto-select first program of selected mode
  const switchMode = (m: "team" | "personal") => {
    setMode(m);
    const progs = m === "team" ? teamPrograms : personalPrograms;
    setSelectedProgramId(progs[0]?.id ?? null);
    setTeamTab("structure");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight">Program Builder</h1>
          <p className="mt-1 text-small text-ink-soft">
            Susun program latihan: struktur siklus, drill, dan playbook.
          </p>
        </div>
        <Link
          href="/pelatih/kalender"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-small font-medium text-ink transition-colors hover:bg-neutral-soft"
        >
          📅 Lihat jadwal
        </Link>
      </div>

      {/* ── Toggle Personal / Tim ── */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-line-strong bg-canvas p-1 self-start">
        {(
          [
            ["team", "Program Tim"],
            ["personal", "Program Personal"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={cn(
              "rounded-lg px-4 py-2 text-small font-semibold transition-colors",
              mode === value
                ? "bg-panel text-ink shadow-sm"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Program selector ── */}
      {activePrograms.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {activePrograms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProgramId(p.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-tiny font-medium transition-colors",
                p.id === selected?.id
                  ? "border-primary bg-primary-faint text-primary"
                  : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        mode === "team" ? (
          <>
            {/* Team tabs */}
            <div className="mb-4 flex gap-1 border-b border-line pb-px">
              {(
                [
                  ["structure", "Struktur & Drill"],
                  ["playbook", "Playbook (diagram)"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTeamTab(key)}
                  className={cn(
                    "border-b-2 px-4 py-2.5 text-small font-medium transition-colors",
                    teamTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {teamTab === "structure" ? (
              <StructureTab program={selected} bank={bank} />
            ) : (
              <PlaybookTab program={selected} templates={templates} />
            )}
          </>
        ) : (
          <PersonalProgramCard program={selected} />
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-panel p-8 text-center">
          <p className="text-small text-ink-soft">Tidak ada program untuk kategori ini.</p>
        </div>
      )}
    </div>
  );
}

