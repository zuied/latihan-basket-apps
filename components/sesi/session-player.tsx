"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";

const TARGET_UNIT_LABEL: Record<string, string> = {
  reps: "reps",
  time_sec: "detik",
  percentage: "%",
  distance_m: "m",
};

function useTimer(totalSeconds: number) {
  const [remaining, setRemaining] = React.useState(totalSeconds);
  const [running, setRunning] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  const start = () => { setRemaining(totalSeconds); setRunning(true); };
  const stop = () => { setRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); };
  const reset = () => { setRunning(false); setRemaining(totalSeconds); if (intervalRef.current) clearInterval(intervalRef.current); };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return { display, running, remaining, progress, start, stop, reset };
}

export function SessionPlayer({
  sessionId,
  drills,
  athleteId,
  readOnly = false,
}: {
  sessionId: string;
  athleteId: string;
  drills: {
    id: string;
    drillName: string;
    subCategory: string;
    targetType: string;
    targetValue: number | null;
    targetUnit: string | null;
    durationMinutes: number | null;
    originalDuration?: number | null;
  }[];
  readOnly?: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const [values, setValues] = React.useState<Record<string, number | null>>(
    () => Object.fromEntries(drills.map((d) => [d.id, null])),
  );
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const drill = drills[current];
  const progress = ((current + 1) / drills.length) * 100;
  const unit = drill.targetUnit ?? TARGET_UNIT_LABEL[drill.targetType] ?? "";

  const saveAll = () => {
    setSaveError(null);
    startTransition(async () => {
      try {
        const { saveSessionResults } = await import(
          "@/app/(app)/atlet/sesi/actions"
        );
        await saveSessionResults({
          sessionId,
          athleteId,
          results: drills.map((d) => ({
            sessionDrillId: d.id,
            actualValue: values[d.id] ?? 0,
            unit,
          })),
        });
        setSaved(true);
        setTimeout(() => router.push("/atlet"), 800);
      } catch {
        setSaveError("Gagal menyimpan hasil. Periksa koneksi lalu coba lagi.");
      }
    });
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-h2">✅</span>
        <p className="text-h4 font-semibold">Tersimpan!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-small font-bold">
          Drill {current + 1} dari {drills.length}
        </p>
        <span className="text-tiny text-ink-soft">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Drill info */}
      <div className="mb-5 rounded-xl bg-canvas p-4 text-center">
        <span className="mb-2 inline-block rounded-full bg-purple-soft px-2.5 py-0.5 text-tiny font-bold uppercase text-purple">
          {drill.subCategory}
        </span>
        <p className="mt-2 text-h4 font-bold">{drill.drillName}</p>
        {drill.targetValue !== null ? (
          <p className="mt-1 text-small text-ink-soft">
            Target: {drill.targetValue} {unit}
          </p>
        ) : null}
        {drill.durationMinutes !== null ? (
          <p className="mt-1 text-tiny text-ink-faint">
            {drill.originalDuration && drill.originalDuration !== drill.durationMinutes ? (
              <span>
                Durasi: <span className="line-through">{drill.originalDuration} menit</span>{" "}
                → <span className="font-semibold text-warning">{drill.durationMinutes} menit</span>
              </span>
            ) : (
              `Durasi: ${drill.durationMinutes} menit`
            )}
          </p>
        ) : null}
      </div>

      {drill.durationMinutes !== null ? (
        <TimerWidget totalMinutes={drill.durationMinutes} />
      ) : null}

      {/* Stepper */}
      <p className="mb-1 text-center text-small text-ink-soft">
        Berapa yang tercapai?
      </p>
      <Stepper
        value={values[drill.id]}
        onChange={(v) =>
          setValues((prev) => ({ ...prev, [drill.id]: v }))
        }
        min={0}
        max={drill.targetValue ? drill.targetValue * 3 : 100}
      />
      <p className="mb-6 text-center text-tiny text-ink-faint">
        {drill.targetValue !== null
          ? `dari ${drill.targetValue} ${unit}`
          : ""}
      </p>

      {/* Actions */}
      {saveError ? (
        <p className="mb-3 text-center text-tiny font-medium text-danger" role="alert">
          {saveError}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isPending || readOnly}
        onClick={() =>
          current < drills.length - 1
            ? setCurrent((c) => c + 1)
            : saveAll()
        }
        className="mb-2 w-full rounded-lg bg-primary px-4 py-2.5 text-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong disabled:opacity-60"
      >
        {readOnly ? "Istirahat hari ini" : current < drills.length - 1 ? "Simpan & lanjut →" : "Selesaikan sesi"}
      </button>
      {!readOnly ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            current < drills.length - 1
              ? setCurrent((c) => c + 1)
              : saveAll()
          }
          className="w-full rounded-lg px-4 py-2.5 text-small font-medium text-ink-soft transition-colors hover:bg-neutral-soft disabled:opacity-60"
        >
          Lewati drill ini
        </button>
      ) : null}
    </div>
  );
}

function TimerWidget({ totalMinutes }: { totalMinutes: number }) {
  const timer = useTimer(totalMinutes * 60);

  return (
    <div className="mb-5 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-tiny font-bold text-ink">Timer</span>
        <span className="font-mono text-h3 font-bold tabular-nums text-primary">
          {timer.display}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000"
          style={{ width: `${timer.progress}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        {!timer.running ? (
          <button
            type="button"
            onClick={timer.start}
            className="flex-1 rounded-lg bg-success px-3 py-1.5 text-tiny font-semibold text-white transition-colors hover:bg-success/90"
          >
            ▶ Mulai
          </button>
        ) : (
          <button
            type="button"
            onClick={timer.stop}
            className="flex-1 rounded-lg bg-warning px-3 py-1.5 text-tiny font-semibold text-white transition-colors hover:bg-warning/90"
          >
            ⏸ Jeda
          </button>
        )}
        <button
          type="button"
          onClick={timer.reset}
          className="rounded-lg border border-line px-3 py-1.5 text-tiny font-medium text-ink-soft transition-colors hover:bg-neutral-soft"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}