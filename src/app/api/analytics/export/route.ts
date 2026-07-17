import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, dutyCalculations, shipments } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { formatGHS } from "@/lib/utils";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: string[]) {
  return cells.map(csvCell).join(",") + "\r\n";
}

export async function GET() {
  const profile = await requireProfile();

  const rows = await db
    .select({
      hsCode: shipments.hsCode,
      description: shipments.description,
      clientName: clients.name,
      customsValuePesewas: shipments.customsValuePesewas,
      quantity: shipments.quantity,
      status: shipments.status,
      computedDutyPesewas: dutyCalculations.computedDutyPesewas,
      dutyRatePercent: dutyCalculations.ratePercentApplied,
      createdAt: shipments.createdAt,
    })
    .from(shipments)
    .innerJoin(clients, eq(shipments.clientId, clients.id))
    .leftJoin(dutyCalculations, eq(dutyCalculations.shipmentId, shipments.id))
    .where(eq(shipments.organizationId, profile.organizationId))
    .orderBy(desc(shipments.createdAt));

  let csv = csvRow([
    "Created at",
    "Client",
    "HS code",
    "Description",
    "Quantity",
    "Customs value",
    "Status",
    "Duty rate",
    "Computed duty",
  ]);

  for (const row of rows) {
    csv += csvRow([
      row.createdAt.toISOString(),
      row.clientName,
      row.hsCode,
      row.description ?? "",
      String(row.quantity),
      formatGHS(row.customsValuePesewas),
      row.status,
      row.dutyRatePercent === null ? "" : `${row.dutyRatePercent}%`,
      row.computedDutyPesewas === null ? "" : formatGHS(row.computedDutyPesewas),
    ]);
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tradeflow-shipments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
