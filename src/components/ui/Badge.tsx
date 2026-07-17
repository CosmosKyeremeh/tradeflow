import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "success" | "danger" | "accent";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "bg-surface-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent/15 text-accent",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
