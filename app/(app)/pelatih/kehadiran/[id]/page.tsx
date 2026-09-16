import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceSheet } from "@/components/kehadiran/attendance-sheet";

export default async function CoachAttendanceSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const { id } = await params;

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: { id: true },
  });
  if (!team) notFound();

  const session = await prisma.session.findFirst({
    where: { id, teamId: team.id },
    select: { id: true, name: true, scheduledAt: true },
  });
  if (!session) notFound();

  const [members, existingLogs] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: team.id, status: "active", roleInTeam: "player" },
      orderBy: { jerseyNumber: "asc" },
      include: {
        athlete: {
          select: {
            fullName: true,
            position: true,
            readinessRecords: {
              where: { validUntil: { gte: new Date() } },
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: { status: true },
            },
            injuriesSuffered: {
              where: { status: "active" },
              orderBy: { startDate: "desc" },
              take: 1,
              select: { bodyPart: true },
            },
          },
        },
      },
    }),
    prisma.sessionLog.findMany({
      where: { sessionId: id },
      select: { athleteId: true, attendanceStatus: true },
    }),
  ]);

  const logMap = new Map(existingLogs.map((l) => [l.athleteId, l.attendanceStatus]));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href="/pelatih/kehadiran"
          className="mb-2 inline-flex items-center text-tiny text-ink-soft hover:text-primary"
        >
          ← Kembali
        </Link>
        <h1 className="text-h2 font-bold tracking-tight">{session.name}</h1>
        <p className="mt-1 text-small text-ink-soft">
          {new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(session.scheduledAt)}
        </p>
      </div>

      <AttendanceSheet
        session={{ id: session.id, name: session.name }}
        athletes={members.map((m) => ({
          athleteId: m.athleteId,
          fullName: m.athlete.fullName,
          jerseyNumber: m.jerseyNumber,
          position: m.athlete.position,
          readiness: (m.athlete.readinessRecords[0]?.status as
            | "full"
            | "limited"
            | "rest"
            | null) ?? null,
          activeInjury: m.athlete.injuriesSuffered[0]?.bodyPart ?? null,
          savedStatus: (logMap.get(m.athleteId) as "present" | "late" | "absent" | null) ?? null,
        }))}
      />
    </div>
  );
}
