"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function getNotifications() {
  const user = await requireUser();

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUnreadCount() {
  const user = await requireUser();

  return prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
}

export async function markAsRead(notificationId: string) {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return { ok: true };
}

export async function markAllAsRead() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return { ok: true };
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, body: body ?? null, link: link ?? null },
  });
}
