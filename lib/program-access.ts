import { prisma } from "@/lib/prisma";

/**
 * Resolve owner IDs that a user can access.
 * - COACH: only their own programs.
 * - ASSISTANT: their own + all coaches of teams they assist.
 */
export async function resolveOwnerIds(user: {
  id: string;
  role: string;
}): Promise<string[]> {
  if (user.role === "COACH") return [user.id];

  const teams = await prisma.team.findMany({
    where: {
      members: { some: { athleteId: user.id, roleInTeam: "assistant_coach" } },
    },
    select: { coachId: true },
  });

  const coachIds = [...new Set(teams.map((t) => t.coachId))];
  return [...new Set([user.id, ...coachIds])];
}
