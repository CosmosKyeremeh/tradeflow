import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, dutyCalculations, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { ShipmentsBoard } from "./ShipmentsBoard";

export async function ShipmentsData() {
  const profile = await requireProfile();

  const [orgShipments, orgClients] = await Promise.all([
    db
      .select({
        id: shipments.id,
        organizationId: shipments.organizationId,
        clientId: shipments.clientId,
        clientName: clients.name,
        hsCode: shipments.hsCode,
        description: shipments.description,
        customsValuePesewas: shipments.customsValuePesewas,
        quantity: shipments.quantity,
        status: shipments.status,
        createdBy: shipments.createdBy,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        computedDutyPesewas: dutyCalculations.computedDutyPesewas,
        dutyRatePercent: dutyCalculations.ratePercentApplied,
      })
      .from(shipments)
      .innerJoin(clients, eq(shipments.clientId, clients.id))
      .leftJoin(dutyCalculations, eq(dutyCalculations.shipmentId, shipments.id))
      .where(eq(shipments.organizationId, profile.organizationId))
      .orderBy(desc(shipments.createdAt)),
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.organizationId, profile.organizationId))
      .orderBy(clients.name),
  ]);

  return (
    <ShipmentsBoard
      initialShipments={orgShipments.map((s) => ({
        ...s,
        dutyRatePercent: s.dutyRatePercent === null ? null : Number(s.dutyRatePercent),
      }))}
      clientOptions={orgClients}
      organizationId={profile.organizationId}
      profileId={profile.id}
    />
  );
}
