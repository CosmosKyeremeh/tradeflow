import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { clients, dutyCalculations, shipments } from "@/db/schema";

export type MonthlyPoint = { month: string; label: string; value: number };

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthsAgo(n: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
}

// Aggregation queries group by whatever months actually have rows, so a
// quiet month is simply absent from the result set. Charts need every
// month in the window represented (even at zero) to read as a continuous
// timeline, so this fills the gaps after the query comes back.
function fillMonths(rows: { month: string; value: number }[], months: number): MonthlyPoint[] {
  const byMonth = new Map(rows.map((r) => [r.month, Number(r.value)]));
  const now = new Date();
  const out: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = monthKey(d);
    out.push({
      month: key,
      label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      value: byMonth.get(key) ?? 0,
    });
  }
  return out;
}

export async function volumeOverTime(organizationId: string, months = 6): Promise<MonthlyPoint[]> {
  const since = monthsAgo(months - 1);
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${shipments.createdAt}), 'YYYY-MM')`,
      value: count(),
    })
    .from(shipments)
    .where(and(eq(shipments.organizationId, organizationId), gte(shipments.createdAt, since)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return fillMonths(rows, months);
}

export async function dutyTotalsOverTime(
  organizationId: string,
  months = 6,
): Promise<MonthlyPoint[]> {
  const since = monthsAgo(months - 1);
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${dutyCalculations.createdAt}), 'YYYY-MM')`,
      value: sum(dutyCalculations.computedDutyPesewas),
    })
    .from(dutyCalculations)
    .innerJoin(shipments, eq(dutyCalculations.shipmentId, shipments.id))
    .where(
      and(
        eq(shipments.organizationId, organizationId),
        gte(dutyCalculations.createdAt, since),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return fillMonths(
    rows.map((r) => ({ month: r.month, value: Number(r.value ?? 0) })),
    months,
  );
}

export type HsCodeActivity = {
  hsCode: string;
  shipmentCount: number;
  totalValuePesewas: number;
};

export async function topHsCodes(organizationId: string, limit = 6): Promise<HsCodeActivity[]> {
  const shipmentCount = sql<number>`count(*)`.as("shipment_count");
  const rows = await db
    .select({
      hsCode: shipments.hsCode,
      shipmentCount,
      totalValuePesewas: sum(shipments.customsValuePesewas),
    })
    .from(shipments)
    .where(eq(shipments.organizationId, organizationId))
    .groupBy(shipments.hsCode)
    .orderBy(desc(shipmentCount))
    .limit(limit);
  return rows.map((r) => ({
    hsCode: r.hsCode,
    shipmentCount: Number(r.shipmentCount),
    totalValuePesewas: Number(r.totalValuePesewas ?? 0),
  }));
}

export type ClientActivity = {
  clientId: string;
  clientName: string;
  shipmentCount: number;
  totalValuePesewas: number;
};

export async function clientActivity(organizationId: string, limit = 6): Promise<ClientActivity[]> {
  const shipmentCount = sql<number>`count(*)`.as("shipment_count");
  const rows = await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      shipmentCount,
      totalValuePesewas: sum(shipments.customsValuePesewas),
    })
    .from(shipments)
    .innerJoin(clients, eq(shipments.clientId, clients.id))
    .where(eq(shipments.organizationId, organizationId))
    .groupBy(clients.id, clients.name)
    .orderBy(desc(shipmentCount))
    .limit(limit);
  return rows.map((r) => ({
    clientId: r.clientId,
    clientName: r.clientName,
    shipmentCount: Number(r.shipmentCount),
    totalValuePesewas: Number(r.totalValuePesewas ?? 0),
  }));
}

export type AnalyticsSummary = {
  shipmentCount: number;
  totalValuePesewas: number;
  totalDutyPesewas: number;
};

export async function analyticsSummary(organizationId: string): Promise<AnalyticsSummary> {
  const [[shipmentTotals], [dutyTotals]] = await Promise.all([
    db
      .select({ shipmentCount: count(), totalValuePesewas: sum(shipments.customsValuePesewas) })
      .from(shipments)
      .where(eq(shipments.organizationId, organizationId)),
    db
      .select({ totalDutyPesewas: sum(dutyCalculations.computedDutyPesewas) })
      .from(dutyCalculations)
      .innerJoin(shipments, eq(dutyCalculations.shipmentId, shipments.id))
      .where(eq(shipments.organizationId, organizationId)),
  ]);
  return {
    shipmentCount: shipmentTotals.shipmentCount,
    totalValuePesewas: Number(shipmentTotals.totalValuePesewas ?? 0),
    totalDutyPesewas: Number(dutyTotals.totalDutyPesewas ?? 0),
  };
}
