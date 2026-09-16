import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CoachAssessmentsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const packs = await prisma.assessmentPack.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { orderIndex: "asc" }, include: { drill: true } },
      results: {
        orderBy: { conductedAt: "desc" },
        include: {
          athlete: { select: { id: true, fullName: true, position: true } },
          conductor: { select: { fullName: true } },
          resultItems: {
            include: {
              item: {
                include: {
                  drill: { select: { name: true, subCategory: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Group results per athlete (take latest baseline)
  const athleteMap = new Map<
    string,
    {
      id: string;
      name: string;
      position: string | null;
      latestResult: (typeof packs)[0]["results"][0] | null;
      resultCount: number;
    }
  >();

  for (const pack of packs) {
    for (const result of pack.results) {
      const existing = athleteMap.get(result.athleteId);
      if (!existing || result.conductedAt > (existing.latestResult?.conductedAt ?? new Date(0))) {
        athleteMap.set(result.athleteId, {
          id: result.athlete.id,
          name: result.athlete.fullName,
          position: result.athlete.position,
          latestResult: result,
          resultCount: (existing?.resultCount ?? 0) + 1,
        });
      }
    }
  }

  const athletes = Array.from(athleteMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const dateFormat = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="Asesmen"
          description={`${packs.length} paket asesmen · ${athletes.length} atlet terukur`}
        />
        <Link
          href="/pelatih/drill"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-small font-medium text-ink-soft transition-colors hover:bg-neutral-soft"
        >
          Lihat bank drill →
        </Link>
      </div>

      {packs.map((pack) => {
        const packAthletes = athletes.filter((a) =>
          pack.results.some((r) => r.athleteId === a.id),
        );

        return (
          <div key={pack.id} className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-h4 font-bold tracking-tight">{pack.name}</h2>
              <Badge variant="neutral">{pack.items.length} item</Badge>
            </div>
            {pack.description ? (
              <p className="mb-4 text-small text-ink-soft">{pack.description}</p>
            ) : null}

            {packAthletes.length === 0 ? (
              <p className="text-small text-ink-soft">Belum ada hasil asesmen.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {packAthletes.map((ath) => {
                  const result = ath.latestResult;
                  if (!result) return null;
                  return (
                    <div
                      key={ath.id}
                      className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-small font-bold">
                            <Link
                              href={`/pelatih/atlet/${ath.id}`}
                              className="hover:underline"
                            >
                              {ath.name}
                            </Link>
                          </p>
                          <p className="mt-0.5 text-tiny text-ink-soft">
                            {ath.position ?? "Posisi belum diisi"} ·{" "}
                            {dateFormat.format(result.conductedAt)}
                          </p>
                        </div>
                        <Badge variant={result.isBaseline ? "success" : "neutral"}>
                          {result.isBaseline ? "Baseline" : "Berkala"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {result.resultItems.map((ri) => (
                          <div
                            key={ri.id}
                            className="rounded-lg bg-canvas px-2.5 py-2"
                          >
                            <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                              {ri.item.drill.subCategory}
                            </p>
                            <p className="mt-0.5 text-small font-bold text-primary">
                              {ri.actualValue}
                              {ri.unit ? ` ${ri.unit}` : ""}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                              {ri.item.drill.name}
                            </p>
                          </div>
                        ))}
                      </div>

                      {result.notes ? (
                        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-tiny text-ink-soft">
                          {result.notes}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {packs.length === 0 && (
        <div className="rounded-2xl border border-line bg-panel p-8 text-center">
          <p className="text-h4">📋</p>
          <p className="mt-2 text-small font-bold">Belum ada paket asesmen</p>
          <p className="mt-1 text-tiny text-ink-soft">
            Buat paket asesmen untuk mengukur baseline dan progres atlet.
          </p>
        </div>
      )}
    </div>
  );
}