import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RaporPanel, type SharedReportItem } from "@/components/rapor/rapor-panel";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CoachRaporPage() {
  const user = await requireUser();
  if (user.role !== "COACH") notFound();

  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    select: { id: true },
  });
  if (!team) notFound();

  const [members, reports] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: team.id, status: "active" },
      orderBy: { joinedAt: "asc" },
      include: { athlete: { select: { id: true, fullName: true } } },
    }),
    prisma.sharedReport.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // hilangkan tautan kedaluwarsa
  const now = new Date();
  const activeReports = reports.filter((r) => r.expiresAt > now);

  const baseUrl =
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  const items: SharedReportItem[] = activeReports.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    createdAt: dateFormat.format(r.createdAt),
    expiresAt: dateFormat.format(r.expiresAt),
  }));

  return (
    <RaporPanel
      athletes={members.map((m) => ({
        id: m.athlete.id,
        name: m.athlete.fullName,
      }))}
      reports={items}
      baseUrl={baseUrl}
    />
  );
}