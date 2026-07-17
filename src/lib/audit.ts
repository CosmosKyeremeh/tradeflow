import { db } from "@/db";
import { auditLog } from "@/db/schema";

// Every mutation that touches another party's data (clients, shipments,
// documents, the shared tariff schedule) writes one row here. This is the
// accountability trail Ghana's Data Protection Act (Act 843) expects an
// organization to be able to produce -- who changed what, and when --
// and it's the first thing you'd want during a security incident review.
export async function logAudit({
  organizationId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  organizationId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    organizationId,
    actorId,
    action,
    entityType,
    entityId: entityId ?? null,
    metadata: metadata ?? null,
  });
}
