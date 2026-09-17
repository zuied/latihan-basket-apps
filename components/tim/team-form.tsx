"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { PencilIcon, PlusIcon } from "@/components/ui/icons";
import {
  createTeam,
  deleteTeam,
  updateTeam,
  type TeamActionState,
} from "@/app/(app)/pelatih/tim/actions";

export type TeamInput = {
  id: string;
  name: string;
  description: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
};

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TeamFormModal({
  team,
  triggerLabel,
  variant = "primary",
  open: externalOpen,
  onOpenChange,
}: {
  team?: TeamInput | null;
  triggerLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(team);
  const action = team
    ? updateTeam.bind(null, team.id)
    : createTeam;
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    action,
    { error: undefined },
  );
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;

  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        aria-label={team ? "Edit detail tim" : triggerLabel}
      >
        {team ? <PencilIcon /> : <PlusIcon />}
        {team ? "Edit tim" : (triggerLabel ?? "Buat tim")}
      </Button>

      {open ? (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={isEdit ? "Edit tim" : "Buat tim baru"}
          description={
            isEdit
              ? "Perbarui informasi tim Anda."
              : "Buat tim untuk mulai menyusun roster dan menjadwalkan sesi."
          }
        >
          <form action={formAction} className="space-y-4">
            {state?.error ? (
              <Alert tone="danger" title="Tidak dapat menyimpan">
                {state.error}
              </Alert>
            ) : null}

            <div>
              <Label htmlFor="team-name">Nama tim</Label>
              <Input
                id="team-name"
                name="name"
                placeholder="Mis. Elang Muda U-15"
                defaultValue={team?.name ?? ""}
                required
              />
            </div>

            <div>
              <Label htmlFor="team-desc">Deskripsi (opsional)</Label>
              <Textarea
                id="team-desc"
                name="description"
                rows={3}
                placeholder="Usia, jenjang, atau fokus tim..."
                defaultValue={team?.description ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="team-season-start">Mulai musim (opsional)</Label>
                <Input
                  id="team-season-start"
                  name="seasonStart"
                  type="date"
                  defaultValue={toDateInput(team?.seasonStart)}
                />
              </div>
              <div>
                <Label htmlFor="team-season-end">Akhir musim (opsional)</Label>
                <Input
                  id="team-season-end"
                  name="seasonEnd"
                  type="date"
                  defaultValue={toDateInput(team?.seasonEnd)}
                />
              </div>
            </div>

            <FieldError>{state?.error}</FieldError>

            <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan…" : isEdit ? "Simpan perubahan" : "Buat tim"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

export function DeleteTeamModal({
  team,
  triggerLabel = "Hapus tim",
}: {
  team: Pick<TeamInput, "id" | "name">;
  triggerLabel?: string;
}) {
  const action = deleteTeam.bind(null, team.id);
  const [state, formAction, isPending] = useActionState<TeamActionState, FormData>(
    action,
    { error: undefined },
  );
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open ? (
        <Modal
          open
          onClose={() => setOpen(false)}
          title="Hapus tim?"
          description="Tindakan ini tidak dapat dibatalkan."
        >
          <form action={formAction} className="space-y-4">
            {state?.error ? (
              <Alert tone="danger" title="Tidak dapat menghapus">
                {state.error}
              </Alert>
            ) : null}
            <p className="text-small text-ink-soft">
              Tim <span className="font-semibold text-ink">{team.name}</span> beserta seluruh
              roster, program, dan sesi latihannya akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="danger" disabled={isPending}>
                {isPending ? "Menghapus…" : "Hapus tim"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}