"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { syncShipmentDutyCalculation } from "@/lib/duty";
import { notifyOrgMembers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { STATUS_LABEL, STATUS_ORDER, type ShipmentStatus } from "./types";

export type ActionState = { error?: string };

function parseCustomsValue(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

async function findOwnedClient(clientId: string, organizationId: string) {
  const [client] = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1);
  return client ?? null;
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

async function notifyStatusChange(
  organizationId: string,
  actorId: string,
  shipmentId: string,
  clientName: string,
  hsCode: string,
  status: ShipmentStatus,
) {
  await notifyOrgMembers({
    organizationId,
    excludeProfileId: actorId,
    shipmentId,
    type: "shipment_status_changed",
    message: `${clientName} — HS ${hsCode} moved to ${STATUS_LABEL[status]}`,
  });
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

  const client = await findOwnedClient(clientId, profile.organizationId);
  if (!client) return { error: "That client wasn't found" };

  const [created] = await db
    .insert(shipments)
    .values({
      organizationId: profile.organizationId,
      clientId,
      hsCode,
      description: description || null,
      customsValuePesewas,
      quantity,
      status: STATUS_ORDER.includes(status) ? status : "booked",
      createdBy: profile.id,
    })
    .returning({ id: shipments.id });

  await syncShipmentDutyCalculation(
    created.id,
    profile.organizationId,
    hsCode,
    customsValuePesewas,
    quantity,
  );

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "shipment.create",
    entityType: "shipment",
    entityId: created.id,
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

  const client = await findOwnedClient(clientId, profile.organizationId);
  if (!client) return { error: "That client wasn't found" };

  const [existing] = await db
    .select({ status: shipments.status })
    .from(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)))
    .limit(1);
  if (!existing) return { error: "Shipment not found" };

  const nextStatus = STATUS_ORDER.includes(status) ? status : "booked";

  await db
    .update(shipments)
    .set({
      clientId,
      hsCode,
      description: description || null,
      customsValuePesewas,
      quantity,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)));

  await syncShipmentDutyCalculation(id, profile.organizationId, hsCode, customsValuePesewas, quantity);

  if (nextStatus !== existing.status) {
    await notifyStatusChange(profile.organizationId, profile.id, id, client.name, hsCode, nextStatus);
  }

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "shipment.update",
    entityType: "shipment",
    entityId: id,
    metadata:
      nextStatus !== existing.status ? { statusFrom: existing.status, statusTo: nextStatus } : undefined,
  });

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

  const [shipment] = await db
    .select({
      hsCode: shipments.hsCode,
      clientName: clients.name,
    })
    .from(shipments)
    .innerJoin(clients, eq(shipments.clientId, clients.id))
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)))
    .limit(1);
  if (!shipment) return { error: "Shipment not found" };

  await db
    .update(shipments)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, profile.organizationId)));

  await notifyStatusChange(
    profile.organizationId,
    profile.id,
    id,
    shipment.clientName,
    shipment.hsCode,
    status,
  );

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "shipment.status_change",
    entityType: "shipment",
    entityId: id,
    metadata: { statusTo: status },
  });

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

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "shipment.delete",
    entityType: "shipment",
    entityId: id,
  });

  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard");
  return {};
}
