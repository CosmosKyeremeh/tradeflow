import { cn } from "@/lib/utils";

// The base bento surface: soft elevation, generous radius, a hover lift
// that's pure CSS (no JS cost) so it stays cheap on low-end devices.
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface elevation-sm transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        interactive && "hover:-translate-y-0.5 hover:elevation-md",
        className,
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card interactive className={cn("p-5", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
