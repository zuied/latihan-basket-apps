import { redirect } from "next/navigation";
import { getCurrentUser, ROLE_HOME } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Athletes with incomplete profile → redirect to onboarding
  if (user.role === "ATHLETE" && (!user.position || !user.heightCm || !user.weightKg)) {
    redirect("/onboarding");
  }

  redirect(ROLE_HOME[user.role] ?? "/login");
}