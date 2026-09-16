"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSharedReport, deleteSharedReport } from "@/app/(app)/pelatih/rapor/actions";

export type SharedReportItem = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  expiresAt: string;
};

export function RaporPanel({
  athletes,
  reports,
  baseUrl,
}: {
  athletes: { id: string; name: string }[];
  reports: SharedReportItem[];
  baseUrl: string;
}) {
  const [isGenerating, startGenerate] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyText = (text: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  const fullUrl = (slug: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : baseUrl;
    return `${origin}/berbagi/${slug}`;
  };

  const handleGenerate = (athleteId: string) => {
    setError(null);
    startGenerate(async () => {
      const res = await createSharedReport(athleteId);
      if (res.ok && res.slug) {
        const url = `${window.location.origin}/berbagi/${res.slug}`;
        copyText(url);
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    (async () => {
      await deleteSharedReport(id);
      setDeletingId(null);
    })();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-h2 font-bold tracking-tight">Rapor</h1>
      <p className="mb-6 text-small text-ink-soft">
        Buat tautan rapor ringkas untuk dibagikan ke orang tua/wali. Tautan
        berlaku 30 hari.
      </p>

      <div className="mb-8 rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <p className="mb-3 text-small font-bold">Buat tautan rapor atlet</p>
        {error ? (
          <p className="mb-2 rounded-lg bg-danger-soft px-3 py-2 text-tiny text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {athletes.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5"
            >
              <span className="truncate text-small font-medium">{a.name}</span>
              <Button
                variant="soft"
                size="sm"
                disabled={isGenerating}
                onClick={() => handleGenerate(a.id)}
              >
                Buat tautan
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="mb-3 text-h4 font-bold tracking-tight">Tautan yang dibuat</p>
      <div className="space-y-2">
        {reports.length === 0 ? (
          <p className="rounded-2xl border border-line bg-panel p-6 text-center text-small text-ink-soft">
            Belum ada tautan rapor yang dibuat.
          </p>
        ) : (
          reports.map((r) => {
            const linkUrl = fullUrl(r.slug);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-small font-bold">{r.title}</p>
                    <Badge variant="neutral">aktif</Badge>
                  </div>
                  <p className="mt-1 truncate text-tiny text-ink-faint">
                    {linkUrl}
                  </p>
                  <p className="mt-0.5 text-tiny text-ink-soft">
                    Dibuat {r.createdAt} · Kedaluwarsa {r.expiresAt}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyText(linkUrl)}
                  >
                    Salin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r.id)}
                    className="text-danger"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}