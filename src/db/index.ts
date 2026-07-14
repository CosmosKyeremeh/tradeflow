import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Uses the Supabase connection string (transaction pooler recommended for
// serverless/edge deployments — see .env.example).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
