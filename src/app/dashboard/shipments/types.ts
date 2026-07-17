import type { clients, shipments } from "@/db/schema";

export type Shipment = typeof shipments.$inferSelect;
export type ShipmentStatus = Shipment["status"];
export type OptimisticShipment = Shipment & {
  pending?: boolean;
  clientName: string;
  computedDutyPesewas: number | null;
  dutyRatePercent: number | null;
};
export type ClientOption = Pick<typeof clients.$inferSelect, "id" | "name">;

export const STATUS_ORDER: ShipmentStatus[] = [
  "booked",
  "in_transit",
  "at_port",
  "cleared",
  "delivered",
];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  in_transit: "In transit",
  at_port: "At port",
  cleared: "Cleared",
  delivered: "Delivered",
};

export function nextStatus(status: ShipmentStatus): ShipmentStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}
