import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const READINESS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  full: "success",
  limited: "warning",
  rest: "danger",
};

export default async function CoachAthletesPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const now = new Date();

  const teams = await prisma.team.findMany({
    where: { coachId: user.id },
    include: {
      members: {
        where: { status: "active", athlete: { deletedAt: null } },
        orderBy: { joinedAt: "asc" },
        include: {
          athlete: {
            include: {
              readinessRecords: {
                where: { validUntil: { gte: now } },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
              injuriesSuffered: { where: { status: "active" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (teams.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          title="Tim & Atlet"
          description="Kelola roster dan status kesiapan atlet."
        />
        <EmptyState
          title="Belum ada tim"
          description="Buat tim terlebih dahulu untuk mulai menyusun roster atlet."
          action={
            <Link
              href="/pelatih/tim"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-medium text-white shadow-sm transition-colors hover:bg-primary-strong"
            >
              Buat tim
            </Link>
          }
        />
      </div>
    );
  }

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title="Tim & Atlet"
        description={`${teams.length} tim, ${teams.reduce((sum, t) => sum + t.members.length, 0)} atlet aktif`}
      />

      {teams.map((team) => (
        <div key={team.id} className="mb-8">
          <p className="mb-3 text-h4 font-bold tracking-tight">{team.name}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.members.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong bg-panel px-5 py-8 text-center text-small text-ink-soft">
                Belum ada atlet aktif di tim ini.
              </p>
            ) : null}
            {team.members.map((member) => {
              const readiness = member.athlete.readinessRecords[0];
              const hasInjury = member.athlete.injuriesSuffered.length > 0;
              const tone = readiness
                ? READINESS_VARIANT[readiness.status] ?? "success"
                : "success";
              const label = readiness
                ? readiness.status === "full"
                  ? "Siap"
                  : readiness.status === "limited"
                    ? "Dibatasi"
                    : "Istirahat"
                : "Siap";
              return (
                <Link
                  key={member.id}
                  href={`/pelatih/atlet/${member.athlete.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm transition-colors hover:bg-neutral-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary">
                      {initials(member.athlete.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-small font-semibold">
                        {member.athlete.fullName}
                      </p>
                      <p className="mt-0.5 text-tiny text-ink-soft">
                        {member.athlete.position ?? "Posisi belum diisi"} · No{" "}
                        {member.jerseyNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={hasInjury ? "warning" : tone}
                      className={cn(hasInjury && "bg-warning-soft text-warning")}
                    >
                      {hasInjury ? "Cedera" : label}
                    </Badge>
                    {hasInjury ? (
                      <span className="text-tiny text-warning">
                        {member.athlete.injuriesSuffered[0]?.bodyPart}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}