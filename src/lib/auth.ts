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

// The tariff schedule is shared reference data across every organization
// (Ghana's actual published rates), not per-tenant. Gating writes to it by
// org role would let any org's owner corrupt duty estimates for every other
// org, so access is instead tied to an explicit allowlist.
function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (!isAdminEmail(profile.email)) {
    redirect("/dashboard");
  }
  return profile;
}
