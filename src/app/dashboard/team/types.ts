import type { invites, profiles } from "@/db/schema";

export type TeamMember = Pick<
  typeof profiles.$inferSelect,
  "id" | "fullName" | "email" | "role" | "createdAt"
>;

export type PendingInvite = Pick<
  typeof invites.$inferSelect,
  "id" | "email" | "createdAt"
> & { invitedByName: string | null };
