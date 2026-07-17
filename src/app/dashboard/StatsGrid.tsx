"use client";

import { motion, type Variants } from "motion/react";
import { StatCard } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatGHS } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

// Server Components can't pass functions as props to Client Components, so
// the server side sends a format *key* and this client component resolves
// it to an actual formatter.
const FORMATTERS: Record<string, (n: number) => string> = {
  ghs: formatGHS,
};

export type StatDatum = {
  label: string;
  value: number;
  format?: keyof typeof FORMATTERS;
  hint?: string;
};

export function StatsGrid({ stats }: { stats: StatDatum[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={item}>
          <StatCard
            label={stat.label}
            value={
              <AnimatedNumber
                value={stat.value}
                format={stat.format ? FORMATTERS[stat.format] : undefined}
              />
            }
            hint={stat.hint}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
