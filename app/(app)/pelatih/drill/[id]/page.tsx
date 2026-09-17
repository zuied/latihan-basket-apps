import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOwnerIds } from "@/lib/program-access";
import { DrillEditModal } from "@/components/drill/drill-edit-modal";
import { DrillDeleteModal } from "@/components/drill/drill-delete-modal";
import {
  DIFF_META,
  drillToInput,
  TARGET_LABEL,
  TARGET_TYPES,
} from "@/lib/drill";
import { cn } from "@/lib/cn";

function variantClass(variant: string) {
  return cn(
    "rounded-full px-2.5 py-0.5 text-tiny font-semibold",
    variant === "success"
      ? "bg-success-soft text-success"
      : variant === "warning"
        ? "bg-warning-soft text-warning"
        : variant === "danger"
          ? "bg-danger-soft text-danger"
          : "bg-neutral-soft text-ink-soft",
  );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function CoachDrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const { id } = await params;
  const ownerIds = await resolveOwnerIds(user);

  const drill = await prisma.drill.findFirst({
    where: { id, ownerId: { in: ownerIds } },
    include: {
      sessionDrills: {
        select: {
          session: { select: { id: true, name: true, scheduledAt: true } },
        },
      },
    },
  });

  if (!drill) notFound();

  const meta = DIFF_META[drill.difficulty] ?? {
    label: drill.difficulty,
    variant: "neutral" as const,
  };
  const targetLabel =
    TARGET_LABEL[drill.targetType]?.(drill.defaultTargetValue) ?? "—";
  const targetTypeLabel =
    TARGET_TYPES.find((t) => t.value === drill.targetType)?.label ??
    drill.targetType;

  const detailData = drillToInput(drill);
  const processedDrills = drill.sessionDrills.map(({ session }) => session);
  const usedInSessions = processedDrills.length > 0;
  const positions = asStringArray(drill.relevantPositions);
  const equipment = asStringArray(drill.equipment);
  const variations = asStringArray(drill.variations);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pelatih/drill"
        className="mb-4 inline-flex items-center gap-1.5 text-small font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Kembali ke bank materi
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 font-semibold tracking-tight">{drill.name}</h1>
            <span className={variantClass(meta.variant)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-small text-ink-soft">
            {drill.mainCategory} · {drill.subCategory}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-soft">
            <span>Target: <strong className="text-ink">{targetLabel}</strong></span>
            <span>Posisi: <strong className="text-ink">{positions.length > 0 && positions[0] !== "Semua" ? positions.join(", ") : "Semua"}</strong></span>
            <span>Peralatan: <strong className="text-ink">{equipment.length > 0 ? equipment.join(", ") : "—"}</strong></span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DrillEditModal drill={detailData} />
          <DrillDeleteModal drillId={drill.id} drillName={drill.name} />
        </div>
      </header>

      {drill.description ? (
        <section className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <h2 className="mb-2 text-h4 font-bold tracking-tight">Deskripsi & Cara Pelaksanaan</h2>
          <p className="text-small text-ink-soft whitespace-pre-line">{drill.description}</p>
        </section>
      ) : null}

      {drill.videoUrl ? (
        <section className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <h2 className="mb-2 text-h4 font-bold tracking-tight">Referensi Visual</h2>
          <a
            href={drill.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-primary underline underline-offset-2 hover:text-primary-strong"
          >
            {drill.videoUrl}
          </a>
        </section>
      ) : null}

      {variations.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <h2 className="mb-2 text-h4 font-bold tracking-tight">Variasi / Progresi</h2>
          <ul className="space-y-1.5">
            {variations.map((v, i) => (
              <li key={`${v}-${i}`} className="flex items-start gap-2 text-small text-ink-soft">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {v}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-2 text-h4 font-bold tracking-tight">Penggunaan</h2>
        {usedInSessions ? (
          <div>
            <p className="text-small text-ink-soft mb-3">
              Drill ini digunakan dalam <strong className="text-ink">{processedDrills.length}</strong> sesi latihan:
            </p>
            <ul className="space-y-1.5">
              {processedDrills.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-tiny text-ink-soft">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span>{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(s.scheduledAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-small text-ink-soft">
            Belum digunakan di sesi latihan mana pun.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <h2 className="mb-2 text-h4 font-bold tracking-tight">Detail Teknis</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-canvas px-3 py-2">
            <p className="text-tiny text-ink-faint">Kategori</p>
            <p className="text-small font-medium text-ink">{drill.mainCategory}</p>
          </div>
          <div className="rounded-lg bg-canvas px-3 py-2">
            <p className="text-tiny text-ink-faint">Sub kategori</p>
            <p className="text-small font-medium text-ink">{drill.subCategory}</p>
          </div>
          <div className="rounded-lg bg-canvas px-3 py-2">
            <p className="text-tiny text-ink-faint">Tipe target</p>
            <p className="text-small font-medium text-ink">{targetTypeLabel}</p>
          </div>
          <div className="rounded-lg bg-canvas px-3 py-2">
            <p className="text-tiny text-ink-faint">Template publik</p>
            <p className="text-small font-medium text-ink">{drill.isPublicTemplate ? "Ya" : "Tidak"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}