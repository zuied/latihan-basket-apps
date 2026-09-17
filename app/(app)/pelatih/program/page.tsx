import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOwnerIds } from "@/lib/program-access";
import { ProgramBuilder, type BuilderProgram, type BankDrill, type BuilderPlay } from "@/components/program/program-builder";
import type { TemplatePlay } from "@/components/playbook/play-template-library";
import type { ProgramTemplate } from "@/components/program/program-builder";

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

function mapSessionDrill(sd: {
  id: string;
  drillId: string;
  targetValue: number | null;
  targetUnit: string | null;
  isMandatory: boolean;
  assignedPositions: unknown;
  drill: { name: string; subCategory: string; relevantPositions: unknown };
}) {
  const explicit = Array.isArray(sd.assignedPositions)
    ? sd.assignedPositions.map(String)
    : [];
  const drillPositions = Array.isArray(sd.drill.relevantPositions)
    ? sd.drill.relevantPositions.map(String)
    : [];
  const drillIsBroad =
    drillPositions.length === 0 || drillPositions.includes("Semua");

  // Cakupan eksplisit menang; jika kosong (data lama), warisi posisi drill
  // agar drill khusus posisi tidak salah tampil sebagai "wajib semua".
  const positions =
    explicit.length > 0
      ? explicit
      : drillIsBroad
        ? ["Semua"]
        : drillPositions;

  return {
    id: sd.id,
    drillId: sd.drillId,
    drillName: sd.drill.name,
    subCategory: sd.drill.subCategory,
    targetText: targetText(sd.targetValue, sd.targetUnit),
    targetValue: sd.targetValue,
    targetUnit: sd.targetUnit,
    isMandatory: positions.includes("Semua"),
    assignedPositions: positions,
  };
}

function mapSession(session: {
  id: string;
  name: string;
  durationMinutes: number;
  scheduledAt: Date;
  sessionDrills: Parameters<typeof mapSessionDrill>[0][];
}) {
  return {
    id: session.id,
    name: session.name,
    durationMinutes: session.durationMinutes,
    dateLabel: dateLabel(session.scheduledAt),
    drills: session.sessionDrills.map(mapSessionDrill),
  };
}

function mapProgram(raw: NonNullable<Awaited<ReturnType<typeof findPrograms>>[number]>): BuilderProgram {
  const cycleGroups = raw.phases.flatMap((phase) =>
    phase.cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      weekNumber: cycle.weekNumber,
      sessions: cycle.sessions.map(mapSession),
    })),
  );

  const looseGroup =
    raw.sessions.length > 0
      ? [
          {
            id: `${raw.id}__tanpa-minggu`,
            name: "Tanpa minggu",
            weekNumber: 0,
            sessions: raw.sessions.map(mapSession),
          },
        ]
      : [];

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    description: raw.description,
    isTemplate: raw.isTemplate,
    phaseName: raw.phases[0]?.name ?? null,
    phases: raw.phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      orderIndex: phase.orderIndex,
      startDate: phase.startDate?.toISOString() ?? null,
      endDate: phase.endDate?.toISOString() ?? null,
      focusNotes: phase.focusNotes,
    })),
    cycles: [...cycleGroups, ...looseGroup],
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
    sessions: {
      where: { cycleId: null },
      orderBy: { scheduledAt: "asc" as const },
      include: {
        sessionDrills: {
          orderBy: { orderIndex: "asc" as const },
          include: { drill: true },
        },
      },
    },
    plays: {
      orderBy: { createdAt: "desc" as const },
    },
  },
} as const;

async function findPrograms(ownerIds: string[]) {
  return prisma.program.findMany({
    where: { ownerId: { in: ownerIds } },
    ...programQueryArgs,
    orderBy: [{ phases: { _count: "desc" } }, { createdAt: "desc" }],
  });
}

export default async function CoachProgramsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const ownerIds = await resolveOwnerIds(user);

  const [rawPrograms, bank, templates, programTemplates] = await Promise.all([
    findPrograms(ownerIds),
    prisma.drill.findMany({
      where: { ownerId: { in: ownerIds } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subCategory: true,
        difficulty: true,
        relevantPositions: true,
      },
    }),
    prisma.play.findMany({
      where: { isTemplate: true, programId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, elements: true },
    }),
    prisma.program.findMany({
      where: { ownerId: { in: ownerIds }, isTemplate: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, type: true },
    }),
  ]);

  const templatePlays: TemplatePlay[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    elements: Array.isArray(t.elements) ? (t.elements as Record<string, unknown>[]) : [],
  }));

  const programs = rawPrograms.map(mapProgram);
  const teamPrograms = programs.filter((p) => p.type === "team");
  const personalPrograms = programs.filter((p) => p.type === "personal");
  const bankDrills: BankDrill[] = bank.map((b) => ({
    id: b.id,
    name: b.name,
    subCategory: b.subCategory,
    difficulty: b.difficulty,
    positions: Array.isArray(b.relevantPositions)
      ? b.relevantPositions.map(String)
      : [],
  }));

  const progTemplates: ProgramTemplate[] = programTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    type: t.type,
  }));

  return (
    <ProgramBuilder
      teamPrograms={teamPrograms}
      personalPrograms={personalPrograms}
      bank={bankDrills}
      templates={templatePlays}
      programTemplates={progTemplates}
    />
  );
}