"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { updatePlay, deletePlay } from "@/app/(app)/pelatih/program/actions";

// =====================================================================
// Utilitas koordinat lapangan
// Lapangan dipetakan ke viewBox 0..500 (lebar) x 0..470 (tinggi),
// ring serang di atas. Tiap elemen disimpan dalam unit viewBox.
// =====================================================================

export type PlayElement =
  | { kind: "player"; id: string; x: number; y: number; number: number }
  | { kind: "arrow"; id: string; x1: number; y1: number; x2: number; y2: number }
  | { kind: "cut"; id: string; x1: number; y1: number; x2: number; y2: number }
  | { kind: "screen"; id: string; x1: number; y1: number; x2: number; y2: number };

export type PlayData = {
  id: string;
  name: string;
  description: string | null;
  programId?: string;
  elements: { kind: string; id: string; [k: string]: unknown }[];
};

type Tool = "select" | "player" | "arrow" | "cut" | "screen";

const W = 500;
const H = 470;
const uid = () => Math.random().toString(36).slice(2, 10);

function newId(kind: PlayElement["kind"]): string {
  return `${kind}-${uid()}`;
}

function mirrorX(p: PlayElement): PlayElement {
  if (p.kind === "player") return { ...p, x: W - p.x };
  return { ...p, x1: W - p.x1, x2: W - p.x2 };
}

function normalize(el: Record<string, unknown>): PlayElement {
  const kind = String(el.kind ?? "player");
  switch (kind) {
    case "arrow":
    case "cut":
    case "screen":
      return {
        kind,
        id: String(el.id ?? newId(kind)),
        x1: Number(el.x1 ?? 0),
        y1: Number(el.y1 ?? 0),
        x2: Number(el.x2 ?? 0),
        y2: Number(el.y2 ?? 0),
      } as PlayElement;
    default:
      return {
        kind: "player",
        id: String(el.id ?? newId("player")),
        x: Number(el.x ?? 0),
        y: Number(el.y ?? 0),
        number: Number(el.number ?? 1),
      };
  }
}

// =====================================================================
// Latar lapangan (SVG half court)
// =====================================================================

function CourtBackground() {
  const CY = 235; // pusat area
  return (
    <g>
      <rect width={W} height={H} className="fill-neutral-soft" rx={4} />
      {/* garis lapangan */}
      <rect x={6} y={6} width={W - 12} height={H - 12} fill="none" className="stroke-line-strong" strokeWidth={2} />
      {/* garis tengah bawah */}
      <line x1={6} y1={H - 6} x2={W - 6} y2={H - 6} className="stroke-line-strong" strokeWidth={2} />
      {/* lingkaran tengah (di bawah, sisi lawan) */}
      <circle cx={W / 2} cy={H - 6} r={45} fill="none" className="stroke-line-strong" strokeWidth={2} />
      {/* backboard & ring (atas) */}
      <rect x={W / 2 - 35} y={6} width={70} height={4} className="fill-ink-soft" />
      <rect x={W / 2 - 2} y={12} width={5} height={5} className="fill-danger" />
      {/* key / paint */}
      <rect x={W / 2 - 75} y={6} width={150} height={140} fill="none" className="stroke-line-strong" strokeWidth={2} />
      {/* garis lemparan bebas */}
      <line x1={W / 2 - 75} y1={146} x2={W / 2 + 75} y2={146} className="stroke-line-strong" strokeWidth={2} />
      {/* lingkaran lemparan bebas (setengah atas) */}
      <circle cx={W / 2} cy={146} r={45} fill="none" className="stroke-line-strong" strokeWidth={2} />
      {/* busur tiga angka */}
      <path
        d={`M ${W / 2 - 105} 6 L ${W / 2 - 105} ${CY - 95} A 105 105 0 0 1 ${W / 2 + 105} ${CY - 95} L ${W / 2 + 105} 6`}
        fill="none"
        className="stroke-line-strong"
        strokeWidth={2}
      />
    </g>
  );
}

// Indikator label tool di lapangan
const OPPOSING = {
  select: null,
  player: null,
  arrow: "Klik titik awal → titik akhir (panah pergerakan)",
  cut: "Klik titik awal → titik akhir (lintasan cut dashed)",
  screen: "Klik titik awal → titik akhir (blok screen)",
} as const;

// =====================================================================
// Layer elemen (dipakai editor & preview)
// =====================================================================

function PlayElementsLayer({
  elements,
  selectedId = null,
}: {
  elements: PlayElement[];
  selectedId?: string | null;
}) {
  return (
    <g>
      {elements.map((el) => {
        const id = (el as { id: string }).id;
        const selected = selectedId !== null && (id === selectedId || id === "draft-preview");
        if (el.kind === "player") {
          return (
            <g key={id}>
              <circle
                cx={el.x}
                cy={el.y}
                r={13}
                fill={selected ? "#dc2626" : el.number % 2 === 0 ? "#64748b" : "#0f172a"}
                className="cursor-grab"
              />
              <text
                x={el.x}
                y={el.y + 4}
                textAnchor="middle"
                className="fill-white text-[13px] font-bold"
              >
                {el.number}
              </text>
            </g>
          );
        }
        const dotted = el.kind === "cut";
        const thick = el.kind === "screen";
        const stroke = el.kind === "screen" ? "#dc2626" : el.kind === "cut" ? "#d97706" : "#2563eb";
        return (
          <line
            key={id}
            x1={el.x1}
            y1={el.y1}
            x2={el.x2}
            y2={el.y2}
            stroke={stroke}
            strokeWidth={thick ? 7 : 2.5}
            strokeLinecap="round"
            strokeDasharray={thick ? undefined : dotted ? "7 5" : undefined}
            markerEnd={thick ? undefined : "url(#arrowHead)"}
            className={selected ? "opacity-70" : undefined}
          />
        );
      })}
    </g>
  );
}

// =====================================================================
// Preview read-only (untuk kartu template)
// =====================================================================

export function CourtPreview({
  elements,
  className,
}: {
  elements: Record<string, unknown>[];
  className?: string;
}) {
  const normalized = Array.isArray(elements)
    ? elements.map((e) => normalize(e as Record<string, unknown>))
    : [];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("w-full rounded-lg border border-line", className)}
      aria-hidden
    >
      <CourtBackground />
      <PlayElementsLayer elements={normalized} />
      <defs>
        <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" className="fill-slate-500" />
        </marker>
      </defs>
    </svg>
  );
}

// =====================================================================
// Editor
// =====================================================================

export function PlaybookEditor({
  play,
  onSaved,
  onDeleted,
  onCreate,
}: {
  play: PlayData;
  onSaved?: (p: PlayData) => void;
  onDeleted?: (id: string) => void;
  onCreate?: () => void;
}) {
  const [elements, setElements] = useState<PlayElement[]>(() =>
    Array.isArray(play.elements) ? play.elements.map(normalize) : [],
  );
  const [name, setName] = useState(play.name);
  const [description, setDescription] = useState(play.description ?? "");
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const playerNumbers = useMemo(
    () => elements.filter((e) => e.kind === "player").map((e) => (e as { number: number }).number),
    [elements],
  );
  const nextNumber =
    useMemo(
      () => Math.max(0, ...playerNumbers.map((n) => Number.isFinite(n) ? n : 0)) + 1,
      [playerNumbers],
    );

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.round(((clientX - rect.left) / rect.width) * W),
      y: Math.round(((clientY - rect.top) / rect.height) * H),
    };
  };

  const findPlayerAt = (x: number, y: number) =>
    elements.find(
      (e) => e.kind === "player" && Math.hypot(e.x - x, e.y - y) < 14,
    ) as Extract<PlayElement, { kind: "player" }> | undefined;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toSvgPoint(e.clientX, e.clientY);
    if (!pt) return;

    if (tool === "select") {
      const player = findPlayerAt(pt.x, pt.y);
      if (player) {
        setSelectedId(player.id);
        setDraggingId(player.id);
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "player") {
      const el: PlayElement = {
        kind: "player",
        id: newId("player"),
        x: pt.x,
        y: pt.y,
        number: nextNumber,
      };
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      return;
    }

    // arrow / cut / screen: dua klik — titik awal lalu titik akhir
    setDraft(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toSvgPoint(e.clientX, e.clientY);
    if (!pt) return;

    if (draggingId) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === draggingId && el.kind === "player"
            ? { ...el, x: pt.x, y: pt.y }
            : el,
        ),
      );
      return;
    }

    if (draft && (tool === "arrow" || tool === "cut" || tool === "screen")) {
      // pratinjau garis mengikuti kursor
      setElements((prev) => {
        const idx = prev.findIndex((el) => (el as { id: string }).id === "draft-preview");
        const preview: PlayElement =
          tool === "arrow"
            ? { kind: "arrow", id: "draft-preview", x1: draft.x, y1: draft.y, x2: pt.x, y2: pt.y }
            : tool === "cut"
              ? { kind: "cut", id: "draft-preview", x1: draft.x, y1: draft.y, x2: pt.x, y2: pt.y }
              : { kind: "screen", id: "draft-preview", x1: draft.x, y1: draft.y, x2: pt.x, y2: pt.y };
        const next = [...prev];
        if (idx >= 0) next[idx] = preview;
        else next.push(preview);
        return next;
      });
    }
  };

  const commitDraft = (pt: { x: number; y: number }) => {
    if (!draft) return;
    const toolKind: PlayElement["kind"] =
      tool === "screen" ? "screen" : tool === "cut" ? "cut" : "arrow";
    const el: PlayElement = {
      kind: toolKind,
      id: newId(toolKind),
      x1: draft.x,
      y1: draft.y,
      x2: pt.x,
      y2: pt.y,
    };
    setElements((prev) => [
      ...prev.filter((e) => (e as { id: string }).id !== "draft-preview"),
      el,
    ]);
    setDraft(null);
    setSelectedId(el.id);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingId) {
      setDraggingId(null);
      return;
    }
    if (draft && (tool === "arrow" || tool === "cut" || tool === "screen")) {
      const pt = toSvgPoint(e.clientX, e.clientY);
      if (pt) commitDraft(pt);
    }
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => (el as { id: string }).id !== selectedId));
    setSelectedId(null);
  };

  const clearAll = () => {
    setElements([]);
    setSelectedId(null);
    setDraft(null);
  };

  const flip = () => {
    setElements((prev) =>
      prev.map((el) => (el as { kind: string }).kind === "player" ? mirrorX(el) : el),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const clean = elements.filter((el) => (el as { id: string }).id !== "draft-preview");
    setElements(clean);
    const finalName = name.trim() || play.name;
    const res = await updatePlay(play.id, {
      name: finalName,
      description,
      elements: clean as unknown as Record<string, unknown>[],
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved?.({
        ...play,
        name: finalName,
        description: description.trim() ? description : null,
        elements: clean,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus set play ini?")) return;
    setDeleting(true);
    await deletePlay(play.id);
    setDeleting(false);
    onDeleted?.(play.id);
  };

  const handleNew = () => {
    onCreate?.();
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-small font-bold">{name}</p>
          <p className="mt-0.5 text-tiny text-ink-faint">
            Gambarkan formasi awal lalu tambahkan aksi (arrow, cut, screen).
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {saved ? <span className="text-tiny text-success">Tersimpan</span> : null}
          <Button variant="ghost" size="sm" onClick={handleNew} className="h-auto">
            + Set Play
          </Button>
          <Button variant="ghost" size="sm" onClick={flip} className="h-auto">
            Balik arah
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto text-danger">
            Reset
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving} className="h-auto">
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <Label htmlFor={`play-name-${play.id}`}>Nama play</Label>
          <Input
            id={`play-name-${play.id}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="mis. Pick & Roll — Sisi Kiri"
          />
        </div>
        <div>
          <Label htmlFor={`play-desc-${play.id}`}>Deskripsi (opsional)</Label>
          <Input
            id={`play-desc-${play.id}`}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaved(false);
            }}
            placeholder="Instruksi singkat jalannya set play"
          />
        </div>
      </div>

      {/* Tool palette */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(
          [
            ["select", "Pilih"],
            ["player", "Pemain"],
            ["arrow", "Pergerakan"],
            ["cut", "Cutting"],
            ["screen", "Screen"],
          ] as [Tool, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTool(t);
              setDraft(null);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-tiny font-medium transition-colors",
              tool === t
                ? "bg-primary text-white"
                : "bg-canvas text-ink-soft hover:bg-neutral-soft",
            )}
          >
            {label}
          </button>
        ))}

        {selectedId && tool === "select" ? (
          <button
            type="button"
            onClick={removeSelected}
            className="ml-auto rounded-lg bg-danger-soft px-3 py-1.5 text-tiny font-medium text-danger transition-colors hover:bg-danger hover:text-white"
          >
            Hapus elemen terpilih
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none rounded-xl border border-line bg-panel select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <CourtBackground />

            <PlayElementsLayer elements={elements} selectedId={selectedId} />
            {draft && tool === "player" ? null : null}
            <defs>
              <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" className="fill-slate-500" />
              </marker>
            </defs>
          </svg>

          {tool !== "select" ? (
            <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-panel/90 px-3 py-1 text-[10px] font-medium text-ink-soft shadow-sm">
              {OPPOSING[tool]}
            </p>
          ) : null}
        </div>

        {/* Panel samping: petunjuk & aksi */}
        <aside className="flex flex-col gap-2 text-tiny">
          <div className="rounded-xl bg-canvas p-3">
            <p className="mb-1.5 font-bold text-ink">Cara pakai</p>
            <ul className="space-y-1 text-ink-soft">
              <li>1. Pilih alat di atas.</li>
              <li>2. Pemain: klik untuk letakkan (nomor otomatis).</li>
              <li>3. Pergerakan/Cutting/Screen: klik titik awal &amp; akhir.</li>
              <li>4. Alat Pilih: seret pemain, klik untuk hapus.</li>
            </ul>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <p className="mb-1.5 font-bold text-ink">Legenda</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full bg-ink" />
                <span className="text-ink-soft">Pemain (nomor otomatis)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-5 bg-blue-600" />
                <span className="text-ink-soft">Pergerakan</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 border-t-2 border-dashed border-amber-600" />
                <span className="text-ink-soft">Cutting</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-5 rounded bg-danger" />
                <span className="text-ink-soft">Screen</span>
              </li>
            </ul>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="h-auto text-danger">
            {deleting ? "Menghapus..." : "Hapus set play"}
          </Button>
        </aside>
      </div>
    </div>
  );
}