import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramBuilder, type BuilderProgram, type BankDrill, type BuilderPlay } from "@/components/program/program-builder";
import type { TemplatePlay } from "@/components/playbook/play-template-library";

const targetText = (targetValue: number | null, targetUnit: string | null) => {
  if (targetValue === null) return "";
  const unit = targetUnit ?? "reps";
  if (unit === "%") return `${targetValue}%`;
  if (unit === "detik" || unit === "time_sec") return `${targetValue} detik`;
  if (unit === "m" || unit === "distance_m") return `${targetValue} m`;
  return `${targetValue} ${unit}`;
};

const dateLabel = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);

function mapProgram(raw: NonNullable<Awaited<ReturnType<typeof findPrograms>>[number]>): BuilderProgram {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    description: raw.description,
    phaseName: raw.phases[0]?.name ?? null,
    phases: raw.phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      orderIndex: phase.orderIndex,
      startDate: phase.startDate?.toISOString() ?? null,
      endDate: phase.endDate?.toISOString() ?? null,
      focusNotes: phase.focusNotes,
    })),
    cycles:
      raw.phases.flatMap((phase) =>
        phase.cycles.map((cycle) => ({
          id: cycle.id,
          name: cycle.name,
          weekNumber: cycle.weekNumber,
          sessions: cycle.sessions.map((session) => ({
            id: session.id,
            name: session.name,
            durationMinutes: session.durationMinutes,
            dateLabel: dateLabel(session.scheduledAt),
            drills: session.sessionDrills.map((sd) => ({
              id: sd.id,
              drillId: sd.drillId,
              drillName: sd.drill.name,
              subCategory: sd.drill.subCategory,
              targetText: targetText(sd.targetValue, sd.targetUnit),
            })),
          })),
        })),
      ) ?? [],
    plays: raw.plays.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      elements: Array.isArray(p.elements) ? p.elements.map((e) => e as BuilderPlay["elements"][number]) : [],
    })),
  };
}

const programQueryArgs = {
  include: {
    _count: { select: { phases: true } },
    phases: {
      orderBy: { orderIndex: "asc" as const },
      include: {
        cycles: {
          orderBy: { weekNumber: "asc" as const },
          include: {
            sessions: {
              include: {
                sessionDrills: {
                  orderBy: { orderIndex: "asc" as const },
                  include: { drill: true },
                },
              },
            },
          },
        },
      },
    },
    plays: {
      orderBy: { createdAt: "desc" as const },
    },
  },
} as const;

async function findPrograms(ownerId: string) {
  return prisma.program.findMany({
    where: { ownerId },
    ...programQueryArgs,
    orderBy: [{ phases: { _count: "desc" } }, { createdAt: "desc" }],
  });
}

export default async function CoachProgramsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const [rawPrograms, bank, templates] = await Promise.all([
    findPrograms(user.id),
    prisma.drill.findMany({
      where: { ownerId: user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subCategory: true,
        difficulty: true,
      },
    }),
    prisma.play.findMany({
      where: { isTemplate: true, programId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, elements: true },
    }),
  ]);

  const templatePlays: TemplatePlay[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    elements: Array.isArray(t.elements) ? (t.elements as Record<string, unknown>[]) : [],
  }));

  if (rawPrograms.length === 0) notFound();

  const programs = rawPrograms.map(mapProgram);
  const teamPrograms = programs.filter((p) => p.type === "team");
  const personalPrograms = programs.filter((p) => p.type === "personal");
  const bankDrills: BankDrill[] = bank;

  return (
    <ProgramBuilder
      teamPrograms={teamPrograms}
      personalPrograms={personalPrograms}
      bank={bankDrills}
      templates={templatePlays}
    />
  );
}