"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

export type ActionState = { error?: string };

export async function createClientRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();

  if (!name) {
    return { error: "Client name is required" };
  }

  await db.insert(clients).values({
    organizationId: profile.organizationId,
    name,
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
  });

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  return {};
}

export async function updateClientRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();

  if (!id) {
    return { error: "Missing client id" };
  }
  if (!name) {
    return { error: "Client name is required" };
  }

  await db
    .update(clients)
    .set({
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, profile.organizationId)));

  revalidatePath("/dashboard/clients");
  return {};
}

export async function deleteClientRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Missing client id" };
  }

  try {
    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, profile.organizationId)));
  } catch {
    return { error: "Cannot delete a client with existing shipments" };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  return {};
}
