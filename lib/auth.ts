import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "session_token";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const ROLE_HOME: Record<string, string> = {
  COACH: "/pelatih",
  ASSISTANT: "/pelatih",
  ATHLETE: "/atlet",
  PARENT: "/orangtua",
};

export async function createSession(profileId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.profileSession.create({ data: { token, profileId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.profileSession.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.profileSession.findUnique({
    where: { token },
    include: { profile: true },
  });
  if (!session || session.expiresAt < new Date() || session.profile.deletedAt) {
    if (session) await prisma.profileSession.delete({ where: { id: session.id } });
    return null;
  }
  return session.profile;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.passwordHash || user.deletedAt) return null;
  const matches = await compare(password, user.passwordHash);
  return matches ? user : null;
}