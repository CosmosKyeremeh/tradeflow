"use server";

import { requireProfile } from "@/lib/auth";
import { computeDutyPesewas, findTariffRate } from "@/lib/duty";

export type DutyEstimate = {
  found: boolean;
  ratePercent?: number;
  tariffDescription?: string;
  effectiveDate?: string;
  totalValuePesewas: number;
  computedDutyPesewas?: number;
};

export async function estimateDuty(formData: FormData): Promise<DutyEstimate | { error: string }> {
  await requireProfile();

  const hsCode = String(formData.get("hsCode") ?? "").trim();
  const customsValueGhs = Number(formData.get("customsValueGhs") ?? 0);
  const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1;

  if (!hsCode) return { error: "Enter an HS code" };
  if (!Number.isFinite(customsValueGhs) || customsValueGhs < 0) {
    return { error: "Enter a valid customs value" };
  }

  const customsValuePesewas = Math.round(customsValueGhs * 100);
  const totalValuePesewas = customsValuePesewas * quantity;
  const match = await findTariffRate(hsCode);

  if (!match) {
    return { found: false, totalValuePesewas };
  }

  return {
    found: true,
    ratePercent: match.ratePercent,
    tariffDescription: match.description,
    effectiveDate: match.effectiveDate,
    totalValuePesewas,
    computedDutyPesewas: computeDutyPesewas(customsValuePesewas, quantity, match.ratePercent),
  };
}
