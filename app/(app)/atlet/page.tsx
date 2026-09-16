import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const DATE_LONG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const READINESS_META: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  full: { label: "Siap latihan", variant: "success" },
  limited: { label: "Dibatasi", variant: "warning" },
  rest: { label: "Istirahat", variant: "danger" },
};

export default async function AthleteHome() {
  const user = await requireUser();
  if (user.role !== "ATHLETE") notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const memberships = await prisma.teamMember.findMany({
    where: { athleteId: user.id, status: "active" },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  const [readiness, nextSession, ftResult, monthLogs, announcement] =
    await Promise.all([
      prisma.athleteReadiness.findFirst({
        where: { athleteId: user.id, validUntil: { gte: now } },
        orderBy: { updatedAt: "desc" },
      }),

      prisma.session.findFirst({
        where: {
          OR: [
            { teamId: { in: teamIds } },
            { athleteId: user.id },
          ],
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: "asc" },
        include: { _count: { select: { sessionDrills: true } } },
      }),

      prisma.drillResult.findFirst({
        where: {
          sessionLog: { athleteId: user.id },
          sessionDrill: {
            drill: { subCategory: "Free Throw" },
          },
        },
        orderBy: { sessionLog: { loggedAt: "desc" } },
        select: {
          actualValue: true,
          successCount: true,
          attemptCount: true,
        },
      }),

      prisma.sessionLog.findMany({
        where: {
          athleteId: user.id,
          loggedAt: { gte: monthStart },
          OR: [
            { attendanceStatus: "present" },
            { attendanceStatus: "late" },
          ],
        },
        select: { id: true },
      }),

      prisma.announcement.findFirst({
        where: {
          OR: [
            { teamId: { in: teamIds }, athleteId: null },
            { athleteId: user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { content: true },
      }),
    ]);

  const ftPct =
    ftResult?.attemptCount && ftResult.attemptCount > 0
      ? Math.round((ftResult.successCount ?? 0) / ftResult.attemptCount * 100)
      : null;

  const rMeta = readiness ? READINESS_META[readiness.status] : null;

  const firstName = user.fullName.split(" ")[0];
  const today = new Date();

  return (
    <div className="mx-auto max-w-lg">
      {/* Greeting */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight">
            Halo, {firstName}
          </h1>
          <p className="mt-0.5 text-small text-ink-soft">
            {DATE_LONG.format(today)}
          </p>
        </div>
        {rMeta ? (
          <Badge variant={rMeta.variant}>● {rMeta.label}</Badge>
        ) : null}
      </div>

      {/* Hero card */}
      {nextSession ? (
        <div className="mb-4 rounded-xl border border-primary-faint bg-primary-faint border-l-[3px] border-l-primary p-4">
          <p className="text-tiny font-bold uppercase tracking-wide text-primary">
            Sesi hari ini
          </p>
          <p className="mt-1 text-base font-bold">{nextSession.name}</p>
          <p className="mt-0.5 text-tiny text-ink-soft">
            {nextSession.athleteId ? "Sesi personal" : "Sesi tim"} ·{" "}
            {nextSession._count.sessionDrills} drill · estimasi{" "}
            {nextSession.durationMinutes} menit
          </p>
          <Link
            href={`/atlet/sesi/${nextSession.id}`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong"
          >
            Mulai latihan
          </Link>
        </div>
      ) : null}

      {/* Stat mini grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="px-3 py-2.5">
          <p className="text-tiny text-ink-soft">Kepatuhan bulan ini</p>
          <p className="mt-1 text-h3 font-bold text-success-strong">
            {monthLogs.length}
            <span className="ml-1 text-tiny text-ink-faint">log</span>
          </p>
        </Card>
        <Card className="px-3 py-2.5">
          <p className="text-tiny text-ink-soft">Free throw</p>
          <p className="mt-1 text-h3 font-bold">
            {ftPct !== null ? (
              <>
                {ftPct}%
                <span className="ml-1 text-tiny text-success-strong">↑</span>
              </>
            ) : (
              "—"
            )}
          </p>
        </Card>
      </div>

      {/* Pesan dari pelatih */}
      <p className="mb-2 text-small font-bold">Pesan dari pelatih</p>
      <Card className="flex gap-3 px-4 py-3">
        <span className="mt-0.5 shrink-0 text-base">💬</span>
        <p className="text-tiny leading-relaxed text-ink-soft">
          {announcement?.content ?? "Belum ada pesan terbaru dari pelatih."}
        </p>
      </Card>
    </div>
  );
}
