"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  changePassword,
  deleteAccount,
  updateProfile,
  type SettingsState,
} from "@/app/(app)/pengaturan/actions";
import {
  requestDataDeletion,
  exportMyData,
} from "@/app/(app)/pengaturan/privacy-actions";

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
  role,
}: {
  fullName: string;
  phone: string | null;
  position: string | null;
  heightCm: number | null;
  weightKg: number | null;
  role: string;
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

  // Delete account modal
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const deleteReady = deleteConfirm === "HAPUS" && !isDeletePending;

  const onSubmitDelete = async (formData: FormData) => {
    setIsDeletePending(true);
    setDeleteError(null);
    const result = await deleteAccount(undefined, formData);
    setIsDeletePending(false);
    if (result?.ok) {
      setDeleteOpen(false);
      router.push("/login");
    } else if (result?.error) {
      setDeleteError(result.error);
    }
  };

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

      {/* Privasi & Data */}
      <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-1 text-h4 font-bold tracking-tight">Privasi & Data</h2>
        <p className="mb-4 text-tiny text-ink-soft">
          Kelola data pribadi Anda sesuai hak privasi yang berlaku.
        </p>
        <PrivacySection role={role} />
      </section>

      {/* Zona Bahaya */}
      <section className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <h2 className="mb-1 text-h4 font-bold tracking-tight text-danger">
          Zona Bahaya
        </h2>
        <p className="mb-4 text-tiny text-ink-soft">
          Menghapus akun akan menonaktifkan akses Anda secara permanen. Data
          profil tidak akan terlihat lagi.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirm("");
          }}
        >
          Hapus Akun
        </Button>
      </section>

      {/* Modal konfirmasi hapus akun */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm("");
        }}
        title="Hapus Akun"
        description="Tindakan ini tidak dapat dibatalkan."
      >
        <form action={onSubmitDelete} className="space-y-4">
          <p className="text-small text-ink-soft">
            Ketik <span className="font-bold text-danger">HAPUS</span> untuk
            mengonfirmasi penghapusan akun Anda.
          </p>
          <div>
            <Label htmlFor="del-confirm">Konfirmasi</Label>
            <Input
              id="del-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Ketik HAPUS"
              required
            />
          </div>
          <div>
            <Label htmlFor="del-password">Password saat ini</Label>
            <Input
              id="del-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <FieldError>{deleteError ?? undefined}</FieldError>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="danger"
              disabled={!deleteReady}
            >
              {isDeletePending ? "Menghapus…" : "Hapus Akun Saya"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PrivacySection({ role }: { role: string }) {
  const [isPending, startTransition] = useTransition();
  const [exported, setExported] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const deleteReady = deleteConfirm === "HAPUS";

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportMyData();
      if (res.ok && res.data) {
        const blob = new Blob([res.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data-saya-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExported(true);
      }
    });
  };

  const handleDeleteRequest = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await requestDataDeletion();
      if (res.ok) {
        router.push("/login");
      } else if (res.error) {
        setDeleteError(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
        <div>
          <p className="text-small font-medium">Unduh data saya</p>
          <p className="text-tiny text-ink-soft">
            Unduh salinan semua data pribadi Anda dalam format JSON.
          </p>
        </div>
        <Button
          variant="soft"
          size="sm"
          disabled={isPending}
          onClick={handleExport}
        >
          {isPending ? "Mengunduh..." : exported ? "✓ Tersimpan" : "Unduh"}
        </Button>
      </div>

      {role === "PARENT" || role === "ATHLETE" ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 px-4 py-3">
          <div>
            <p className="text-small font-medium text-danger">Minta penghapusan data</p>
            <p className="text-tiny text-ink-soft">
              Hapus akun Anda dan semua data terkait secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Minta hapus
          </Button>
        </div>
      ) : null}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <p className="mb-4 text-h4 font-bold">Minta Penghapusan Data</p>
        <p className="mb-4 text-small text-ink-soft">
          Semua data Anda akan dihapus secara permanen. Anda akan logout otomatis.
        </p>
        <div>
          <Label htmlFor="privacy-confirm">Ketik HAPUS untuk konfirmasi</Label>
          <Input
            id="privacy-confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="HAPUS"
          />
        </div>
        {deleteError ? (
          <p className="mt-2 text-tiny text-danger">{deleteError}</p>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="danger"
            disabled={!deleteReady || isDeletePending}
            onClick={handleDeleteRequest}
          >
            {isDeletePending ? "Menghapus..." : "Ya, hapus data saya"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteOpen(false);
              setDeleteConfirm("");
            }}
          >
            Batal
          </Button>
        </div>
      </Modal>
    </div>
  );
}