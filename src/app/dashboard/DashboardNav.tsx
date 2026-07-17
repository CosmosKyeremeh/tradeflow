"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/shipments", label: "Shipments" },
  { href: "/dashboard/calculator", label: "Duty calculator" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

const ADMIN_NAV_ITEMS = [{ href: "/dashboard/admin/tariffs", label: "Tariff schedule" }];

export function DashboardNav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="relative block rounded-lg px-3 py-2 text-sm text-foreground transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={`relative ${isActive ? "font-medium text-primary-foreground" : "hover:text-primary"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
