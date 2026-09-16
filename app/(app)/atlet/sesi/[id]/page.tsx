import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionPlayer } from "@/components/sesi/session-player";
import { SessionComments } from "@/components/sesi/session-comments";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AthleteSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "ATHLETE") notFound();

  const { id } = await params;

  const memberships = await prisma.teamMember.findMany({
    where: { athleteId: user.id, status: "active" },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  const session = await prisma.session.findFirst({
    where: {
      id,
      OR: [{ teamId: { in: teamIds } }, { athleteId: user.id }],
    },
    include: {
      sessionDrills: {
        orderBy: { orderIndex: "asc" },
        include: { drill: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true, role: true } } },
      },
    },
  });

  if (!session) notFound();

  const commentTime = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <p className="text-h4 font-bold">{session.name}</p>
        <span className="text-tiny text-ink-faint">
          {dateTimeFormat.format(session.scheduledAt)}
        </span>
      </div>

      <SessionPlayer
        sessionId={session.id}
        athleteId={user.id}
        drills={session.sessionDrills.map((sd) => ({
          id: sd.id,
          drillName: sd.drill.name,
          subCategory: sd.drill.subCategory,
          targetType: sd.drill.targetType,
          targetValue: sd.targetValue ?? sd.drill.defaultTargetValue,
          targetUnit: sd.targetUnit,
          durationMinutes: sd.durationMinutes,
        }))}
      />

      <SessionComments
        sessionId={session.id}
        currentUserIsCoach={false}
        comments={session.comments.map((c) => ({
          id: c.id,
          authorName: c.author.fullName,
          role: c.author.role,
          content: c.content,
          createdAt: commentTime.format(c.createdAt),
        }))}
      />
    </div>
  );
}