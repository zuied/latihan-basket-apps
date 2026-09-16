"use client";

import { useId } from "react";

export function Stepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const inputId = useId();
  const display = value === null ? "" : String(value);

  const clamp = (next: number) => {
    if (Number.isNaN(next)) return null;
    if (max !== undefined && next > max) return max;
    if (next < min) return min;
    return Math.round(next * 100) / 100;
  };

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(Number(value ?? 0) - step))}
        aria-label="Kurangi"
        className="w-12 rounded-lg border border-line bg-panel text-h3 font-semibold text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink disabled:opacity-40"
        disabled={display === "" || (value ?? 0) <= min}
      >
        −
      </button>
      <div className="relative flex-1">
        <input
          id={inputId}
          inputMode="decimal"
          value={display}
          onChange={(e) => {
            if (e.target.value === "") return onChange(null);
            const next = parseFloat(e.target.value);
            if (!Number.isNaN(next)) onChange(clamp(next));
          }}
          placeholder="0"
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-center text-h4 font-semibold text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-tiny text-ink-faint">
            {unit}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(Number(value ?? 0) + step))}
        aria-label="Tambah"
        className="w-12 rounded-lg border border-line bg-panel text-h3 font-semibold text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink disabled:opacity-40"
        disabled={max !== undefined && (value ?? 0) >= max}
      >
        +
      </button>
    </div>
  );
}