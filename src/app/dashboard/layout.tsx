import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SidebarContent } from "./SidebarContent";
import { MobileNav } from "./MobileNav";
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

  const isAdmin = isAdminEmail(profile?.email);
  const organizationName = profile?.organizationName ?? "Your organization";
  const userLabel = profile?.fullName ?? profile?.email ?? "";

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <MobileNav isAdmin={isAdmin} organizationName={organizationName} userLabel={userLabel} />
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface sm:flex sm:flex-col">
        <SidebarContent isAdmin={isAdmin} organizationName={organizationName} userLabel={userLabel} />
      </aside>
      <main className="flex-1 bg-surface-muted p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
