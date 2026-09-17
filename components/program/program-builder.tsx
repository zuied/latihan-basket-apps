"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateProgramModal } from "@/components/program/create-program-modal";
import { PlaybookEditor, type PlayData } from "@/components/playbook/court-editor";
import { PlayTemplateLibrary, type TemplatePlay } from "@/components/playbook/play-template-library";
import { createPlay, addDrillToSession, removeDrillFromSession, setDrillScope, reorderSessionDrills, saveAsTemplate, cloneProgram, setDrillTarget } from "@/app/(app)/pelatih/program/actions";

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
    drills: BuilderDrill[];
  }[];
};

export type BuilderDrill = {
  id: string;
  drillId: string;
  drillName: string;
  subCategory: string;
  targetText: string;
  targetValue: number | null;
  targetUnit: string | null;
  isMandatory: boolean;
  assignedPositions: string[];
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
  isTemplate: boolean;
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
  positions: string[];
};

export type ProgramTemplate = {
  id: string;
  name: string;
  description: string | null;
  type: string;
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

// Warna badge konsisten per posisi (program berlapis — spec wireframe 3.4)
function positionStyle(pos: string): string {
  const p = pos.toLowerCase();
  if (p.includes("guard")) return "bg-primary-faint text-primary";
  if (p.includes("forward") || p.includes("wing")) return "bg-purple-faint text-purple";
  if (p.includes("center") || p.includes("big") || p.includes("post")) return "bg-warning-faint text-warning";
  return "bg-neutral-soft text-ink-soft";
}

function BlockLabel({
  dotClass,
  children,
  count,
}: {
  dotClass: string;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <div className="mb-1.5 mt-1 flex items-center gap-1.5 text-tiny">
      <span className={cn("size-2 rounded-full", dotClass)} />
      <span className="font-bold text-ink">{children}</span>
      <span className="text-ink-faint">{count} drill</span>
    </div>
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
  const [scopeBusy, setScopeBusy] = useState<string | null>(null);
  const [dragDrill, setDragDrill] = useState<{ id: string; block: "mandatory" | "positional" } | null>(null);

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

  const onToggleScope = useCallback(
    (drill: BuilderDrill, scope: "mandatory" | "positional") => {
      setScopeBusy(drill.id);
      setDrillScope(drill.id, program.id, scope)
        .then((res) => {
          if (!res.ok) {
            console.error(res.error ?? "Gagal mengubah cakupan drill");
          }
          setScopeBusy(null);
          router.refresh();
        })
        .catch(() => {
          setScopeBusy(null);
        });
    },
    [program.id, router],
  );

  const onSetTarget = useCallback(
    (drill: BuilderDrill, value: string) => {
      const num = value.trim() === "" ? null : parseFloat(value);
      if (num !== null && Number.isNaN(num)) return;
      const unit = drill.targetUnit ?? "reps";
      setDrillTarget(drill.id, program.id, num, unit)
        .then((res) => {
          if (!res.ok) console.error(res.error ?? "Gagal mengubah target");
          router.refresh();
        })
        .catch(() => {});
    },
    [program.id, router],
  );

  // Fallback "tap untuk tambah" — drag-and-drop tidak tersedia di layar sentuh
  const onAdd = useCallback(
    (drillId: string) => {
      const sessionId = cycle?.sessions[0]?.id;
      if (!sessionId) return;
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
    [cycle, program.id, router],
  );

  // Urutkan ulang drill di dalam satu blok (spec wireframe 3.4: ikon grip)
  const onDrillDragStart = useCallback(
    (e: React.DragEvent, drillId: string, block: "mandatory" | "positional") => {
      e.stopPropagation();
      e.dataTransfer.setData("application/x-session-drill", drillId);
      e.dataTransfer.effectAllowed = "move";
      setDragDrill({ id: drillId, block });
    },
    [],
  );

  const onDrillDragOver = useCallback(
    (e: React.DragEvent, block: "mandatory" | "positional") => {
      if (dragDrill && dragDrill.block === block) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [dragDrill],
  );

  const onDrillDrop = useCallback(
    (
      e: React.DragEvent,
      sessionId: string,
      targetId: string,
      block: "mandatory" | "positional",
      blockDrills: BuilderDrill[],
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragDrill(null);
      if (!dragDrill || dragDrill.block !== block || dragDrill.id === targetId) return;
      const ids = blockDrills.map((d) => d.id).filter((id) => id !== dragDrill.id);
      const idx = ids.indexOf(targetId);
      ids.splice(idx < 0 ? ids.length : idx, 0, dragDrill.id);
      reorderSessionDrills(sessionId, program.id, ids)
        .then((res) => {
          if (!res.ok) console.error(res.error ?? "Gagal mengurutkan drill");
          router.refresh();
        })
        .catch(() => {});
    },
    [dragDrill, program.id, router],
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
              <div className="mb-4 rounded-xl border border-line bg-panel p-3">
                <p className="text-tiny font-bold">Program berlapis</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-tiny text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" /> Wajib semua
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-purple" /> Individu per posisi
                  </span>
                </div>
                <p className="mt-1 text-tiny text-ink-faint">
                  Drill berposisi spesifik masuk blok per posisi; ganti cakupan lewat tombol kecil di baris drill.
                </p>
              </div>

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
                    <div className="p-4 pt-3">
                      {session.drills.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-line-strong bg-canvas px-3 py-4 text-center text-tiny text-ink-faint">
                          Belum ada drill. Tambahkan lewat tombol + di Bank Materi.
                        </p>
                      ) : (
                        (() => {
                          const mandatory = session.drills.filter(
                            (dd) => dd.isMandatory || dd.assignedPositions.length === 0,
                          );
                          const positional = session.drills.filter(
                            (dd) => !dd.isMandatory && dd.assignedPositions.length > 0,
                          );
                          return (
                            <div className="space-y-1.5">
                              <BlockLabel dotClass="bg-primary" count={mandatory.length}>
                                Wajib semua
                              </BlockLabel>
                              {mandatory.length === 0 ? (
                                <p className="rounded-lg bg-canvas px-3 py-2 text-tiny text-ink-faint">
                                  Tidak ada drill wajib di sesi ini.
                                </p>
                              ) : (
                                mandatory.map((drill) => (
                                  <div
                                    key={drill.id}
                                    draggable
                                    onDragStart={(e) => onDrillDragStart(e, drill.id, "mandatory")}
                                    onDragOver={(e) => onDrillDragOver(e, "mandatory")}
                                    onDragEnd={() => setDragDrill(null)}
                                    onDrop={(e) => onDrillDrop(e, session.id, drill.id, "mandatory", mandatory)}
                                    className={cn(
                                      "group flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-tiny",
                                      dragDrill?.id === drill.id && "opacity-50",
                                    )}
                                  >
                                    <span className="min-w-0">
                                      <span className="mr-2 inline-flex cursor-grab align-middle active:cursor-grabbing" title="Seret untuk mengurutkan">
                                        <GripIcon />
                                      </span>
                                      <span className="font-medium text-ink">{drill.drillName}</span>
                                      <span className="ml-2 text-ink-faint">{drill.subCategory}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                      <input
                                        type="text"
                                        defaultValue={drill.targetValue ?? ""}
                                        placeholder="target"
                                        onBlur={(e) => onSetTarget(drill, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        className="w-16 rounded border border-line bg-panel px-1.5 py-0.5 text-right text-[11px] tabular-nums text-ink-soft focus:border-primary focus:outline-none"
                                        title="Klik untuk mengubah target"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => onToggleScope(drill, "positional")}
                                        disabled={scopeBusy === drill.id}
                                        className="rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-semibold text-ink-soft transition-colors hover:border-purple hover:text-purple disabled:opacity-40"
                                        title="Alihkan ke blok individu per posisi"
                                      >
                                        {scopeBusy === drill.id ? "…" : "Bagi per posisi"}
                                      </button>
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

                              {positional.length > 0 ? (
                                <>
                                  <BlockLabel dotClass="bg-purple" count={positional.length}>
                                    Individu per posisi
                                  </BlockLabel>
                                  {positional.map((drill) => (
                                    <div
                                      key={drill.id}
                                      draggable
                                      onDragStart={(e) => onDrillDragStart(e, drill.id, "positional")}
                                      onDragOver={(e) => onDrillDragOver(e, "positional")}
                                      onDragEnd={() => setDragDrill(null)}
                                      onDrop={(e) => onDrillDrop(e, session.id, drill.id, "positional", positional)}
                                      className={cn(
                                        "group flex items-center justify-between gap-3 rounded-lg bg-purple-faint px-3 py-2 text-tiny",
                                        dragDrill?.id === drill.id && "opacity-50",
                                      )}
                                    >
                                      <span className="min-w-0">
                                        <span className="mr-2 inline-flex cursor-grab align-middle active:cursor-grabbing" title="Seret untuk mengurutkan">
                                          <GripIcon />
                                        </span>
                                        <span className="font-medium text-ink">{drill.drillName}</span>
                                        <span className="ml-2 text-ink-faint">{drill.subCategory}</span>
                                        <span className="ml-2 inline-flex items-center gap-1 align-middle">
                                          {drill.assignedPositions.map((pos) => (
                                            <span
                                              key={pos}
                                              className={cn(
                                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                positionStyle(pos),
                                              )}
                                            >
                                              {pos}
                                            </span>
                                          ))}
                                        </span>
                                      </span>
                                      <span className="flex shrink-0 items-center gap-2">
                                        <input
                                          type="text"
                                          defaultValue={drill.targetValue ?? ""}
                                          placeholder="target"
                                          onBlur={(e) => onSetTarget(drill, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          className="w-16 rounded border border-line bg-panel px-1.5 py-0.5 text-right text-[11px] tabular-nums text-ink-soft focus:border-primary focus:outline-none"
                                          title="Klik untuk mengubah target"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => onToggleScope(drill, "mandatory")}
                                          disabled={scopeBusy === drill.id}
                                          className="rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                                          title="Alihkan ke blok wajib semua"
                                        >
                                          {scopeBusy === drill.id ? "…" : "Wajib semua"}
                                        </button>
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
                                  ))}
                                </>
                              ) : null}
                            </div>
                          );
                        })()
                      )}
                      {busy === session.id ? (
                        <p className="py-1 text-center text-tiny text-primary">Menambahkan drill...</p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div>
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
            <p className="mb-1 text-small font-bold">Bank Materi Latihan</p>
            <p className="mb-3 text-tiny text-ink-soft">
              Seret drill ke sesi, atau ketuk <span className="font-semibold">+</span> untuk
              menambah ke sesi pertama minggu aktif.
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
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center">
                        <span className="mr-2 inline-flex align-middle"><GripIcon /></span>
                        <span className="truncate font-medium text-ink">{d.name}</span>
                      </span>
                      <span className="ml-1 mt-0.5 flex flex-wrap items-center gap-1">
                        <span className="text-ink-faint">
                          {d.subCategory} ·{" "}
                          {d.difficulty === "pemula" ? "Pemula" : d.difficulty === "menengah" ? "Menengah" : "Lanjut"}
                        </span>
                        {d.positions.map((pos) => (
                          <span
                            key={pos}
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                              positionStyle(pos),
                            )}
                          >
                            {pos}
                          </span>
                        ))}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdd(d.id)}
                      disabled={busy !== null || !cycle?.sessions[0]}
                      title={
                        cycle?.sessions[0]
                          ? `Tambahkan ke ${cycle.sessions[0].name}`
                          : "Pilih minggu yang punya sesi dulu"
                      }
                      aria-label={`Tambahkan ${d.name} ke sesi`}
                      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                    >
                      <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </button>
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
  const router = useRouter();
  const [plays, setPlays] = useState<PlayData[]>(program.plays);
  const [activePlayId, setActivePlayId] = useState<string | null>(plays[0]?.id ?? null);
  const [creating, startCreate] = useTransition();

  const activePlay = plays.find((p) => p.id === activePlayId) ?? null;

  const handleCreate = () => {
    startCreate(async () => {
      const res = await createPlay(program.id, "Set Play Baru");
      if (res.ok && res.id) {
        const newPlay: PlayData = {
          id: res.id,
          name: "Set Play Baru",
          description: null,
          elements: [],
        };
        setPlays((prev) => [...prev, newPlay]);
        setActivePlayId(res.id);
        router.refresh();
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
              key={activePlay.id}
              play={activePlay}
              onSaved={(updated) => setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
              onDeleted={(id) => {
                setPlays((prev) => prev.filter((p) => p.id !== id));
                setActivePlayId((prev) => (prev === id ? null : prev));
              }}
              onCreate={handleCreate}
            />
          ) : null}
        </>
      )}

      {templates.length > 0 ? (
        <PlayTemplateLibrary
          templates={templates}
          programId={program.id}
          onCloned={(p) => {
            setPlays((prev) => [...prev, p as PlayData]);
            setActivePlayId(p.id);
          }}
        />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Personal Program panel
// ─────────────────────────────────────────────────────────────

function PersonalProgramCard({
  program,
  bank,
  templates,
}: {
  program: BuilderProgram;
  bank: BankDrill[];
  templates: TemplatePlay[];
}) {
  const [tab, setTab] = useState<"structure" | "playbook">("structure");

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

      <div className="flex gap-1 border-b border-line pb-px">
        {(
          [
            ["structure", "Struktur & Drill"],
            ["playbook", "Playbook (diagram)"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-small font-medium transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "structure" ? (
        program.cycles.length > 0 ? (
          <StructureTab program={program} bank={bank} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong bg-panel p-6 text-center">
            <p className="mb-1 text-small font-bold text-ink">Struktur belum dibuat</p>
            <p className="mb-3 text-tiny text-ink-soft">
              Buat siklus & sesi baru, atau langsung tambahkan drill dari Bank Materi
              saat siklus sudah tersedia.
            </p>
            <p className="text-tiny text-ink-faint">
              Program personal bisa dikerjakan atlet lewat halaman sesi latihan.
            </p>
          </div>
        )
      ) : (
        <PlaybookTab program={program} templates={templates} />
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
  programTemplates,
}: {
  teamPrograms: BuilderProgram[];
  personalPrograms: BuilderProgram[];
  bank: BankDrill[];
  templates: TemplatePlay[];
  programTemplates: ProgramTemplate[];
}) {
  const [mode, setMode] = useState<"team" | "personal">(
    teamPrograms.length > 0 ? "team" : "personal",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneTargetId, setCloneTargetId] = useState<string | null>(null);
  const router = useRouter();

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
    <>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight">Program Builder</h1>
          <p className="mt-1 text-small text-ink-soft">
            Susun program latihan: struktur siklus, drill, dan playbook.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>+ Buat program</Button>
          {selected && !selected.isTemplate ? (
            <Button
              variant="secondary"
              disabled={templateBusy}
              onClick={async () => {
                setTemplateBusy(true);
                await saveAsTemplate(selected.id);
                setTemplateBusy(false);
                router.refresh();
              }}
            >
              {templateBusy ? "Menyimpan…" : "📐 Simpan sebagai Template"}
            </Button>
          ) : null}
          {selected?.isTemplate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-tiny font-semibold text-primary">
              📐 Template
            </span>
          ) : null}
          <Link
            href="/pelatih/kalender"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-small font-medium text-ink transition-colors hover:bg-neutral-soft"
          >
            📅 Lihat jadwal
          </Link>
        </div>
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

      {/* ── Template browser ── */}
      {programTemplates.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <h3 className="mb-2 text-small font-bold tracking-tight">📐 Template Program</h3>
          <p className="mb-3 text-tiny text-ink-soft">
            Gunakan template untuk membuat program baru dengan struktur yang sudah ada.
          </p>
          <div className="flex flex-wrap gap-2">
            {programTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-small font-semibold">{t.name}</p>
                  <p className="text-tiny text-ink-soft">{t.type === "team" ? "Tim" : "Personal"}</p>
                </div>
                {cloneTargetId === t.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      placeholder="Nama program baru"
                      className="w-36 rounded-lg border border-line bg-panel px-2 py-1 text-tiny focus:border-primary focus:outline-none"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        const result = await cloneProgram(t.id, cloneName || `Salinan: ${t.name}`);
                        if (result.ok && result.id) {
                          setCloneTargetId(null);
                          setCloneName("");
                          setSelectedProgramId(result.id);
                          router.refresh();
                        }
                      }}
                    >
                      Buat
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCloneTargetId(null)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setCloneTargetId(t.id);
                      setCloneName(`Salinan: ${t.name}`);
                    }}
                  >
                    Gunakan
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
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
              <StructureTab key={selected.id} program={selected} bank={bank} />
            ) : (
              <PlaybookTab key={selected.id} program={selected} templates={templates} />
            )}
          </>
        ) : (
          <PersonalProgramCard
            key={selected.id}
            program={selected}
            bank={bank}
            templates={templates}
          />
        )
      ) : teamPrograms.length === 0 && personalPrograms.length === 0 ? (
        <EmptyState
          title={
            mode === "team" ? "Belum ada program tim" : "Belum ada program personal"
          }
          description="Buat program baru untuk menyusun struktur latihan, atau ubah kategori di atas."
          action={
            <Button onClick={() => setCreateOpen(true)}>+ Buat program</Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-panel p-8 text-center">
          <p className="text-small text-ink-soft">
            Tidak ada program untuk kategori ini.
          </p>
        </div>
      )}
    </div>

    <CreateProgramModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={mode}
      />
    </>
  );
}

