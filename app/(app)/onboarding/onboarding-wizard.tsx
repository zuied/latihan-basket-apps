"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { completeOnboarding, type OnboardingState } from "./actions";

const STEPS = ["Profil", "Posisi", "Ukuran Tubuh", "Selesai"];

const POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
];

export function OnboardingWizard({
  defaultValues,
}: {
  defaultValues: {
    fullName: string;
    position: string;
    heightCm: string;
    weightKg: string;
    dateOfBirth: string;
  };
}) {
  const [step, setStep] = useState(0);
  const [state, action, isPending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    undefined,
  );

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-tiny font-semibold text-ink-soft">
          <span>Langkah {step + 1} dari {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-[10px] font-medium ${
                i <= step ? "text-primary" : "text-ink-faint"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <form action={action}>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-h4 font-bold tracking-tight">Siapa Anda?</h2>
              <p className="text-tiny text-ink-soft">
                Lengkapi profil Anda agar pelatih bisa mengenali Anda.
              </p>
              <div>
                <Label htmlFor="ob-name">Nama lengkap</Label>
                <Input
                  id="ob-name"
                  name="fullName"
                  defaultValue={defaultValues.fullName}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ob-dob">Tanggal lahir</Label>
                <Input
                  id="ob-dob"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={defaultValues.dateOfBirth}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-h4 font-bold tracking-tight">Posisi Anda</h2>
              <p className="text-tiny text-ink-soft">
                Pilih posisi utama Anda di lapangan.
              </p>
              <div>
                <Label htmlFor="ob-position">Posisi</Label>
                <select
                  id="ob-position"
                  name="position"
                  defaultValue={defaultValues.position}
                  className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-small text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                >
                  <option value="">Pilih posisi</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-h4 font-bold tracking-tight">Ukuran Tubuh</h2>
              <p className="text-tiny text-ink-soft">
                Data ini membantu pelatih menyesuaikan program latihan.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ob-height">Tinggi (cm)</Label>
                  <Input
                    id="ob-height"
                    name="heightCm"
                    type="number"
                    step="0.1"
                    defaultValue={defaultValues.heightCm}
                    placeholder="170"
                  />
                </div>
                <div>
                  <Label htmlFor="ob-weight">Berat (kg)</Label>
                  <Input
                    id="ob-weight"
                    name="weightKg"
                    type="number"
                    step="0.1"
                    defaultValue={defaultValues.weightKg}
                    placeholder="65"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="text-h4">🎉</div>
              <h2 className="text-h4 font-bold tracking-tight">Siap!</h2>
              <p className="text-tiny text-ink-soft">
                Profil Anda sudah lengkap. Selamat datang di aplikasi latihan basket!
              </p>
              <FieldError>{state?.error}</FieldError>
            </div>
          )}

          {/* Hidden fields to carry values across steps */}
          <input type="hidden" name="fullName" value={
            step === 0 ? undefined : defaultValues.fullName
          } />
          <input type="hidden" name="position" value={
            step === 1 ? undefined : defaultValues.position
          } />
          <input type="hidden" name="heightCm" value={
            step === 2 ? undefined : defaultValues.heightCm
          } />
          <input type="hidden" name="weightKg" value={
            step === 2 ? undefined : defaultValues.weightKg
          } />
          <input type="hidden" name="dateOfBirth" value={
            step === 0 ? undefined : defaultValues.dateOfBirth
          } />

          <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-4">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Kembali
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
              >
                Selanjutnya
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan…" : "Masuk ke Aplikasi"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
