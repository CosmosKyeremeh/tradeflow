"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { STATUS_ORDER, type ShipmentStatus } from "./types";

export type ActionState = { error?: string };

function parseCustomsValue(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

async function assertOwnedClient(clientId: string, organizationId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1);
  return Boolean(client);
}

function readShipmentFields(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const hsCode = String(formData.get("hsCode") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const customsValueGhs = String(formData.get("customsValueGhs") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "1").trim();
  const status = String(formData.get("status") ?? "booked") as ShipmentStatus;

  return { clientId, hsCode, description, customsValueGhs, quantityRaw, status };
}

export async function createShipmentRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const { clientId, hsCode, description, customsValueGhs, quantityRaw, status } =
    readShipmentFields(formData);

  if (!clientId) return { error: "Choose a client" };
  if (!hsCode) return { error: "HS code is required" };

  const customsValuePesewas = parseCustomsValue(customsValueGhs);
  if (customsValuePesewas === null) return { error: "Enter a valid customs value" };

  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "Quantity must be at least 1" };

  if (!(await assertOwnedClient(clientId, profile.organizationId))) {
    return { error: "That client wasn't found" };
  }

  await db.insert(shipments).values({
    organizationId: profile.organizationId,
    clientId,
    hsCode,
    description: description || null,
    customsValuePesewas,
    quantity,
    status: STATUS_ORDER.includes(status) ? status : "booked",
    createdBy: profile.id,
  });

  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard");
  return {};
}

export async function updateShipmentRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const { clientId, hsCode, description, customsValueGhs, quantityRaw, status } =
    readShipmentFields(formData);

  if (!id) return { error: "Missing shipment id" };
  if (!clientId) return { error: "Choose a client" };
  if (!hsCode) return { error: "HS code is required" };

  const customsValuePesewas = parseCustomsValue(customsValueGhs);
  if (customsValuePesewas === null) return { error: "Enter a valid customs value" };

  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "Quantity must be at least 1" };

  if (!(await assertOwnedClient(clientId, profile.organizationId))) {
    return { error: "That client wasn't found" };
  }

  await db
    .update(shipments)
    .set({
      clientId,
      hsCode,
      description: description || null,
      customsValuePesewas,
      quantity,
      status: STATUS_ORDER.includes(status) ? status : "booked",
      updatedAt: new Date(),
    })
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)));

  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard");
  return {};
}

export async function advanceShipmentStatus(
  id: string,
  status: ShipmentStatus,
): Promise<ActionState> {
  const profile = await requireProfile();
  if (!STATUS_ORDER.includes(status)) return { error: "Invalid status" };

  await db
    .update(shipments)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)));

  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteShipmentRecord(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing shipment id" };

  await db
    .delete(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)));

  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard");
  return {};
}
