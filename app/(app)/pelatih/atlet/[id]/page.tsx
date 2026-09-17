import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AthleteProfile, type AthleteProfileData } from "@/components/atlet/athlete-profile";

export default async function CoachAthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const { id } = await params;

  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    select: { id: true, name: true },
  });
  if (!team) notFound();

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: team.id, athleteId: id, status: "active" },
    select: { jerseyNumber: true },
  });
  if (!membership) notFound();

  const now = new Date();

  const athlete = await prisma.profile.findUnique({
    where: { id },
    include: {
      readinessRecords: {
        where: { validUntil: { gte: now } },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      injuriesSuffered: {
        orderBy: { startDate: "desc" },
      },
      assessmentResults: {
        where: { isBaseline: true },
        orderBy: { conductedAt: "desc" },
        take: 1,
        include: {
          resultItems: {
            include: {
              item: { include: { drill: { select: { name: true, subCategory: true } } } },
            },
          },
        },
      },
      sessionLogs: {
        where: { loggedAt: { gte: new Date(now.getTime() - 28 * 86400000) } },
        include: {
          session: { select: { name: true, durationMinutes: true } },
          drillResults: {
            include: {
              sessionDrill: {
                include: { drill: { select: { name: true, subCategory: true } } },
              },
            },
          },
        },
        orderBy: { loggedAt: "asc" },
      },
    },
  });
  if (!athlete) notFound();

  const assignments = await prisma.programAssignment.findMany({
    where: {
      OR: [
        { athleteId: athlete.id },
        { teamId: team.id },
      ],
    },
    include: {
      program: {
        select: { id: true, name: true, type: true, status: true },
      },
    },
  });

  // Beban latihan per minggu (4 minggu terakhir, Sen–Minggu)
  const weeks: AthleteProfileData["loadByWeek"] = [];
  const monday = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return x;
  };
  const m0 = monday(now);
  for (let w = 3; w >= 0; w--) {
    const start = new Date(m0);
    start.setDate(m0.getDate() - 7 * w);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const minutes = athlete.sessionLogs
      .filter((l) => l.loggedAt >= start && l.loggedAt < end)
      .reduce(
        (sum, l) => sum + (l.durationActualMinutes ?? l.session.durationMinutes),
        0,
      );
    weeks.push({
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      minutes,
    });
  }

  const baselineOverview: AthleteProfileData["baseline"] | null =
    athlete.assessmentResults[0]
      ? {
          conductedAt: athlete.assessmentResults[0].conductedAt.toISOString(),
          list: athlete.assessmentResults[0].resultItems.map((ri) => ({
            id: ri.id,
            drillName: ri.item.drill.name,
            subCategory: ri.item.drill.subCategory,
            actualValue: ri.actualValue,
            unit: ri.unit,
          })),
        }
      : null;

  const data: AthleteProfileData = {
    athleteId: athlete.id,
    fullName: athlete.fullName,
    position: athlete.position,
    heightCm: athlete.heightCm,
    weightKg: athlete.weightKg,
    dateOfBirth: athlete.dateOfBirth?.toISOString() ?? null,
    teamName: team.name,
    jerseyNumber: membership.jerseyNumber,
    readiness: (athlete.readinessRecords[0]?.status as AthleteProfileData["readiness"]) ?? null,
    activeInjuries: athlete.injuriesSuffered.map((i) => ({
      id: i.id,
      bodyPart: i.bodyPart,
      injuryType: i.injuryType,
      severity: i.severity,
      startDate: i.startDate.toISOString(),
      resolvedDate: i.resolvedDate?.toISOString() ?? null,
      notes: i.notes,
      status: i.status,
    })),
    programs: assignments
      .map((a) => ({
        id: a.program.id,
        name: a.program.name,
        type: a.program.type,
        status: a.program.status,
      }))
      .filter((p) => p.status === "active"),
    baseline: baselineOverview,
    loadByWeek: weeks,
    sessionHistory: athlete.sessionLogs.map((l) => ({
      id: l.id,
      sessionName: l.session.name,
      date: l.loggedAt.toISOString(),
      attendanceStatus: l.attendanceStatus,
      rpe: l.rpe,
      durationMinutes: l.durationActualMinutes ?? l.session.durationMinutes,
      drillCount: l.drillResults.length,
    })).reverse(),
    performanceTrend: {
      rpeByWeek: weeks.map((w, idx) => {
        const weekStart = new Date(m0);
        weekStart.setDate(m0.getDate() - 7 * (3 - idx));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const weekLogs = athlete.sessionLogs.filter(
          (l) => l.loggedAt >= weekStart && l.loggedAt < weekEnd && l.rpe,
        );
        const avgRpe =
          weekLogs.length > 0
            ? weekLogs.reduce((s, l) => s + (l.rpe ?? 0), 0) / weekLogs.length
            : 0;
        return { label: w.label, avgRpe: Math.round(avgRpe * 10) / 10 };
      }),
      attendanceByWeek: weeks.map((w, idx) => {
        const weekStart = new Date(m0);
        weekStart.setDate(m0.getDate() - 7 * (3 - idx));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const weekLogs = athlete.sessionLogs.filter(
          (l) => l.loggedAt >= weekStart && l.loggedAt < weekEnd,
        );
        const attended = weekLogs.filter(
          (l) => l.attendanceStatus === "present" || l.attendanceStatus === "late",
        ).length;
        return { label: w.label, total: weekLogs.length, attended };
      }),
      completionRate: (() => {
        const totalDrills = athlete.sessionLogs.reduce(
          (s, l) => s + l.drillResults.length,
          0,
        );
        const withResults = athlete.sessionLogs.reduce(
          (s, l) => s + l.drillResults.filter((r) => r.actualValue > 0).length,
          0,
        );
        return totalDrills > 0 ? Math.round((withResults / totalDrills) * 100) : null;
      })(),
    },
  };

  return <AthleteProfile data={data} />;
}