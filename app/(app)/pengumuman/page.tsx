import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AnnouncementsPanel,
  type AnnouncementItem,
} from "@/components/pengumuman/announcements-panel";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PengumumanPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const [rows, teams] = await Promise.all([
    prisma.announcement.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.team.findMany({
      where: { coachId: user.id },
      select: { id: true, name: true },
    }),
  ]);

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  const items: AnnouncementItem[] = rows.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    teamName: a.teamId ? teamNameById.get(a.teamId) ?? null : null,
    athleteName: null,
    createdAt: dateFormat.format(a.createdAt),
  }));

  return (
    <div>
      <AnnouncementsPanel items={items} isCoach={user.role === "COACH"} />
    </div>
  );
}