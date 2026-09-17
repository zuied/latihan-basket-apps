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

export function SessionPlayer({
  sessionId,
  drills,
  athleteId,
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
  }[];
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
      </div>

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
        disabled={isPending}
        onClick={() =>
          current < drills.length - 1
            ? setCurrent((c) => c + 1)
            : saveAll()
        }
        className="mb-2 w-full rounded-lg bg-primary px-4 py-2.5 text-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong disabled:opacity-60"
      >
        {current < drills.length - 1 ? "Simpan & lanjut →" : "Selesaikan sesi"}
      </button>
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
    </div>
  );
}