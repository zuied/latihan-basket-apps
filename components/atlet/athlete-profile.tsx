"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { ReadinessManager } from "./readiness-manager";
import { recoverInjury } from "@/app/(app)/pelatih/atlet/injury-actions";

export type AthleteProfileData = {
  athleteId: string;
  fullName: string;
  position: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  teamName: string | null;
  jerseyNumber: string | null;
  readiness: "full" | "limited" | "rest" | null;
  activeInjuries: {
    id: string;
    bodyPart: string;
    injuryType: string;
    severity: string;
    startDate: string;
    resolvedDate: string | null;
    notes: string | null;
    status: string;
  }[];
  programs: {
    id: string;
    name: string;
    type: string;
    status: string;
  }[];
  baseline: {
    list: {
      id: string;
      drillName: string;
      subCategory: string;
      actualValue: number;
      unit: string | null;
    }[];
    conductedAt: string | null;
  } | null;
  loadByWeek: {
    label: string;
    minutes: number;
  }[];
  sessionHistory: {
    id: string;
    sessionName: string;
    date: string;
    attendanceStatus: string;
    rpe: number | null;
    durationMinutes: number;
    drillCount: number;
  }[];
  performanceTrend: {
    rpeByWeek: { label: string; avgRpe: number }[];
    attendanceByWeek: { label: string; total: number; attended: number }[];
    completionRate: number | null;
  };
};

const TABS = ["Ringkasan", "Program aktif", "Riwayat sesi", "Riwayat cedera", "Asesmen"] as const;
type Tab = (typeof TABS)[number];

export function AthleteProfile({ data }: { data: AthleteProfileData }) {
  const [tab, setTab] = useState<Tab>("Ringkasan");

  const readinessLabel =
    data.readiness === "full"
      ? "Latihan penuh"
      : data.readiness === "limited"
        ? "Latihan dibatasi"
        : data.readiness === "rest"
          ? "Istirahat"
          : null;

  const readinessTone =
    data.readiness === "full"
      ? "bg-success-soft text-success"
      : data.readiness === "limited"
        ? "bg-warning-soft text-warning"
        : "bg-danger-soft text-danger";

  const maxLoad = Math.max(...data.loadByWeek.map((w) => w.minutes), 1);

  const field = (label: string, value: string | null) => (
    <div className="rounded-lg bg-canvas px-3 py-2">
      <p className="text-tiny text-ink-faint">{label}</p>
      <p className="text-small font-medium text-ink">{value ?? "—"}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        Profil Atlet
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight">
            {data.fullName}
          </h1>
          <p className="mt-1 text-small text-ink-soft">
            {data.position ?? "Posisi belum diisi"}
            {data.teamName ? ` · ${data.teamName}` : ""}
          </p>
        </div>
        {readinessLabel ? (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-tiny font-semibold",
              readinessTone,
            )}
          >
            {readinessLabel}
          </span>
        ) : null}
        <ReadinessManager athleteId={data.athleteId} currentStatus={data.readiness} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3 pb-2.5 pt-1 text-small font-medium transition-colors",
              tab === t
                ? "text-primary"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {t}
            {tab === t ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "Ringkasan" ? (
        <div className="mt-5 space-y-6">
          <section>
            <h2 className="mb-3 text-h4 font-bold tracking-tight">Data dasar</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {field("Posisi", data.position)}
              {field("No. punggung", data.jerseyNumber)}
              {field(
                "Tinggi",
                data.heightCm ? `${data.heightCm} cm` : null,
              )}
              {field("Berat", data.weightKg ? `${data.weightKg} kg` : null)}
            </div>
          </section>

          <section>
            <div className="mb-1 flex items-end justify-between">
              <h2 className="text-h4 font-bold tracking-tight">
                Beban latihan — 4 minggu terakhir
              </h2>
              <span className="text-tiny text-ink-faint">
                satuan: menit
              </span>
            </div>
            <div className="mt-3 rounded-2xl border border-line bg-panel p-4 shadow-sm">
              <div className="flex h-32 items-end gap-2.5">
                {data.loadByWeek.map((w) => (
                  <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-tiny font-medium text-ink-soft">
                      {w.minutes}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60",
                        w.minutes === 0 && "h-0.5",
                      )}
                      style={{
                        height: `${Math.max((w.minutes / maxLoad) * 100, 2)}%`,
                      }}
                    />
                    <span className="text-tiny text-ink-faint">{w.label}</span>
                  </div>
                ))}
              </div>
              {data.loadByWeek.at(-1) && data.loadByWeek[1] &&
                data.loadByWeek.at(-1)!.minutes > data.loadByWeek[1].minutes * 1.5 &&
                data.loadByWeek[1].minutes > 0 ? (
                <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-tiny text-warning">
                  ⚠ Beban pekan ini naik signifikan dibanding pekan sebelumnya. Perhatikan recovery.
                </p>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-h4 font-bold tracking-tight">Tren performa</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
                <p className="text-tiny text-ink-faint">RPE rata-rata</p>
                <p className="mt-1 text-h3 font-bold text-accent">
                  {data.performanceTrend.rpeByWeek.at(-1)?.avgRpe ?? 0}
                </p>
                <p className="text-tiny text-ink-faint">minggu ini (1-10)</p>
              </div>
              <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
                <p className="text-tiny text-ink-faint">Kehadiran</p>
                <p className="mt-1 text-h3 font-bold text-success">
                  {(() => {
                    const a = data.performanceTrend.attendanceByWeek.at(-1);
                    return a && a.total > 0
                      ? `${Math.round((a.attended / a.total) * 100)}%`
                      : "—";
                  })()}
                </p>
                <p className="text-tiny text-ink-faint">minggu ini</p>
              </div>
              <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
                <p className="text-tiny text-ink-faint">Kelengkapan drill</p>
                <p className="mt-1 text-h3 font-bold text-purple">
                  {data.performanceTrend.completionRate !== null
                    ? `${data.performanceTrend.completionRate}%`
                    : "—"}
                </p>
                <p className="text-tiny text-ink-faint">28 hari terakhir</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "Program aktif" ? (
        <div className="mt-5 space-y-2">
          {data.programs.length === 0 ? (
            <p className="text-small text-ink-soft">Belum ada program aktif.</p>
          ) : (
            data.programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <div>
                  <p className="text-small font-bold">{p.name}</p>
                  <p className="mt-0.5 text-tiny text-ink-soft">
                    {p.type === "team" ? "Tim" : "Personal"} ·{" "}
                    {p.status === "active" ? "Berlangsung" : p.status}
                  </p>
                </div>
                <span className="rounded-full bg-primary-faint px-2.5 py-0.5 text-tiny font-semibold text-primary">
                  Aktif
                </span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "Riwayat sesi" ? (
        <div className="mt-5">
          {data.sessionHistory.length === 0 ? (
            <p className="text-small text-ink-soft">Belum ada riwayat sesi.</p>
          ) : (
            <div className="space-y-2">
              {data.sessionHistory.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-bold">{s.sessionName}</p>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      {new Date(s.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {s.durationMinutes} menit · {s.drillCount} drill
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.rpe !== null ? (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                        RPE {s.rpe}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.attendanceStatus === "present"
                          ? "bg-success-soft text-success"
                          : s.attendanceStatus === "late"
                            ? "bg-warning-soft text-warning"
                            : s.attendanceStatus === "absent"
                              ? "bg-danger-soft text-danger"
                              : "bg-neutral-soft text-ink-soft",
                      )}
                    >
                      {s.attendanceStatus === "present"
                        ? "Hadir"
                        : s.attendanceStatus === "late"
                          ? "Terlambat"
                          : s.attendanceStatus === "absent"
                            ? "Absen"
                            : "Izin"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "Riwayat cedera" ? (
        <div className="mt-5 space-y-2">
          {data.activeInjuries.length === 0 ? (
            <p className="text-small text-ink-soft">
              Tidak ada catatan cedera.
            </p>
          ) : (
            data.activeInjuries.map((i) => (
              <InjuryCard key={i.id} injury={i} />
            ))
          )}
        </div>
      ) : null}

      {tab === "Asesmen" ? (
        <div className="mt-5 space-y-6">
          <section>
            <h2 className="mb-1 text-h4 font-bold tracking-tight">
              Baseline asesmen awal
            </h2>
            <p className="mb-3 text-tiny text-ink-soft">
              {data.baseline?.conductedAt
                ? `Diuji ${new Date(data.baseline.conductedAt).toLocaleDateString("id-ID")}`
                : "Belum ada hasil asesmen."}
            </p>
            {data.baseline && data.baseline.list.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.baseline.list.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-line bg-panel p-3 shadow-sm"
                  >
                    <p className="text-tiny text-ink-soft">
                      {b.drillName}
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-ink-faint">
                        {b.subCategory}
                      </span>
                    </p>
                    <p className="mt-2 text-h4 font-bold text-primary">
                      {b.actualValue}
                      <span className="ml-1 text-tiny font-medium text-ink-faint">
                        {b.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-small text-ink-soft">
                Belum ada data asesmen.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InjuryCard({
  injury,
}: {
  injury: AthleteProfileData["activeInjuries"][number];
}) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState(injury.status === "resolved");

  const isActive = injury.status === "active" && !resolved;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-small font-bold">
            {injury.bodyPart} — {injury.injuryType}
          </p>
          <p className="mt-0.5 text-tiny text-ink-soft">
            Sejak {new Date(injury.startDate).toLocaleDateString("id-ID")} ·{" "}
            {injury.severity}
            {injury.resolvedDate || resolved
              ? ` · Sembuh ${new Date(injury.resolvedDate!).toLocaleDateString("id-ID")}`
              : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-tiny font-semibold",
            isActive
              ? "bg-warning-soft text-warning"
              : "bg-success-soft text-success",
          )}
        >
          {isActive ? "Aktif" : "Sembuh"}
        </span>
      </div>
      {injury.notes ? (
        <p className="mt-2 text-tiny text-ink-soft">{injury.notes}</p>
      ) : null}
      {isActive ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await recoverInjury(injury.id);
              if (res.ok) setResolved(true);
            })
          }
          className="mt-3 rounded-lg border border-success/30 px-3 py-1.5 text-tiny font-medium text-success transition-colors hover:bg-success-faint disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Tandai sembuh"}
        </button>
      ) : null}
    </div>
  );
}