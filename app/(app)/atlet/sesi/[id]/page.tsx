import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SessionPlayer } from "@/components/sesi/session-player";
import { SessionComments } from "@/components/sesi/session-comments";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const READINESS_MODIFIER: Record<string, { factor: number; label: string }> = {
  limited: { factor: 0.7, label: "Dibatasi (volume dikurangi 30%)" },
  rest: { factor: 0, label: "Istirahat penuh" },
};

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

  // Check athlete readiness for auto-modification
  const now = new Date();
  const readiness = await prisma.athleteReadiness.findFirst({
    where: { athleteId: user.id, validUntil: { gte: now } },
    orderBy: { updatedAt: "desc" },
  });

  const readinessMod = readiness
    ? READINESS_MODIFIER[readiness.status]
    : undefined;
  const isRestDay = readinessMod && readinessMod.factor === 0;

  // Apply volume modification if limited
  const modifiedDrills = session.sessionDrills.map((sd) => {
    const originalDuration = sd.durationMinutes;
    let adjustedDuration = originalDuration;

    if (readinessMod && readinessMod.factor > 0 && originalDuration) {
      adjustedDuration = Math.max(5, Math.round(originalDuration * readinessMod.factor));
    }

    return {
      id: sd.id,
      drillName: sd.drill.name,
      subCategory: sd.drill.subCategory,
      targetType: sd.drill.targetType,
      targetValue: sd.targetValue ?? sd.drill.defaultTargetValue,
      targetUnit: sd.targetUnit,
      durationMinutes: adjustedDuration,
      originalDuration,
    };
  });

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

      {readinessMod ? (
        <div className={`mb-4 rounded-2xl border p-4 ${
          isRestDay
            ? "border-danger/30 bg-danger-faint/20"
            : "border-warning/30 bg-warning-faint/20"
        }`}>
          <div className="flex items-center gap-2">
            <Badge variant={isRestDay ? "danger" : "warning"}>
              {isRestDay ? "Istirahat" : "Dibatasi"}
            </Badge>
            <span className="text-small font-medium">{readinessMod.label}</span>
          </div>
          {!isRestDay && readiness?.reason ? (
            <p className="mt-2 text-tiny text-ink-soft">{readiness.reason}</p>
          ) : null}
          {isRestDay ? (
            <p className="mt-2 text-tiny text-ink-soft">
              Kamu dijadwalkan istirahat hari ini. Sesi ini ditampilkan untuk referensi saja.
            </p>
          ) : null}
        </div>
      ) : null}

      {modifiedDrills.length > 0 ? (
        <SessionPlayer
          sessionId={session.id}
          athleteId={user.id}
          drills={modifiedDrills}
          readOnly={isRestDay}
        />
      ) : (
        <EmptyState
          className="mb-6"
          title="Sesi ini belum punya drill"
          description="Pelatih belum menambahkan materi latihan ke sesi ini. Cek lagi nanti."
        />
      )}

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