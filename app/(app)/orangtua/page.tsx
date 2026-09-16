import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const READINESS_META: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  full: { label: "Siap penuh", variant: "success" },
  limited: { label: "Dibatasi", variant: "warning" },
  rest: { label: "Istirahat", variant: "danger" },
};

export default async function ParentHome() {
  const user = await requireUser();

  const links = await prisma.parentAthleteLink.findMany({
    where: { parentId: user.id, status: "active" },
    include: {
      athlete: {
        include: {
          teamMemberships: { include: { team: true } },
          readinessRecords: {
            where: { validUntil: { gte: new Date() } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
          sessionLogs: { orderBy: { loggedAt: "desc" }, take: 3, include: { session: true } },
        },
      },
    },
  });

  if (links.length === 0) notFound();

  const childIds = links.map((link) => link.athleteId);
  const announcements = await prisma.announcement.findMany({
    where: { athleteId: { in: childIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title={`Halo, ${user.fullName}`}
        description="Pantau perkembangan putra/putri Anda."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {links.map((link) => {
            const athlete = link.athlete;
            const readiness = athlete.readinessRecords[0];
            const meta = readiness ? READINESS_META[readiness.status] : undefined;
            const team = athlete.teamMemberships[0]?.team;
            return (
              <Card key={link.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
                      {athlete.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div>
                      <CardTitle>{athlete.fullName}</CardTitle>
                      <CardDescription>
                        {athlete.position ?? "Posisi belum diisi"} · {team?.name ?? "Belum bergabung dengan tim"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {meta ? (
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  ) : (
                    <Badge variant="success">Siap</Badge>
                  )}
                  <div className="mt-4 space-y-2">
                    <p className="text-small font-semibold">Sesi terakhir tercatat:</p>
                    {athlete.sessionLogs.length === 0 ? (
                      <p className="text-small text-ink-soft">Belum ada catatan sesi.</p>
                    ) : (
                      athlete.sessionLogs.map((log) => (
                        <div key={log.id} className="rounded-lg bg-neutral-soft px-3 py-2 text-small">
                          <span className="font-medium">{dateFormat.format(log.loggedAt)}</span>
                          <span className="text-ink-soft">
                            {" "}
                            · {log.attendanceStatus === "present" ? "Hadir" : log.attendanceStatus} · {log.session.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Pesan dari pelatih</CardTitle>
              <CardDescription>Pengumuman untuk putra/putri Anda</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <EmptyState title="Belum ada pesan" description="Pengumuman akan tampil di sini." />
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="rounded-xl border border-line px-4 py-3">
                  <p className="text-small font-semibold">{ann.title}</p>
                  {ann.content ? (
                    <p className="mt-1 text-tiny text-ink-soft">{ann.content}</p>
                  ) : null}
                  <p className="mt-1.5 text-tiny text-ink-faint">
                    {dateFormat.format(ann.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}