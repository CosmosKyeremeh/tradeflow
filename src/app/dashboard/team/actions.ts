"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invites, profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { PendingInvite, TeamMember } from "./types";

export type ActionState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listTeamMembers(): Promise<TeamMember[]> {
  const profile = await requireProfile();
  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      role: profiles.role,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.organizationId, profile.organizationId))
    .orderBy(asc(profiles.createdAt));
}

export async function listPendingInvites(): Promise<PendingInvite[]> {
  const profile = await requireProfile();
  const rows = await db
    .select({
      id: invites.id,
      email: invites.email,
      createdAt: invites.createdAt,
      invitedByName: profiles.fullName,
    })
    .from(invites)
    .leftJoin(profiles, eq(invites.invitedBy, profiles.id))
    .where(and(eq(invites.organizationId, profile.organizationId), isNull(invites.acceptedAt)))
    .orderBy(desc(invites.createdAt));
  return rows;
}

export async function createInvite(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address" };
  }

  const [existingMember] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (existingMember) {
    return { error: "That email already has a TradeFlow account -- they can't join via invite yet" };
  }

  const [existingInvite] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.organizationId, profile.organizationId),
        eq(invites.email, email),
        isNull(invites.acceptedAt),
      ),
    )
    .limit(1);
  if (existingInvite) {
    return { error: "There's already a pending invite for that email" };
  }

  const [created] = await db
    .insert(invites)
    .values({ organizationId: profile.organizationId, email, invitedBy: profile.id })
    .returning({ id: invites.id });

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "invite.create",
    entityType: "invite",
    entityId: created.id,
    metadata: { email },
  });

  revalidatePath("/dashboard/team");
  return {};
}

export async function revokeInvite(id: string): Promise<ActionState> {
  const profile = await requireProfile();

  const [invite] = await db
    .select({ id: invites.id, email: invites.email })
    .from(invites)
    .where(and(eq(invites.id, id), eq(invites.organizationId, profile.organizationId)))
    .limit(1);
  if (!invite) return { error: "Invite not found" };

  await db
    .delete(invites)
    .where(and(eq(invites.id, id), eq(invites.organizationId, profile.organizationId)));

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "invite.revoke",
    entityType: "invite",
    entityId: id,
    metadata: { email: invite.email },
  });

  revalidatePath("/dashboard/team");
  return {};
}
