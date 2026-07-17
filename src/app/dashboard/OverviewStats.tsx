import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clients, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { StatsGrid, type StatDatum } from "./StatsGrid";

export async function OverviewStats() {
  const profile = await requireProfile();

  const [[{ value: clientCount }], [{ value: activeShipmentCount }]] = await Promise.all([
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
  ]);

  const stats: StatDatum[] = [
    { label: "Active shipments", value: activeShipmentCount },
    { label: "Clients", value: clientCount },
    {
      label: "Duty calculated this month",
      value: 0,
      format: "ghs",
      hint: "Duty calculator ships in Phase 2",
    },
  ];

  return <StatsGrid stats={stats} />;
}
