"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CourtPreview } from "@/components/playbook/court-editor";
import { clonePlay } from "@/app/(app)/pelatih/program/actions";

export type TemplatePlay = {
  id: string;
  name: string;
  description: string | null;
  elements: Record<string, unknown>[];
};

export function PlayTemplateLibrary({
  templates,
  programId,
  onCloned,
}: {
  templates: TemplatePlay[];
  programId: string;
  onCloned?: (play: {
    id: string;
    name: string;
    description: string | null;
    elements: Record<string, unknown>[];
  }) => void;
}) {
  const router = useRouter();
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleClone = (templateId: string) => {
    setError(null);
    setCloningId(templateId);
    (async () => {
      const res = await clonePlay(templateId, programId);
      setCloningId(null);
      if (res.ok && res.play) {
        if (onCloned) {
          onCloned(res.play);
        } else {
          router.refresh();
        }
      } else if (res.error) {
        setError(res.error);
      }
    })();
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-small font-bold">📚 Perpustakaan Template</p>
          <p className="mt-0.5 text-tiny text-ink-soft">
            Set play standar siap pakai. Klik &quot;Gunakan&quot; untuk menyalin ke program tim ini, lalu sesuaikan.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari template..."
          className="w-40 rounded-lg border border-line-strong bg-canvas px-3 py-1.5 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-tiny text-danger">{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-canvas p-6 text-center text-tiny text-ink-soft">
          Tidak ada template yang cocok.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-canvas">
              <div className="border-b border-line bg-neutral-soft">
                <CourtPreview elements={t.elements} className="border-0 rounded-none" />
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="text-tiny font-bold">{t.name}</p>
                <p className="mt-1 line-clamp-2 flex-1 text-[10px] text-ink-soft">
                  {t.description}
                </p>
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-2 h-auto"
                  disabled={cloningId === t.id}
                  onClick={() => handleClone(t.id)}
                >
                  {cloningId === t.id ? "Menyalin..." : "Gunakan template"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}