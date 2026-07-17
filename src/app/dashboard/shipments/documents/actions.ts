"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { DocType, ShipmentDocument } from "./types";

export type ActionState = { error?: string };
export type DocumentWithUrl = ShipmentDocument & { url: string | null };

const BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

async function assertOwnedShipment(shipmentId: string, organizationId: string) {
  const [shipment] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, organizationId)))
    .limit(1);
  return Boolean(shipment);
}

export async function listShipmentDocuments(
  shipmentId: string,
): Promise<DocumentWithUrl[] | { error: string }> {
  const profile = await requireProfile();
  if (!(await assertOwnedShipment(shipmentId, profile.organizationId))) {
    return { error: "Shipment not found" };
  }

  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.shipmentId, shipmentId))
    .orderBy(desc(documents.createdAt));

  const supabase = await createClient();
  const withUrls = await Promise.all(
    rows.map(async (doc) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.filePath, SIGNED_URL_TTL_SECONDS);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );

  return withUrls;
}

// Storage path convention RLS policies key off:
// "{organizationId}/{shipmentId}/{timestamp}-{fileName}"
export async function buildDocumentPath(
  shipmentId: string,
  fileName: string,
): Promise<{ path: string } | { error: string }> {
  const profile = await requireProfile();
  if (!(await assertOwnedShipment(shipmentId, profile.organizationId))) {
    return { error: "Shipment not found" };
  }
  const safeName = fileName.replace(/[^\w.\-]/g, "_");
  return { path: `${profile.organizationId}/${shipmentId}/${Date.now()}-${safeName}` };
}

export async function recordDocument(formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const filePath = String(formData.get("filePath") ?? "");
  const fileName = String(formData.get("fileName") ?? "");
  const docType = String(formData.get("docType") ?? "other") as DocType;

  if (!shipmentId || !filePath || !fileName) {
    return { error: "Missing upload details" };
  }
  if (!(await assertOwnedShipment(shipmentId, profile.organizationId))) {
    return { error: "Shipment not found" };
  }

  const [created] = await db
    .insert(documents)
    .values({
      organizationId: profile.organizationId,
      shipmentId,
      docType,
      filePath,
      fileName,
      uploadedBy: profile.id,
    })
    .returning({ id: documents.id });

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "document.upload",
    entityType: "document",
    entityId: created.id,
    metadata: { shipmentId, fileName, docType },
  });

  revalidatePath("/dashboard/shipments");
  return {};
}

export async function deleteDocument(documentId: string): Promise<ActionState> {
  const profile = await requireProfile();

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, profile.organizationId)))
    .limit(1);

  if (!doc) return { error: "Document not found" };

  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([doc.filePath]);

  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, profile.organizationId)));

  await logAudit({
    organizationId: profile.organizationId,
    actorId: profile.id,
    action: "document.delete",
    entityType: "document",
    entityId: documentId,
    metadata: { fileName: doc.fileName },
  });

  revalidatePath("/dashboard/shipments");
  return {};
}
