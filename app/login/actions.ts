"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, ROLE_HOME, verifyCredentials } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").trim().toLowerCase(),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Email atau kata sandi salah." };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(ROLE_HOME[user.role] ?? "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}