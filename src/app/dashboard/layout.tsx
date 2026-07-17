import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signOut } from "./actions";
import { DashboardNav } from "./DashboardNav";
import { isAdminEmail } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile] = await db
    .select({
      fullName: profiles.fullName,
      email: profiles.email,
      organizationName: organizations.name,
    })
    .from(profiles)
    .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(eq(profiles.id, user.id))
    .limit(1);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface sm:flex sm:flex-col">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-medium text-primary">TradeFlow</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.organizationName ?? "Your organization"}
          </p>
        </div>
        <DashboardNav isAdmin={isAdminEmail(profile?.email)} />
        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-xs text-muted-foreground">
            {profile?.fullName ?? profile?.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground active:scale-95"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-surface-muted p-6 sm:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
