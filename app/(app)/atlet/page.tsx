import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const READINESS_META: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  full: { label: "Siap penuh", variant: "success" },
  limited: { label: "Dibatasi", variant: "warning" },
  rest: { label: "Istirahat", variant: "danger" },
};

export default async function AthleteHome() {
  const user = await requireUser();

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) notFound();

  const now = new Date();

  const memberships = await prisma.teamMember.findMany({
    where: { athleteId: profile.id, status: "active" },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  const [readiness, recentLogs, personalSessions, teamSessions] = await Promise.all([
    prisma.athleteReadiness.findFirst({
      where: { athleteId: profile.id, validUntil: { gte: now } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.sessionLog.findMany({
      where: { athleteId: profile.id },
      orderBy: { loggedAt: "desc" },
      take: 5,
      include: { session: true },
    }),
    prisma.session.findMany({
      where: { athleteId: profile.id, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.session.findMany({
      where: teamIds.length > 0 ? { teamId: { in: teamIds }, scheduledAt: { gte: now } } : { scheduledAt: { gte: now }, teamId: { in: [] } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
  ]);

  const upcoming = [...teamSessions, ...personalSessions]
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 6);

  const recentRpe = recentLogs.filter((log) => log.rpe != null).map((log) => log.rpe);
  const lastLog = recentLogs[0];

  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title={`Halo, ${profile.fullName}`}
        description={
          profile.position
            ? `Posisi ${profile.position} · ${profile.heightCm ?? "-"} cm / ${profile.weightKg ?? "-"} kg`
            : "Lengkapi profil Anda"
        }
      />

      {readiness ? (
        <Badge variant={READINESS_META[readiness.status]?.variant ?? "success"}>
          Kesiapan: {READINESS_META[readiness.status]?.label ?? readiness.status}
        </Badge>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Sesi mendatang" value={upcoming.length} tone="primary" />
        <StatCard
          title="RPE terkini"
          value={recentRpe[0] ?? "—"}
          hint="Dari sesi terakhir yang tercatat"
          tone="default"
        />
        <StatCard
          title="Sesi tercatat"
          value={recentLogs.length}
          hint={lastLog ? `Terakhir ${dateTimeFormat.format(lastLog.loggedAt)}` : "Belum ada"}
          tone="success"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Jadwal latihan</CardTitle>
            <CardDescription>Sesi tim dan program personal</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-small text-ink-soft">Belum ada sesi yang dijadwalkan.</p>
          ) : (
            upcoming.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-small font-semibold">{session.name}</p>
                  <p className="mt-0.5 text-tiny text-ink-soft">
                    {session.location ?? "Lokasi belum diisi"} · {session.durationMinutes} menit
                  </p>
                </div>
                <p className="shrink-0 text-small font-medium">
                  {dateTimeFormat.format(session.scheduledAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}