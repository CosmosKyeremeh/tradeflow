import { Badge } from "@/components/ui/Badge";
import { STATUS_LABEL, type ShipmentStatus } from "./types";

const TONE: Record<ShipmentStatus, "neutral" | "accent" | "success"> = {
  booked: "neutral",
  in_transit: "accent",
  at_port: "accent",
  cleared: "success",
  delivered: "success",
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge tone={TONE[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
