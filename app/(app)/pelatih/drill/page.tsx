import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOwnerIds } from "@/lib/program-access";
import { DrillLibrary } from "@/components/drill/drill-library";
import { drillToInput } from "@/lib/drill";

export default async function CoachDrillsPage() {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) notFound();

  const ownerIds = await resolveOwnerIds(user);

  const drills = await prisma.drill.findMany({
    where: { ownerId: { in: ownerIds } },
    orderBy: { createdAt: "desc" },
  });

  return <DrillLibrary drills={drills.map(drillToInput)} />;
}