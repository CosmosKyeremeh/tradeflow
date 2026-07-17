import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { ClientsBoard } from "./ClientsBoard";

export async function ClientsData() {
  const profile = await requireProfile();

  const orgClients = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, profile.organizationId))
    .orderBy(desc(clients.createdAt));

  return <ClientsBoard initialClients={orgClients} organizationId={profile.organizationId} />;
}
