import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { dutyCalculations, tariffEntries } from "@/db/schema";

export type TariffMatch = {
  id: string;
  hsCode: string;
  description: string;
  ratePercent: number;
  effectiveDate: string;
};

// Picks the most recent tariff entry for an HS code that's actually in
// effect (its effective date has arrived), so a rate published for the
// future doesn't apply early and a superseded rate doesn't linger.
export async function findTariffRate(hsCode: string): Promise<TariffMatch | null> {
  const today = new Date().toISOString().slice(0, 10);

  const [entry] = await db
    .select()
    .from(tariffEntries)
    .where(and(eq(tariffEntries.hsCode, hsCode.trim()), lte(tariffEntries.effectiveDate, today)))
    .orderBy(desc(tariffEntries.effectiveDate))
    .limit(1);

  if (!entry) return null;

  return {
    id: entry.id,
    hsCode: entry.hsCode,
    description: entry.description,
    ratePercent: Number(entry.ratePercent),
    effectiveDate: entry.effectiveDate,
  };
}

export function computeDutyPesewas(
  customsValuePesewasPerUnit: number,
  quantity: number,
  ratePercent: number,
) {
  const totalValuePesewas = customsValuePesewasPerUnit * quantity;
  return Math.round(totalValuePesewas * (ratePercent / 100));
}

// Keeps at most one DutyCalculation row per shipment, recomputed from the
// tariff schedule as of now. If no published rate matches the HS code, any
// stale calculation is removed rather than left showing an outdated number.
export async function syncShipmentDutyCalculation(
  shipmentId: string,
  hsCode: string,
  customsValuePesewasPerUnit: number,
  quantity: number,
): Promise<TariffMatch | null> {
  const match = await findTariffRate(hsCode);

  await db.delete(dutyCalculations).where(eq(dutyCalculations.shipmentId, shipmentId));

  if (!match) return null;

  await db.insert(dutyCalculations).values({
    shipmentId,
    tariffEntryId: match.id,
    hsCode: match.hsCode,
    ratePercentApplied: match.ratePercent.toFixed(2),
    computedDutyPesewas: computeDutyPesewas(customsValuePesewasPerUnit, quantity, match.ratePercent),
  });

  return match;
}
