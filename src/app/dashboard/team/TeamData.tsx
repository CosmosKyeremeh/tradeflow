import { requireProfile } from "@/lib/auth";
import { listPendingInvites, listTeamMembers } from "./actions";
import { TeamBoard } from "./TeamBoard";

export async function TeamData() {
  const profile = await requireProfile();
  const [members, pendingInvites] = await Promise.all([listTeamMembers(), listPendingInvites()]);

  return <TeamBoard initialMembers={members} initialInvites={pendingInvites} currentProfileId={profile.id} />;
}
