"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function recoverInjury(injuryId: string) {
  const user = await requireUser();
  if (!["COACH", "ASSISTANT"].includes(user.role)) return { ok: false };

  const injury = await prisma.injury.findUnique({ where: { id: injuryId } });
  if (!injury) return { ok: false };

  await prisma.injury.update({
    where: { id: injuryId },
    data: {
      status: "resolved",
      resolvedDate: new Date(),
    },
  });

  revalidatePath("/pelatih/atlet");
  return { ok: true };
}
