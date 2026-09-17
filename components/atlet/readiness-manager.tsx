"use client";

import { useState, useRef, useTransition } from "react";
import { setReadiness } from "@/app/(app)/pelatih/atlet/readiness-actions";

type Status = "full" | "limited" | "rest";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "full", label: "Latihan penuh", color: "text-success" },
  { value: "limited", label: "Latihan dibatasi", color: "text-warning" },
  { value: "rest", label: "Istirahat", color: "text-danger" },
];

const DAYS_OPTIONS = [
  { value: 1, label: "1 hari" },
  { value: 3, label: "3 hari" },
  { value: 7, label: "7 hari" },
  { value: 14, label: "14 hari" },
  { value: 30, label: "30 hari" },
];

export function ReadinessManager({
  athleteId,
  currentStatus,
}: {
  athleteId: string;
  currentStatus: Status | null;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(currentStatus ?? "full");
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    const fd = new FormData();
    fd.set("athleteId", athleteId);
    fd.set("status", status);
    fd.set("days", String(days));
    if (reason) fd.set("reason", reason);

    startTransition(async () => {
      const res = await setReadiness(fd);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setOpen(false);
          setSaved(false);
        }, 1000);
      }
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-line px-3 py-1.5 text-tiny font-medium text-ink-soft transition-colors hover:bg-neutral-soft hover:text-ink"
      >
        Atur kesiapan
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-panel p-4 shadow-xl">
            {saved ? (
              <p className="py-4 text-center text-small font-medium text-success">
                Tersimpan!
              </p>
            ) : (
              <>
                <p className="mb-3 text-small font-bold">Atur Kesiapan Atlet</p>

                <div className="space-y-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                        status === opt.value
                          ? "border-primary bg-primary-faint/30"
                          : "border-line hover:bg-neutral-soft"
                      }`}
                    >
                      <input
                        type="radio"
                        name="readiness"
                        value={opt.value}
                        checked={status === opt.value}
                        onChange={() => setStatus(opt.value)}
                        className="accent-primary"
                      />
                      <span className={`text-small font-medium ${opt.color}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-tiny font-medium text-ink-soft">
                    Berlaku selama
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDays(d.value)}
                        className={`rounded-lg px-2.5 py-1 text-tiny font-medium transition-colors ${
                          days === d.value
                            ? "bg-primary text-white"
                            : "border border-line text-ink-soft hover:bg-neutral-soft"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-tiny font-medium text-ink-soft">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Alasan perubahan kesiapan..."
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSubmit}
                  className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-60"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
