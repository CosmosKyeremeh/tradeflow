import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { notifications, profiles } from "@/db/schema";

// Notifies every other member of the organization (not the actor who
// triggered the change) so a team knows what happened without polling.
// Email delivery is a future addition once a provider is chosen -- these
// rows are the trigger point a mailer job would read from.
export async function notifyOrgMembers({
  organizationId,
  excludeProfileId,
  shipmentId,
  type,
  message,
}: {
  organizationId: string;
  excludeProfileId: string;
  shipmentId?: string;
  type: string;
  message: string;
}) {
  const recipients = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.organizationId, organizationId), ne(profiles.id, excludeProfileId)));

  if (recipients.length === 0) return;

  await db.insert(notifications).values(
    recipients.map((recipient) => ({
      organizationId,
      recipientId: recipient.id,
      shipmentId: shipmentId ?? null,
      type,
      message,
    })),
  );
}
