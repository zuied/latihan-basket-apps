"use client";

import { useActionState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  createAnnouncement,
  deleteAnnouncement,
  type AnnouncementState,
} from "@/app/(app)/pelatih/pengumuman/actions";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string | null;
  teamName: string | null;
  athleteName: string | null;
  createdAt: string;
};

export function AnnouncementsPanel({
  items,
  isCoach,
}: {
  items: AnnouncementItem[];
  isCoach: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    AnnouncementState,
    FormData
  >(createAnnouncement, undefined);
  const [deleting, startDelete] = useTransition();

  const doDelete = (id: string) => {
    startDelete(async () => {
      await deleteAnnouncement(id);
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-h2 font-bold tracking-tight">Pengumuman</h1>
      <p className="mb-6 text-small text-ink-soft">
        Kirim pengumuman ke atlet & orang tua.
      </p>

      {isCoach ? (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="mb-3 text-small font-bold">Buat pengumuman baru</p>
          <form action={formAction} className="space-y-3">
            <div>
              <Label htmlFor="ann-title">Judul</Label>
              <Input id="ann-title" name="title" placeholder="Cth: Jadwal latihan pekan ini" />
            </div>
            <div>
              <Label htmlFor="ann-content">Isi</Label>
              <Textarea
                id="ann-content"
                name="content"
                placeholder="Tulis detail pengumuman…"
                rows={3}
              />
            </div>
            <FieldError>{state?.error}</FieldError>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Mengirim…" : "Kirim pengumuman"}
            </Button>
          </form>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-line bg-panel p-6 text-center text-small text-ink-soft">
            Belum ada pengumuman.
          </p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-small font-bold">{a.title}</p>
                  <Badge variant="neutral">
                    {a.athleteName
                      ? `Pribadi · ${a.athleteName}`
                      : a.teamName
                        ? `Tim · ${a.teamName}`
                        : "Semua"}
                  </Badge>
                </div>
                {a.content ? (
                  <p className="mt-1.5 text-tiny text-ink-soft">{a.content}</p>
                ) : null}
                <p className="mt-2 text-tiny text-ink-faint">{a.createdAt}</p>
              </div>
              {isCoach ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => doDelete(a.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-tiny font-medium text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  Hapus
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}