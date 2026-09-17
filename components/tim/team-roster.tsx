"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { PencilIcon, PlusIcon, ShieldIcon, TrashIcon, UsersIcon } from "@/components/ui/icons";
import {
  addTeamMember,
  createAthlete,
  removeTeamMember,
  setAssistantCoach,
  updateTeamMember,
  type MemberActionState,
  type CreateAthleteState,
} from "@/app/(app)/pelatih/tim/actions";

export type RosterMember = {
  id: string;
  athleteId: string;
  fullName: string;
  position: string | null;
  jerseyNumber: string | null;
  roleInTeam: string;
  status: string;
};

export type AvailableAthlete = {
  id: string;
  fullName: string;
  position: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  player: "Pemain",
  assistant_coach: "Asisten Pelatih",
};

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "neutral" }> = {
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "neutral" },
};

export function TeamRoster({
  teamId,
  isCoach,
  members,
  athletes,
}: {
  teamId: string;
  isCoach: boolean;
  members: RosterMember[];
  athletes: AvailableAthlete[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RosterMember | null>(null);
  const [removing, setRemoving] = useState<RosterMember | null>(null);
  const [isToggling, startToggle] = useTransition();

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const toggleAssistant = (member: RosterMember) => {
    const isNowAssistant = member.roleInTeam !== "assistant_coach";
    startToggle(async () => {
      await setAssistantCoach(teamId, member.athleteId, isNowAssistant);
      setEditing(null);
    });
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersIcon />
          <h3 className="text-h4 font-bold tracking-tight">Roster</h3>
          <Badge>{members.length} anggota</Badge>
        </div>
        {isCoach ? (
          <Button variant="soft" onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Tambah pemain
          </Button>
        ) : null}
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="Belum ada anggota"
          description={
            isCoach
              ? "Tambahkan pemain untuk mulai menyusun roster tim."
              : "Roster belum diisi pelatih."
          }
          action={
            isCoach ? (
              <Button onClick={() => setAddOpen(true)}>Tambah pemain pertama</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
          <ul className="divide-y divide-line/70">
            {members.map((member) => {
              const statusMeta = STATUS_LABEL[member.status] ?? STATUS_LABEL.active;
              const isAssistant = member.roleInTeam === "assistant_coach";
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-small font-semibold ${
                      isAssistant ? "bg-neutral-soft text-neutral-strong" : "bg-primary-soft text-primary"
                    }`}
                  >
                    {initials(member.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-small font-semibold">{member.fullName}</p>
                      {isAssistant ? (
                        <Badge variant="neutral">
                          <ShieldIcon />
                          Asisten
                        </Badge>
                      ) : null}
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      {ROLE_LABEL[member.roleInTeam] ?? member.roleInTeam}
                      {member.jerseyNumber ? ` · No ${member.jerseyNumber}` : ""}
                      {member.position ? ` · ${member.position}` : ""}
                    </p>
                  </div>
                  {isCoach ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-1.5"
                        aria-label={`Edit ${member.fullName}`}
                        onClick={() => setEditing(member)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-1.5"
                        aria-label={`Hapus ${member.fullName}`}
                        onClick={() => setRemoving(member)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isCoach && addOpen ? (
        <AddMemberModal
          teamId={teamId}
          athletes={athletes}
          onClose={() => setAddOpen(false)}
        />
      ) : null}

      {isCoach && editing ? (
        <EditMemberModal
          teamId={teamId}
          member={editing}
          isToggling={isToggling}
          onToggleAssistant={() => toggleAssistant(editing)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {isCoach && removing ? (
        <RemoveMemberModal
          teamId={teamId}
          member={removing}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </section>
  );
}

function AddMemberModal({
  teamId,
  athletes,
  onClose,
}: {
  teamId: string;
  athletes: AvailableAthlete[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"existing" | "new">("existing");

  return (
    <Modal
      open
      onClose={onClose}
      title="Tambah pemain"
      description="Tambahkan atlet ke dalam roster tim."
    >
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-xl bg-canvas p-1">
        <button
          type="button"
          onClick={() => setTab("existing")}
          className={`flex-1 rounded-lg px-3 py-2 text-small font-semibold transition-colors ${
            tab === "existing"
              ? "bg-panel shadow-sm text-ink"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Dari Daftar
        </button>
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`flex-1 rounded-lg px-3 py-2 text-small font-semibold transition-colors ${
            tab === "new"
              ? "bg-panel shadow-sm text-ink"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Atlet Baru
        </button>
      </div>

      {tab === "existing" ? (
        <ExistingAthleteForm
          teamId={teamId}
          athletes={athletes}
          onClose={onClose}
        />
      ) : (
        <NewAthleteForm teamId={teamId} onClose={onClose} />
      )}
    </Modal>
  );
}

function ExistingAthleteForm({
  teamId,
  athletes,
  onClose,
}: {
  teamId: string;
  athletes: AvailableAthlete[];
  onClose: () => void;
}) {
  const action = addTeamMember.bind(null, teamId);
  const [state, formAction, isPending] = useActionState<MemberActionState, FormData>(
    action,
    { error: undefined },
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert tone="danger" title="Tidak dapat menyimpan">
          {state.error}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="rm-athlete">Atlet</Label>
        <Select id="rm-athlete" name="athleteId" required defaultValue="">
          <option value="" disabled>
            Pilih atlet...
          </option>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.fullName}
              {athlete.position ? ` — ${athlete.position}` : ""}
            </option>
          ))}
        </Select>
        {athletes.length === 0 ? (
          <p className="mt-1 text-tiny text-ink-soft">
            Tidak ada atlet tersisa untuk ditambahkan. Buat atlet baru di tab &quot;Atlet Baru&quot;.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rm-role">Peran dalam tim</Label>
          <Select id="rm-role" name="roleInTeam" defaultValue="player">
            <option value="player">Pemain</option>
            <option value="assistant_coach">Asisten Pelatih</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="rm-jersey">Nomor punggung (opsional)</Label>
          <Input
            id="rm-jersey"
            name="jerseyNumber"
            maxLength={4}
            placeholder="Mis. 7"
          />
        </div>
      </div>

      <FieldError>{state?.error}</FieldError>

      <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending || athletes.length === 0}>
          {isPending ? "Menyimpan…" : "Tambah anggota"}
        </Button>
      </div>
    </form>
  );
}

const POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
];

function NewAthleteForm({
  teamId,
  onClose,
}: {
  teamId: string;
  onClose: () => void;
}) {
  const action = createAthlete.bind(null, teamId);
  const [state, formAction, isPending] = useActionState<CreateAthleteState, FormData>(
    action,
    { error: undefined },
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert tone="danger" title="Tidak dapat membuat atlet">
          {state.error}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="na-name">Nama lengkap *</Label>
        <Input id="na-name" name="fullName" required placeholder="Nama atlet" />
      </div>

      <div>
        <Label htmlFor="na-email">Email *</Label>
        <Input
          id="na-email"
          name="email"
          type="email"
          required
          placeholder="email@contoh.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="na-position">Posisi</Label>
          <select
            id="na-position"
            name="position"
            defaultValue=""
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
        <div>
          <Label htmlFor="na-jersey">Nomor punggung</Label>
          <Input id="na-jersey" name="jerseyNumber" maxLength={4} placeholder="Mis. 7" />
        </div>
      </div>

      <div className="rounded-xl bg-success-soft px-4 py-3 text-tiny text-success-strong">
        <p className="font-semibold">Password default: basket123</p>
        <p className="mt-0.5">
          Atlet bisa login dengan email &amp; password ini. Sarankan untuk mengganti
          password setelah login pertama.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Membuat…" : "Buat & Tambahkan"}
        </Button>
      </div>
    </form>
  );
}

function EditMemberModal({
  teamId,
  member,
  isToggling,
  onToggleAssistant,
  onClose,
}: {
  teamId: string;
  member: RosterMember;
  isToggling: boolean;
  onToggleAssistant: () => void;
  onClose: () => void;
}) {
  const action = updateTeamMember.bind(null, teamId, member.id);
  const [state, formAction, isPending] = useActionState<MemberActionState, FormData>(
    action,
    { error: undefined },
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  const toggleLabel =
    member.roleInTeam === "assistant_coach"
      ? "Jadikan pemain"
      : "Jadikan asisten pelatih";

  return (
    <Modal
      open
      onClose={onClose}
      title={member.fullName}
      description="Perbarui peran, nomor, atau status keanggotaan."
    >
      <form action={formAction} className="space-y-4">
        {state?.error ? (
          <Alert tone="danger" title="Tidak dapat menyimpan">
            {state.error}
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="em-role">Peran dalam tim</Label>
            <Select
              id="em-role"
              name="roleInTeam"
              defaultValue={member.roleInTeam}
            >
              <option value="player">Pemain</option>
              <option value="assistant_coach">Asisten Pelatih</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="em-jersey">Nomor punggung (opsional)</Label>
            <Input
              id="em-jersey"
              name="jerseyNumber"
              maxLength={4}
              defaultValue={member.jerseyNumber ?? ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="em-status">Status keanggotaan</Label>
          <Select id="em-status" name="status" defaultValue={member.status}>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </div>

        <FieldError>{state?.error}</FieldError>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleAssistant}
            disabled={isToggling || isPending}
          >
            <ShieldIcon />
            {toggleLabel}
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan perubahan"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function RemoveMemberModal({
  teamId,
  member,
  onClose,
}: {
  teamId: string;
  member: RosterMember;
  onClose: () => void;
}) {
  const action = removeTeamMember.bind(null, teamId, member.id);
  const [state, formAction, isPending] = useActionState<MemberActionState, FormData>(
    action,
    { error: undefined },
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Hapus ${member.fullName}?`}
      description="Anggota akan dikeluarkan dari roster tim."
    >
      <form action={formAction} className="space-y-4">
        {state?.error ? (
          <Alert tone="danger" title="Tidak dapat menghapus">
            {state.error}
          </Alert>
        ) : null}
        <p className="text-small text-ink-soft">
          {member.fullName} tidak lagi menjadi bagian dari tim ini. Riwayat sesi dan statistik
          sebelumnya tetap tersimpan, tetapi tidak akan muncul di daftar kehadiran berikutnya.
        </p>
        <div className="flex items-center justify-end gap-3 border-t border-line/70 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" variant="danger" disabled={isPending}>
            {isPending ? "Menghapus…" : "Hapus anggota"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}