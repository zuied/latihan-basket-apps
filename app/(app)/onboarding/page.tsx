import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireUser();

  // Check if onboarding is already complete
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      position: true,
      heightCm: true,
      weightKg: true,
      dateOfBirth: true,
    },
  });
  if (!profile) redirect("/login");

  // If profile already has position + height + weight, skip onboarding
  if (profile.position && profile.heightCm && profile.weightKg) {
    redirect("/atlet");
  }

  return (
    <OnboardingWizard
      defaultValues={{
        fullName: profile.fullName,
        position: profile.position ?? "",
        heightCm: profile.heightCm?.toString() ?? "",
        weightKg: profile.weightKg?.toString() ?? "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
      }}
    />
  );
}
