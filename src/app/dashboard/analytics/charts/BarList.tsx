"use client";

import { motion } from "motion/react";

export function BarList({
  items,
  formatValue,
  emptyLabel = "No data yet",
}: {
  items: { key: string; label: string; sublabel?: string; value: number }[];
  formatValue?: (n: number) => string;
  emptyLabel?: string;
}) {
  const render = formatValue ?? ((n: number) => n.toString());
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{render(item.value)}</span>
          </div>
          {item.sublabel && (
            <p className="mb-1 text-xs text-muted-foreground">{item.sublabel}</p>
          )}
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
