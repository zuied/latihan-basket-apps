"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type AthleteProfileData = {
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
    notes: string | null;
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
};

const TABS = ["Ringkasan", "Program aktif", "Riwayat cedera", "Asesmen"] as const;
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

      {tab === "Riwayat cedera" ? (
        <div className="mt-5 space-y-2">
          {data.activeInjuries.length === 0 ? (
            <p className="text-small text-ink-soft">
              Tidak ada catatan cedera aktif.
            </p>
          ) : (
            data.activeInjuries.map((i) => (
              <div
                key={i.id}
                className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-small font-bold">
                      {i.bodyPart} — {i.injuryType}
                    </p>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      Sejak{" "}
                      {new Date(i.startDate).toLocaleDateString("id-ID")} ·{" "}
                      {i.severity}
                    </p>
                  </div>
                  <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-tiny font-semibold text-warning">
                    Aktif
                  </span>
                </div>
                {i.notes ? (
                  <p className="mt-2 text-tiny text-ink-soft">{i.notes}</p>
                ) : null}
              </div>
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