import type { clients } from "@/db/schema";

export type Client = typeof clients.$inferSelect;
export type OptimisticClient = Client & { pending?: boolean };
