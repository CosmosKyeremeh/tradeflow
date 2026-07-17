import { and, count, eq, gte, ne, sum } from "drizzle-orm";
import { db } from "@/db";
import { clients, dutyCalculations, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { StatsGrid, type StatDatum } from "./StatsGrid";

function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function OverviewStats() {
  const profile = await requireProfile();

  const [[{ value: clientCount }], [{ value: activeShipmentCount }], [{ value: dutyTotal }]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(clients)
        .where(eq(clients.organizationId, profile.organizationId)),
      db
        .select({ value: count() })
        .from(shipments)
        .where(
          and(
            eq(shipments.organizationId, profile.organizationId),
            ne(shipments.status, "delivered"),
          ),
        ),
      db
        .select({ value: sum(dutyCalculations.computedDutyPesewas) })
        .from(dutyCalculations)
        .innerJoin(shipments, eq(dutyCalculations.shipmentId, shipments.id))
        .where(
          and(
            eq(shipments.organizationId, profile.organizationId),
            gte(dutyCalculations.createdAt, startOfMonth()),
          ),
        ),
    ]);

  const stats: StatDatum[] = [
    { label: "Active shipments", value: activeShipmentCount },
    { label: "Clients", value: clientCount },
    {
      label: "Duty calculated this month",
      value: Number(dutyTotal ?? 0),
      format: "ghs",
    },
  ];

  return <StatsGrid stats={stats} />;
}
