"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tariffEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { error?: string };

function readTariffFields(formData: FormData) {
  const hsCode = String(formData.get("hsCode") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const ratePercentRaw = String(formData.get("ratePercent") ?? "").trim();
  const effectiveDate = String(formData.get("effectiveDate") ?? "").trim();
  return { hsCode, description, ratePercentRaw, effectiveDate };
}

function validateRate(raw: string): number | null {
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0 || rate > 999.99) return null;
  return rate;
}

export async function createTariffEntry(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const { hsCode, description, ratePercentRaw, effectiveDate } = readTariffFields(formData);

  if (!hsCode) return { error: "HS code is required" };
  if (!description) return { error: "Description is required" };
  const ratePercent = validateRate(ratePercentRaw);
  if (ratePercent === null) return { error: "Enter a valid rate percentage" };
  if (!effectiveDate) return { error: "Effective date is required" };

  await db.insert(tariffEntries).values({
    hsCode,
    description,
    ratePercent: ratePercent.toFixed(2),
    effectiveDate,
  });

  revalidatePath("/dashboard/admin/tariffs");
  return {};
}

export async function updateTariffEntry(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { hsCode, description, ratePercentRaw, effectiveDate } = readTariffFields(formData);

  if (!id) return { error: "Missing tariff entry id" };
  if (!hsCode) return { error: "HS code is required" };
  if (!description) return { error: "Description is required" };
  const ratePercent = validateRate(ratePercentRaw);
  if (ratePercent === null) return { error: "Enter a valid rate percentage" };
  if (!effectiveDate) return { error: "Effective date is required" };

  await db
    .update(tariffEntries)
    .set({ hsCode, description, ratePercent: ratePercent.toFixed(2), effectiveDate })
    .where(eq(tariffEntries.id, id));

  revalidatePath("/dashboard/admin/tariffs");
  return {};
}

export async function deleteTariffEntry(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing tariff entry id" };

  try {
    await db.delete(tariffEntries).where(eq(tariffEntries.id, id));
  } catch {
    return { error: "Can't delete a rate that's already been used in a duty calculation" };
  }

  revalidatePath("/dashboard/admin/tariffs");
  return {};
}
