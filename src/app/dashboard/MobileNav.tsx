"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "./SidebarContent";
import { NotificationBell } from "./notifications/NotificationBell";

export function MobileNav({
  isAdmin,
  organizationName,
  userLabel,
}: {
  isAdmin: boolean;
  organizationName: string;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        <p className="text-sm font-medium text-primary">TradeFlow</p>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-90"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <motion.div
              className="absolute inset-0 bg-[#0b1220]/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="elevation-lg relative z-10 flex h-full w-64 max-w-[80vw] flex-col border-r border-border bg-surface"
            >
              <div className="flex items-center justify-end px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-1.5 text-muted-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent
                isAdmin={isAdmin}
                organizationName={organizationName}
                userLabel={userLabel}
                onNavigate={() => setOpen(false)}
                showBell={false}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
