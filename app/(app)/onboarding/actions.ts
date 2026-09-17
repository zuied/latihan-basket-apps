"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OnboardingState = { ok?: boolean; error?: string } | undefined;

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  position: z.string().trim().optional(),
  heightCm: z.string().trim().optional(),
  weightKg: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
});

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    position: formData.get("position"),
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
    dateOfBirth: formData.get("dateOfBirth"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const heightCm = parsed.data.heightCm ? parseFloat(parsed.data.heightCm) : null;
  const weightKg = parsed.data.weightKg ? parseFloat(parsed.data.weightKg) : null;
  const dob = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null;

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      fullName: parsed.data.fullName,
      position: parsed.data.position || null,
      heightCm,
      weightKg,
      dateOfBirth: dob,
    },
  });

  revalidatePath("/atlet");
  redirect("/atlet");
}
