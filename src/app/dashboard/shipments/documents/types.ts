import type { documents } from "@/db/schema";

export type ShipmentDocument = typeof documents.$inferSelect;
export type DocType = ShipmentDocument["docType"];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  invoice: "Invoice",
  packing_list: "Packing list",
  certificate_of_origin: "Certificate of origin",
  other: "Other",
};

export const DOC_TYPES: DocType[] = [
  "invoice",
  "packing_list",
  "certificate_of_origin",
  "other",
];
