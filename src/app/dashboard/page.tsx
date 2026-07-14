const STATS = [
  { label: "Active shipments", value: "0" },
  { label: "Clients", value: "0" },
  { label: "Duty calculated this month", value: "GHS 0.00" },
];

export default function DashboardOverviewPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Overview</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Phase 1 wires this up to real data. These are placeholders.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-medium text-primary">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
