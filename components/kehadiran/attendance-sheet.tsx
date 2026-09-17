"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { saveAttendance } from "@/app/(app)/pelatih/kehadiran/actions";

export type AttendanceSheetAthlete = {
  athleteId: string;
  fullName: string;
  jerseyNumber: string | null;
  position: string | null;
  readiness: "full" | "limited" | "rest" | null;
  activeInjury: string | null;
  savedStatus: "present" | "late" | "absent" | null;
};

export type AttendanceSheetSession = {
  id: string;
  name: string;
};

const STATUSES = [
  { value: "present", label: "Hadir", icon: "✓", active: "bg-success text-white", soft: "bg-success-soft text-success-strong" },
  { value: "late", label: "Terlambat", icon: "⏰", active: "bg-warning text-white", soft: "bg-warning-soft text-warning" },
  { value: "absent", label: "Absen", icon: "✕", active: "bg-danger text-white", soft: "bg-danger-soft text-danger-strong" },
] as const;

export function AttendanceSheet({
  session,
  athletes,
}: {
  session: AttendanceSheetSession;
  athletes: AttendanceSheetAthlete[];
}) {
  const [picked, setPicked] = useState<Map<string, (typeof STATUSES)[number]["value"]>>(
    () => {
      const m = new Map<string, (typeof STATUSES)[number]["value"]>();
      for (const a of athletes) if (a.savedStatus) m.set(a.athleteId, a.savedStatus);
      return m;
    },
  );
  const [busy, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const statusOf = (id: string) =>
    picked.get(id) ??
    athletes.find((a) => a.athleteId === id)?.savedStatus ??
    null;

  const count = (v: (typeof STATUSES)[number]["value"]) =>
    athletes.filter((a) => statusOf(a.athleteId) === v).length;
  const undefinedCount = athletes.length - count("present") - count("late") - count("absent");

  async function submit() {
    const entries = [...picked.entries()].map(([athleteId, status]) => ({
      sessionId: session.id,
      athleteId,
      status,
    }));
    if (entries.length === 0) {
      setNotice("Belum ada status yang dipilih.");
      return;
    }
    startTransition(async () => {
      const res = await saveAttendance(entries);
      if (res.ok) {
        setNotice("Kehadiran tersimpan.");
      } else {
        setNotice(res.error ?? "Gagal menyimpan.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Ringkasan angka di atas biar gambaran cepat sebelum menelusuri satu per satu. */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {STATUSES.map((s) => (
          <div
            key={s.value}
            className="flex items-center gap-2 rounded-2xl border border-line bg-panel p-2.5"
          >
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-tiny font-bold text-white", s.active)}>
              {s.icon}
            </span>
            <div>
              <p className="text-h3 leading-none">{count(s.value)}</p>
              <p className="text-tiny text-ink-soft">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {athletes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-panel px-6 py-12 text-center">
          <p className="text-base font-semibold">Belum ada atlet aktif</p>
          <p className="mx-auto mt-1 max-w-sm text-small text-ink-soft">
            Kehadiran bisa diisi setelah ada atlet yang bergabung dengan tim ini.
          </p>
        </div>
      ) : (
        <>
          {undefinedCount > 0 ? (
            <p className="mb-3 rounded-xl bg-warning-soft px-3 py-2 text-tiny text-warning">
              ⚠️ {undefinedCount} atlet belum diberi status.
            </p>
          ) : null}

          <ul className="space-y-2.5">
            {athletes.map((a) => {
              const sel = statusOf(a.athleteId);
              return (
                <li key={a.athleteId} className="rounded-2xl border border-line bg-panel p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-small font-bold">{a.fullName}</p>
                      <p className="mt-0.5 text-tiny text-ink-soft">
                        {a.jerseyNumber ? `#${a.jerseyNumber} · ` : ""}
                        {a.position ?? "Posisi belum diisi"}
                      </p>
                      {a.readiness ? (
                        <p className="mt-0.5 text-tiny">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-tiny font-semibold",
                              a.readiness === "full"
                                ? "bg-success-soft text-success"
                                : a.readiness === "limited"
                                  ? "bg-warning-soft text-warning"
                                  : "bg-danger-soft text-danger",
                            )}
                          >
                            {a.readiness === "full"
                              ? "Siap"
                              : a.readiness === "limited"
                                ? "Latihan dibatasi"
                                : "Istirahat"}
                            {a.activeInjury ? ` · ${a.activeInjury}` : ""}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {STATUSES.map((s) => {
                        const active = sel === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setPicked((p) => {
                              const next = new Map(p);
                              if (next.get(a.athleteId) === s.value) next.delete(a.athleteId);
                              else next.set(a.athleteId, s.value);
                              return next;
                            })}
                            aria-pressed={active}
                            aria-label={`${a.fullName}: ${s.label}`}
                            className={cn(
                              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-tiny font-bold transition-colors",
                              active
                                ? cn("border-transparent text-white", s.active)
                                : cn("border-line bg-canvas text-ink-soft hover:border-line-strong", s.soft),
                            )}
                          >
                            <span aria-hidden className="text-[11px]">{s.icon}</span>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-4 mt-5">
            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy ? "Menyimpan…" : `Simpan Kehadiran (${picked.size} dicentang)`}
            </Button>
            {notice ? (
              <p className="mt-2 text-center text-tiny text-ink-soft">{notice}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
