import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const dateShort = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const READINESS_META: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  full: { label: "Siap penuh", variant: "success" },
  limited: { label: "Dibatasi", variant: "warning" },
  rest: { label: "Istirahat", variant: "danger" },
};

export default async function CoachDashboard() {
  const user = await requireUser();

  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    include: {
      sessions: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 4,
        include: { _count: { select: { sessionDrills: true } } },
      },
      members: {
        where: { status: "active", athlete: { deletedAt: null } },
        include: {
          athlete: {
            include: {
              readinessRecords: {
                where: { validUntil: { gte: new Date() } },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const drillCount = await prisma.drill.count({ where: { ownerId: user.id } });

  if (!team) {
    notFound();
  }

  const athleteCount = team.members.length;
  const needsAttention = team.members.filter(
    (member) =>
      member.athlete.readinessRecords[0] &&
      member.athlete.readinessRecords[0].status !== "full",
  );

  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title={`Halo, ${user.fullName}`}
        description={`Ringkasan tim ${team.name}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Atlet aktif"
          value={athleteCount}
          hint={`Tim ${team.name}`}
          tone="primary"
        />
        <StatCard
          title="Sesi mendatang"
          value={team.sessions.length}
          hint={team.sessions[0] ? dateTimeFormat.format(team.sessions[0].scheduledAt) : "Belum ada"}
          tone="success"
        />
        <StatCard title="Drill tersedia" value={drillCount} tone="default" />
        <StatCard
          title="Butuh perhatian"
          value={needsAttention.length}
          hint={needsAttention.length > 0 ? "Atlet dengan kesiapan terbatas" : "Semua siap"}
          tone="warning"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Sesi mendatang</CardTitle>
              <CardDescription>{team.sessions.length} sesi berikutnya</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.sessions.length === 0 ? (
              <EmptyState title="Belum ada sesi" description="Buat sesi latihan baru dari modul Program." />
            ) : (
              team.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-small font-semibold">{session.name}</p>
                    <p className="mt-0.5 text-tiny text-ink-soft">
                      {session.location ?? "Lokasi belum diisi"}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-small font-medium">{dateTimeFormat.format(session.scheduledAt)}</p>
                    <p className="text-tiny text-ink-faint">
                      {session.durationMinutes} menit · {session._count.sessionDrills} drill
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Kesiapan atlet</CardTitle>
              <CardDescription>Status terbaru berdasarkan pembaruan</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members.length === 0 ? (
              <EmptyState title="Belum ada atlet" description="Tambahkan atlet ke tim Anda." />
            ) : (
              team.members.map((member) => {
                const readiness = member.athlete.readinessRecords[0];
                const meta = readiness ? READINESS_META[readiness.status] : undefined;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-neutral-soft text-small font-semibold">
                        {member.athlete.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <div>
                        <p className="text-small font-semibold">{member.athlete.fullName}</p>
                        <p className="text-tiny text-ink-faint">
                          {member.athlete.position ?? "Posisi belum diisi"} · No {member.jerseyNumber}
                        </p>
                      </div>
                    </div>
                    {meta ? (
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    ) : (
                      <Badge variant="success">Siap</Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {team.sessions[0] ? (
        <p className="mt-6 text-tiny text-ink-faint">
          Sesi berikutnya: {dateTimeFormat.format(team.sessions[0].scheduledAt)} ({dateShort.format(team.sessions[0].scheduledAt)})
        </p>
      ) : null}
    </div>
  );
}