import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DrillLibrary } from "@/components/drill/drill-library";
import { drillToInput } from "@/lib/drill";

export default async function CoachDrillsPage() {
  const user = await requireUser();
  if (user.role !== "COACH") notFound();

  const drills = await prisma.drill.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return <DrillLibrary drills={drills.map(drillToInput)} />;
}