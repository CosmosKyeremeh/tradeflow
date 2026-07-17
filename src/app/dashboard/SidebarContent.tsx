import { signOut } from "./actions";
import { DashboardNav } from "./DashboardNav";
import { NotificationBell } from "./notifications/NotificationBell";

export function SidebarContent({
  isAdmin,
  organizationName,
  userLabel,
  onNavigate,
  showBell = true,
}: {
  isAdmin: boolean;
  organizationName: string;
  userLabel: string;
  onNavigate?: () => void;
  showBell?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between border-b border-border px-4 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">TradeFlow</p>
          <p className="truncate text-xs text-muted-foreground">{organizationName}</p>
        </div>
        {showBell && <NotificationBell />}
      </div>
      <DashboardNav isAdmin={isAdmin} onNavigate={onNavigate} />
      <div className="border-t border-border px-4 py-4">
        <p className="truncate text-xs text-muted-foreground">{userLabel}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-2 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground active:scale-95"
          >
            Log out
          </button>
        </form>
      </div>
    </>
  );
}
