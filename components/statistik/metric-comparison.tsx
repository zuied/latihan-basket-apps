"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/* ── Metric definitions ─────────────────────────────────────────── */

type MetricKey =
  | "free-throw"
  | "scoring"
  | "ball-handling"
  | "agility"
  | "speed"
  | "completion";

interface MetricDef {
  key: MetricKey;
  label: string;
  subtitle: string;
  unit: string;
  sortAsc?: boolean;
  drills: string[];
}

const METRICS: MetricDef[] = [
  {
    key: "free-throw",
    label: "Free Throw %",
    subtitle: "Free Throw Routine",
    unit: "%",
    drills: ["free throw", "free-throw", "free_throw", "freethrow"],
  },
  {
    key: "scoring",
    label: "Scoring (Shooting)",
    subtitle: "Form Shooting · Mikan",
    unit: "%",
    drills: ["shooting", "mikan", "form shooting"],
  },
  {
    key: "ball-handling",
    label: "Ball Handling",
    subtitle: "Crossover · Behind-Back · Dribble",
    unit: "detik",
    sortAsc: true,
    drills: ["crossover", "behind-back", "dribble", "ball handling"],
  },
  {
    key: "agility",
    label: "Agility & Defence",
    subtitle: "Defensive Slides",
    unit: "reps",
    drills: ["defensive slide", "agility", "slide"],
  },
  {
    key: "speed",
    label: "Kecepatan",
    subtitle: "Sprint 20 m",
    unit: "detik",
    sortAsc: true,
    drills: ["sprint", "speed", "kecepatan"],
  },
  {
    key: "completion",
    label: "Penyelesaian Drill",
    subtitle: "Semua drill",
    unit: "%",
    drills: [],
  },
];

/* ── Data types ─────────────────────────────────────────────────── */

export interface AthleteStat {
  id: string;
  name: string;
  jerseyNumber: string | null;
  position: string | null;
  values: Record<string, number | null>;
}

interface MetricComparisonProps {
  athletes: AthleteStat[];
}

/* ── Helpers ────────────────────────────────────────────────────── */

function computeAverages(
  athletes: AthleteStat[],
  metric: MetricDef,
): { athleteId: string; avg: number; n: number }[] {
  const result: { athleteId: string; avg: number; n: number }[] = [];

  for (const a of athletes) {
    const val = a.values[metric.key];
    if (val !== null) {
      result.push({ athleteId: a.id, avg: val, n: 1 });
    }
  }

  return result;
}

/* ── Component ──────────────────────────────────────────────────── */

export function MetricComparison({ athletes }: MetricComparisonProps) {
  const [selected, setSelected] = useState<MetricKey>("free-throw");

  const metric = METRICS.find((m) => m.key === selected) ?? METRICS[0];
  const averages = computeAverages(athletes, metric);

  const sorted = [...averages].sort((a, b) =>
    metric.sortAsc ? a.avg - b.avg : b.avg - a.avg,
  );

  const maxVal = Math.max(1, ...sorted.map((r) => r.avg));

  const athleteMap = new Map(athletes.map((a) => [a.id, a]));

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      {/* Header with dropdown */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-h4 font-bold tracking-tight">
            Perbandingan Kinerja Drill
          </h2>
          <p className="mt-0.5 text-tiny text-ink-soft">
            {metric.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as MetricKey)}
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-small font-medium text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <Badge variant="primary">{metric.unit}</Badge>
        </div>
      </div>

      {/* Bar chart */}
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-tiny text-ink-soft">
          Belum ada data untuk metrik ini.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((r, idx) => {
            const a = athleteMap.get(r.athleteId);
            if (!a) return null;
            const pct = maxVal > 0 ? (r.avg / maxVal) * 100 : 0;
            return (
              <li key={r.athleteId} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-right text-tiny font-bold text-ink-soft">
                  {idx + 1}
                </span>
                <Link
                  href={`/pelatih/atlet/${r.athleteId}`}
                  className="w-28 shrink-0 truncate text-small font-semibold hover:text-primary sm:w-40"
                >
                  {a.jerseyNumber ? `#${a.jerseyNumber} ` : ""}
                  {a.name}
                </Link>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      idx === 0
                        ? "bg-primary"
                        : pct >= 70
                          ? "bg-primary/70"
                          : pct >= 40
                            ? "bg-warning"
                            : "bg-danger",
                    )}
                    style={{
                      width: `${Math.max(4, pct)}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-small font-bold tabular-nums">
                  {metric.key === "completion"
                    ? `${Math.round(r.avg)}%`
                    : `${r.avg.toFixed(1)}${metric.unit === "%" ? "%" : ""}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
