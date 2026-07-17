"use client";

import { motion, type Variants } from "motion/react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsGrid, type StatDatum } from "../StatsGrid";
import { formatGHS } from "@/lib/utils";
import { TrendChart } from "./charts/TrendChart";
import { BarList } from "./charts/BarList";
import type { AnalyticsSummary, ClientActivity, HsCodeActivity, MonthlyPoint } from "./queries";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

export function AnalyticsBoard({
  summary,
  volume,
  dutyByMonth,
  hsCodes,
  clients,
}: {
  summary: AnalyticsSummary;
  volume: MonthlyPoint[];
  dutyByMonth: MonthlyPoint[];
  hsCodes: HsCodeActivity[];
  clients: ClientActivity[];
}) {
  const stats: StatDatum[] = [
    { label: "Total shipments", value: summary.shipmentCount },
    { label: "Total customs value", value: summary.totalValuePesewas, format: "ghs" },
    { label: "Total duty calculated", value: summary.totalDutyPesewas, format: "ghs" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">All-time totals for your organization.</p>
        <a href="/api/analytics/export">
          <Button variant="secondary" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </a>
      </motion.div>

      <motion.div variants={item}>
        <StatsGrid stats={stats} />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-medium text-primary">Shipment volume, last 6 months</h2>
            <p className="mb-4 text-xs text-muted-foreground">Shipments booked per month.</p>
            <TrendChart data={volume} formatValue={(n) => `${Math.round(n)} shipment${Math.round(n) === 1 ? "" : "s"}`} />
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5">
            <h2 className="text-sm font-medium text-primary">Top HS codes</h2>
            <p className="mb-4 text-xs text-muted-foreground">By shipment count.</p>
            <BarList
              items={hsCodes.map((h) => ({
                key: h.hsCode,
                label: h.hsCode,
                sublabel: formatGHS(h.totalValuePesewas),
                value: h.shipmentCount,
              }))}
              formatValue={(n) => `${n}`}
            />
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-medium text-primary">Duty calculated, last 6 months</h2>
            <p className="mb-4 text-xs text-muted-foreground">Sum of computed duty per month.</p>
            <TrendChart data={dutyByMonth} formatValue={formatGHS} color="var(--success)" />
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5">
            <h2 className="text-sm font-medium text-primary">Client activity</h2>
            <p className="mb-4 text-xs text-muted-foreground">By shipment count.</p>
            <BarList
              items={clients.map((c) => ({
                key: c.clientId,
                label: c.clientName,
                sublabel: formatGHS(c.totalValuePesewas),
                value: c.shipmentCount,
              }))}
              formatValue={(n) => `${n}`}
            />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
