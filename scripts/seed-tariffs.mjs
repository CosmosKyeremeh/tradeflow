// Seeds a handful of illustrative tariff entries so the duty calculator and
// shipment flow are demoable end-to-end. These are NOT Ghana's real
// published GRA rates — every description is prefixed [EXAMPLE] and the
// admin UI (/dashboard/admin/tariffs) shows the same warning. Replace with
// the actual current schedule before this is used for a real client quote.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    throw new Error("DATABASE_URL is not set and .env.local was not found.");
  }
  const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env.local");
  return match[1].trim();
}

const SEED_ENTRIES = [
  {
    hsCode: "8471.30",
    description: "[EXAMPLE] Portable computers (laptops)",
    ratePercent: "5.00",
    effectiveDate: "2026-01-01",
  },
  {
    hsCode: "8517.12",
    description: "[EXAMPLE] Mobile phones",
    ratePercent: "5.00",
    effectiveDate: "2026-01-01",
  },
  {
    hsCode: "6109.10",
    description: "[EXAMPLE] T-shirts, cotton, knitted",
    ratePercent: "20.00",
    effectiveDate: "2026-01-01",
  },
  {
    hsCode: "8703.23",
    description: "[EXAMPLE] Motor cars, 1500-3000cc",
    ratePercent: "35.00",
    effectiveDate: "2026-01-01",
  },
  {
    hsCode: "3004.90",
    description: "[EXAMPLE] Medicaments, other, for retail sale",
    ratePercent: "0.00",
    effectiveDate: "2026-01-01",
  },
  {
    hsCode: "2710.12",
    description: "[EXAMPLE] Motor spirit (petrol)",
    ratePercent: "10.00",
    effectiveDate: "2026-01-01",
  },
];

const sql = postgres(loadDatabaseUrl(), { prepare: false, connect_timeout: 15 });

try {
  let inserted = 0;
  for (const entry of SEED_ENTRIES) {
    const existing = await sql`
      select id from tariff_entries
      where hs_code = ${entry.hsCode} and effective_date = ${entry.effectiveDate}
    `;
    if (existing.length > 0) continue;

    await sql`
      insert into tariff_entries (hs_code, description, rate_percent, effective_date)
      values (${entry.hsCode}, ${entry.description}, ${entry.ratePercent}, ${entry.effectiveDate})
    `;
    inserted += 1;
  }
  console.log(`Seeded ${inserted} tariff entr${inserted === 1 ? "y" : "ies"} (${SEED_ENTRIES.length - inserted} already present).`);
} finally {
  await sql.end();
}
