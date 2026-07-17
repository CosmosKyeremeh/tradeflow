import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";

// Every dashboard route and mutation needs the caller's organizationId to
// scope queries (Drizzle connects with a direct DB connection, not the
// user's JWT, so Postgres RLS doesn't apply here — the app must filter by
// organizationId itself). This centralizes that lookup.
export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile?.organizationId) {
    redirect("/login");
  }

  return profile as typeof profile & { organizationId: string };
}
