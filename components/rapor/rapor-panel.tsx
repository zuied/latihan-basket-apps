"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSharedReport, deleteSharedReport, type RaporStructuredData } from "@/app/(app)/pelatih/rapor/actions";

export type SharedReportItem = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  expiresAt: string;
};

const DEFAULT_CATEGORIES = [
  { name: "Fundamental (dribbling, shooting, passing)", score: 0, maxScore: 10, notes: "" },
  { name: "Fisik (kekuatan, kecepatan, endurance)", score: 0, maxScore: 10, notes: "" },
  { name: "Taktik (pembacaan permainan, positioning)", score: 0, maxScore: 10, notes: "" },
  { name: "Mental (kepemimpinan, fokus, sportivitas)", score: 0, maxScore: 10, notes: "" },
];

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
  const [showForm, setShowForm] = useState<string | null>(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [attitudeNotes, setAttitudeNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [nextCycleFocus, setNextCycleFocus] = useState("");

  const copyText = (text: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  const fullUrl = (slug: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : baseUrl;
    return `${origin}/berbagi/${slug}`;
  };

  const handleGenerate = (athleteId: string) => {
    const structured: RaporStructuredData = {
      categories,
      qualitativeNotes: { strengths, improvements, attitudeNotes },
      recommendations,
      nextCycleFocus,
    };
    setError(null);
    startGenerate(async () => {
      const res = await createSharedReport(athleteId, structured);
      if (res.ok && res.slug) {
        const url = `${window.location.origin}/berbagi/${res.slug}`;
        copyText(url);
        setError(null);
        setShowForm(null);
        setCategories(DEFAULT_CATEGORIES);
        setStrengths("");
        setImprovements("");
        setAttitudeNotes("");
        setRecommendations("");
        setNextCycleFocus("");
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
          {athletes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong bg-panel px-4 py-6 text-center text-small text-ink-soft">
              Belum ada atlet. Tambahkan atlet ke tim untuk membuat tautan rapor.
            </p>
          ) : null}
          {athletes.map((a) => (
            <div key={a.id} className="rounded-xl border border-line">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="truncate text-small font-medium">{a.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setShowForm(showForm === a.id ? null : a.id)}
                  >
                    {showForm === a.id ? "Tutup" : "Rapor detail"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleGenerate(a.id)}
                  >
                    {isGenerating ? "Membuat..." : "Buat tautan"}
                  </Button>
                </div>
              </div>
              {showForm === a.id ? (
                <div className="border-t border-line px-3 py-4 space-y-4">
                  <div>
                    <p className="mb-2 text-tiny font-bold uppercase tracking-wide text-ink-faint">Penilaian per kategori</p>
                    <div className="space-y-2">
                      {categories.map((cat, idx) => (
                        <div key={cat.name} className="rounded-lg bg-canvas p-3">
                          <p className="text-tiny font-medium text-ink">{cat.name}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={cat.maxScore}
                              value={cat.score}
                              onChange={(e) => {
                                const next = [...categories];
                                next[idx] = { ...next[idx], score: Number(e.target.value) };
                                setCategories(next);
                              }}
                              className="flex-1 accent-primary"
                            />
                            <span className="w-8 text-center text-small font-bold text-primary">{cat.score}/{cat.maxScore}</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={cat.notes}
                            onChange={(e) => {
                              const next = [...categories];
                              next[idx] = { ...next[idx], notes: e.target.value };
                              setCategories(next);
                            }}
                            className="mt-1.5 w-full rounded-lg border border-line bg-panel px-2.5 py-1.5 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-tiny font-bold uppercase tracking-wide text-ink-faint">Evaluasi kualitatif</p>
                    <div className="space-y-2">
                      <textarea placeholder="Kekuatan atlet..." value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none" />
                      <textarea placeholder="Area perbaikan..." value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none" />
                      <textarea placeholder="Catatan sikap & perilaku..." value={attitudeNotes} onChange={(e) => setAttitudeNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-tiny font-bold uppercase tracking-wide text-ink-faint">Rekomendasi</p>
                    <textarea placeholder="Rekomendasi untuk siklus berikutnya..." value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <p className="mb-2 text-tiny font-bold uppercase tracking-wide text-ink-faint">Fokus siklus berikutnya</p>
                    <input type="text" placeholder="Contro: Shooting, Endurance, dll." value={nextCycleFocus} onChange={(e) => setNextCycleFocus(e.target.value)} className="w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-tiny text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none" />
                  </div>
                </div>
              ) : null}
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