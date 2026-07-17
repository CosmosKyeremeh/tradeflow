import type { tariffEntries } from "@/db/schema";

export type TariffEntry = typeof tariffEntries.$inferSelect;
export type OptimisticTariffEntry = TariffEntry & { pending?: boolean };
