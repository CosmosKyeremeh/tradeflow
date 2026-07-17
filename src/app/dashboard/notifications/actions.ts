"use server";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

export type Notification = typeof notifications.$inferSelect;

export async function listNotifications(): Promise<Notification[]> {
  const profile = await requireProfile();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, profile.id))
    .orderBy(desc(notifications.createdAt))
    .limit(15);
}

export async function unreadNotificationCount(): Promise<number> {
  const profile = await requireProfile();
  const [{ value }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.recipientId, profile.id), isNull(notifications.readAt)));
  return value;
}

export async function markNotificationRead(id: string) {
  const profile = await requireProfile();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.recipientId, profile.id)));
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, profile.id), isNull(notifications.readAt)));
  revalidatePath("/dashboard");
}
