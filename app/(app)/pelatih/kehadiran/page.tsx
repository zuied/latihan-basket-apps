import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CoachAttendancePage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const team = await prisma.team.findFirst({
    where:
      user.role === "ASSISTANT"
        ? { members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } } }
        : { coachId: user.id },
    select: { id: true },
  });
  if (!team) notFound();

  const now = new Date();
  // Sesi yang relevan: 4 sesi terakhir yang sudah lewat (dari hari ini) + 2 berikutnya.
  const sessions = await prisma.session.findMany({
    where: { teamId: team.id },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      name: true,
      scheduledAt: true,
      _count: { select: { sessionDrills: true } },
    },
  });

  const past = sessions.filter((s) => s.scheduledAt <= now).slice(-4);
  const upcoming = sessions.filter((s) => s.scheduledAt > now).slice(0, 2);
  const pick: typeof past = [...upcoming, ...past];

  const statusBadge = (s: (typeof pick)[number]) => {
    if (s.scheduledAt > now) {
      return (
        <Badge variant="neutral">Akan datang</Badge>
      );
    }
    return (
      <Badge variant="neutral">Selesai</Badge>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <SectionTitle
          title="Kehadiran Sesi"
          description="Tandai kehadiran seluruh pemain saat sesi berlangsung."
        />
      </div>

      {pick.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-8 text-center">
          <p className="text-h4">🏀</p>
          <p className="mt-2 text-small font-bold">Belum ada sesi terjadwal</p>
          <p className="mt-1 text-tiny text-ink-soft">
            Buat sesi latihan melalui Kalender Jadwal dulu, lalu isi kehadirannya di sini.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pick.map((s) => (
            <li key={s.id}>
              <Link
                href={`/pelatih/kehadiran/${s.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-panel p-4 shadow-sm transition-colors hover:border-primary hover:bg-neutral-soft"
              >
                <div>
                  <p className="text-small font-bold">{s.name}</p>
                  <p className="mt-0.5 text-tiny text-ink-soft">
                    {new Intl.DateTimeFormat("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(s.scheduledAt)}
                    {" · "}
                    {s._count.sessionDrills} drill
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {statusBadge(s)}
                  <span className="text-large text-ink-faint">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
