"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import {
  changePassword,
  updateProfile,
  type SettingsState,
} from "@/app/(app)/pengaturan/actions";

const POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
];

export function SettingsForm({
  fullName,
  phone,
  position,
  heightCm,
  weightKg,
}: {
  fullName: string;
  phone: string | null;
  position: string | null;
  heightCm: number | null;
  weightKg: number | null;
}) {
  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsState,
    FormData
  >(updateProfile, undefined);
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    SettingsState,
    FormData
  >(changePassword, undefined);

  const [pwdForm, setPwdForm] = useState(false);
  const newPwdRef = useRef<HTMLInputElement>(null);
  const retypeRef = useRef<HTMLInputElement>(null);
  const [retypeError, setRetypeError] = useState<string | null>(null);

  const onSubmitPwd = (e: React.FormEvent) => {
    if (newPwdRef.current?.value !== retypeRef.current?.value) {
      e.preventDefault();
      setRetypeError("Password tidak cocok.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-4 text-h4 font-bold tracking-tight">Data profil</h2>
        <form action={profileAction} className="space-y-3">
          <div>
            <Label htmlFor="pf-name">Nama lengkap</Label>
            <Input id="pf-name" name="fullName" defaultValue={fullName} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pf-phone">No. telepon</Label>
              <Input id="pf-phone" name="phone" defaultValue={phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="pf-position">Posisi</Label>
              <select
                id="pf-position"
                name="position"
                defaultValue={position ?? ""}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pf-height">Tinggi (cm)</Label>
              <Input
                id="pf-height"
                name="heightCm"
                type="number"
                step="0.1"
                defaultValue={heightCm ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="pf-weight">Berat (kg)</Label>
              <Input
                id="pf-weight"
                name="weightKg"
                type="number"
                step="0.1"
                defaultValue={weightKg ?? ""}
              />
            </div>
          </div>
          <FieldError>{profileState?.error}</FieldError>
          {profileState?.ok ? (
            <p className="text-tiny text-success">Perubahan tersimpan.</p>
          ) : null}
          <Button type="submit" variant="primary" disabled={isProfilePending}>
            {isProfilePending ? "Menyimpan…" : "Simpan"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-4 text-h4 font-bold tracking-tight">Keamanan</h2>
        {!pwdForm ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPwdForm(true)}
          >
            Ubah password
          </Button>
        ) : (
          <form
            action={passwordAction}
            onSubmit={onSubmitPwd}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="pwd-current">Password saat ini</Label>
              <Input
                id="pwd-current"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pwd-new">Password baru (min. 8)</Label>
                <Input
                  id="pwd-new"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  ref={newPwdRef}
                />
              </div>
              <div>
                <Label htmlFor="pwd-retype">Ulangi password baru</Label>
                <Input
                  id="pwd-retype"
                  type="password"
                  required
                  minLength={8}
                  ref={retypeRef}
                  onChange={() => setRetypeError(null)}
                />
              </div>
            </div>
            <FieldError>
              {passwordState?.error ?? retypeError ?? undefined}
            </FieldError>
            {passwordState?.ok ? (
              <p className="text-tiny text-success">
                Password berhasil diperbarui.
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" disabled={isPasswordPending}>
                {isPasswordPending ? "Menyimpan…" : "Perbarui password"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPwdForm(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}