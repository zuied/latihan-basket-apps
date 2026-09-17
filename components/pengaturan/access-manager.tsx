"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  addAssistant,
  removeAssistant,
  setParentAccess,
} from "@/app/(app)/pengaturan/actions";

export type AssistantRow = {
  memberId: string;
  fullName: string;
  email: string | null;
  teamName: string;
};

export type ParentLinkRow = {
  linkId: string;
  parentName: string;
  parentEmail: string | null;
  athleteName: string;
  relationship: string;
  status: string;
};

const PARENT_STATUS_BADGE: Record<string, string> = {
  active: "bg-success-faint text-success",
  pending: "bg-warning-faint text-warning",
  revoked: "bg-neutral-soft text-ink-soft",
};

export function AccessManager({
  teams,
  assistants,
  parentLinks,
}: {
  teams: { id: string; name: string }[];
  assistants: AssistantRow[];
  parentLinks: ParentLinkRow[];
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    setPendingId(null);
    router.refresh();
  };

  const handleAdd = () => {
    setError(null);
    if (teams.length === 0) {
      setError("Buat tim terlebih dahulu sebelum menambah asisten.");
      return;
    }
    if (!email.trim()) {
      setError("Email asisten wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await addAssistant(teamId, email);
      if (!res.ok) {
        setError(res.error ?? "Gagal menambah asisten.");
        return;
      }
      setEmail("");
      refresh();
    });
  };

  const handleRemove = (memberId: string) => {
    setError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const res = await removeAssistant(memberId);
      if (!res.ok) {
        setError(res.error ?? "Gagal menghapus asisten.");
        setPendingId(null);
        return;
      }
      refresh();
    });
  };

  const handleToggleParent = (linkId: string, status: string) => {
    setError(null);
    setPendingId(linkId);
    startTransition(async () => {
      const res = await setParentAccess(linkId, status === "active" ? "revoked" : "active");
      if (!res.ok) {
        setError(res.error ?? "Gagal mengubah akses.");
        setPendingId(null);
        return;
      }
      refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <h2 className="mb-1 text-h4 font-bold tracking-tight">Kelola akses</h2>
      <p className="mb-4 text-tiny text-ink-soft">
        Kelola asisten pelatih dan akses orang tua/wali ke rapor atlet.
      </p>

      {/* ── Asisten pelatih ── */}
      <div className="mb-6">
        <p className="mb-2 text-small font-bold">Asisten pelatih</p>

        {teams.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-3 text-tiny text-ink-faint">
            Belum ada tim. Buat tim di Kelola Tim untuk menambahkan asisten.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              {teams.length > 1 ? (
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-small text-ink sm:w-52"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email asisten"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="shrink-0"
              >
                + Tambah
              </Button>
            </div>
            <FieldError>{error ?? undefined}</FieldError>
          </>
        )}

        {assistants.length === 0 ? (
          <p className="mt-3 text-tiny text-ink-faint">
            Belum ada asisten pelatih di tim Anda.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {assistants.map((a) => (
              <li key={a.memberId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-small font-semibold">{a.fullName}</p>
                  <p className="mt-0.5 truncate text-tiny text-ink-soft">
                    {a.email ?? "—"} · {a.teamName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === a.memberId}
                  onClick={() => handleRemove(a.memberId)}
                  className="shrink-0 text-danger hover:text-danger-strong"
                >
                  {pendingId === a.memberId ? "Menghapus…" : "Hapus"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Orang tua / wali ── */}
      <div>
        <p className="mb-2 text-small font-bold">Akses orang tua / wali</p>
        <p className="mb-3 text-tiny text-ink-soft">
          Tautan rapor yang dibagikan hanya bisa diakses selama status akun aktif.
        </p>

        {parentLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-3 text-tiny text-ink-faint">
            Belum ada orang tua/wali yang terhubung ke atlet tim Anda.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {parentLinks.map((p) => (
              <li key={p.linkId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-small font-semibold">
                    {p.parentName}
                    <span className="ml-1.5 font-normal text-ink-faint">
                      {p.parentEmail ?? ""}
                    </span>
                  </p>
                  <p className="mt-0.5 text-tiny text-ink-soft">
                    {p.relationship} dari {p.athleteName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-tiny font-semibold",
                      PARENT_STATUS_BADGE[p.status] ?? "bg-neutral-soft text-ink-soft",
                    )}
                  >
                    {p.status === "active"
                      ? "Aktif"
                      : p.status === "pending"
                        ? "Menunggu"
                        : "Dicabut"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === p.linkId}
                    onClick={() => handleToggleParent(p.linkId, p.status)}
                  >
                    {pendingId === p.linkId
                      ? "Menyimpan…"
                      : p.status === "active"
                        ? "Cabut akses"
                        : "Aktifkan"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}