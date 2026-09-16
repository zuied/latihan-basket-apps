"use client";

import { useMemo, useState, useTransition } from "react";
import { SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { deleteDrill } from "@/app/(app)/pelatih/drill/actions";
import { DrillFormModal } from "./drill-form";
import {
  DIFF_META,
  TARGET_LABEL,
  type DrillInput,
} from "@/lib/drill";

const CATEGORY_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "Fundamental Individu", label: "Fundamental Individu" },
  { value: "Fisik & Atletis", label: "Fisik & Atletis" },
  { value: "Taktik & Tim", label: "Taktik & Tim" },
  { value: "Mental & Game IQ", label: "Mental & Game IQ" },
] as const;

type CategoryValue = (typeof CATEGORY_FILTERS)[number]["value"];

export function DrillLibrary({ drills }: { drills: DrillInput[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryValue>("all");
  const [editing, setEditing] = useState<DrillInput | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<DrillInput | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (drill: DrillInput) => {
    setEditing(drill);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    startDelete(async () => {
      await deleteDrill(deleting.id);
      setDeleting(null);
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drills.filter((drill) => {
      if (category !== "all" && drill.mainCategory !== category) return false;
      if (!q) return true;
      return (
        drill.name.toLowerCase().includes(q) ||
        drill.subCategory.toLowerCase().includes(q) ||
        (drill.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [drills, query, category]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: drills.length };
    for (const drill of drills) {
      map[drill.mainCategory] = (map[drill.mainCategory] ?? 0) + 1;
    }
    return map;
  }, [drills]);

  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title="Drill Library"
        description={`${drills.length} drill dalam bank materi Anda.`}
        action={
          <Button variant="primary" onClick={openCreate}>
            <PlusIcon />
            Buat drill
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          items={CATEGORY_FILTERS}
          value={category}
          onChange={setCategory}
          render={(item) => (
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              <span className="text-tiny text-ink-faint">{counts[item.value] ?? 0}</span>
            </span>
          )}
        />
        <div className="relative w-full lg:w-64">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari drill..."
            className="w-full rounded-lg border border-line bg-panel py-2 pl-9 pr-3 text-small text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={drills.length === 0 ? "Belum ada drill" : "Tidak ada hasil"}
          description={
            drills.length === 0
              ? "Buat drill pertama Anda dari bank materi latihan."
              : "Coba ubah kata kunci atau filter kategori."
          }
          action={
            drills.length === 0 ? (
              <Button onClick={openCreate}>Buat drill pertama</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onEdit={() => openEdit(drill)}
              onDelete={() => setDeleting(drill)}
            />
          ))}
        </div>
      )}

      {formOpen ? (
        <DrillFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          drill={editing}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Hapus drill?"
          description="Tindakan ini tidak dapat dibatalkan."
        >
          <div className="space-y-4">
            <p className="text-small text-ink-soft">
              Drill <span className="font-semibold text-ink">{deleting.name}</span> akan dihapus
              permanen dari bank materi Anda.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleting(null)} disabled={isDeleting}>
                Batal
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Menghapus..." : "Hapus drill"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function DrillCard({
  drill,
  onEdit,
  onDelete,
}: {
  drill: DrillInput;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = DIFF_META[drill.difficulty] ?? {
    label: drill.difficulty,
    variant: "neutral" as const,
  };
  const targetLabel = TARGET_LABEL[drill.targetType]?.(drill.defaultTargetValue) ?? "—";

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">{drill.name}</h3>
          <p className="mt-0.5 text-tiny text-ink-soft">
            {drill.mainCategory} · {drill.subCategory}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${drill.name}`}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-neutral-soft hover:text-ink"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Hapus ${drill.name}`}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <Badge className="mt-3 w-fit" variant={meta.variant}>
        {meta.label}
      </Badge>

      <div className="mt-auto space-y-2 pt-4">
        <p className="text-small font-medium text-ink">
          Target: <span className="text-ink-soft">{targetLabel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {drill.relevantPositions.length > 0 ? (
            <span className="inline-flex items-center rounded-md bg-primary-faint px-2 py-0.5 text-tiny font-medium text-primary">
              {drill.relevantPositions.join(", ")}
            </span>
          ) : null}
          {drill.equipment.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-md bg-neutral-soft px-2 py-0.5 text-tiny font-medium text-ink-soft"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.3 2.7a1.7 1.7 0 0 1 2.4 2.4L5.4 13.4 2 14.3l.9-3.4 8.4-8.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h10M6.5 4V3h3v1M4.5 4.5l.7 8.3h5.6l.7-8.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}