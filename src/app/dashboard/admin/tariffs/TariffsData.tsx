import { asc } from "drizzle-orm";
import { db } from "@/db";
import { tariffEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { TariffsBoard } from "./TariffsBoard";

export async function TariffsData() {
  await requireAdmin();

  const entries = await db
    .select()
    .from(tariffEntries)
    .orderBy(asc(tariffEntries.hsCode), asc(tariffEntries.effectiveDate));

  return <TariffsBoard initialEntries={entries} />;
}
