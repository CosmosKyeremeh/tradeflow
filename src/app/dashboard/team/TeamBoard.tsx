"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Mail, Plus, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createInvite, revokeInvite, type ActionState } from "./actions";
import type { PendingInvite, TeamMember } from "./types";

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  owner: "Owner",
  agent: "Agent",
  viewer: "Viewer",
};

function InviteForm({
  onSubmit,
  close,
}: {
  onSubmit: (formData: FormData, close: () => void) => Promise<ActionState>;
  close: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action={async (fd) => {
        const result = await onSubmit(fd, close);
        setError(result.error ?? null);
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <Field label="Email" htmlFor="invite-email">
        <Input id="invite-email" name="email" type="email" required autoFocus placeholder="teammate@example.com" />
      </Field>
      <p className="text-xs text-muted-foreground">
        They&rsquo;ll join this organization automatically the first time they sign up with this
        email -- no separate account-switching step needed.
      </p>
      <SubmitButton pendingLabel="Sending…" className="w-full">
        Send invite
      </SubmitButton>
    </form>
  );
}

export function TeamBoard({
  initialMembers,
  initialInvites,
  currentProfileId,
}: {
  initialMembers: TeamMember[];
  initialInvites: PendingInvite[];
  currentProfileId: string;
}) {
  const [invites, dispatchInvites] = useOptimistic<
    (PendingInvite & { pending?: boolean })[],
    { type: "add"; invite: PendingInvite & { pending?: boolean } } | { type: "remove"; id: string }
  >(initialInvites, (state, action) => {
    switch (action.type) {
      case "add":
        return [action.invite, ...state];
      case "remove":
        return state.filter((i) => i.id !== action.id);
      default:
        return state;
    }
  });
  const [isPending, startTransition] = useTransition();

  async function handleInvite(formData: FormData, close: () => void) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const temp: PendingInvite & { pending?: boolean } = {
      id: `temp-${crypto.randomUUID()}`,
      email,
      createdAt: new Date(),
      invitedByName: "You",
      pending: true,
    };
    dispatchInvites({ type: "add", invite: temp });
    const result = await createInvite(formData);
    if (result.error) {
      // Validation failed server-side (duplicate email, already a member,
      // etc.) -- drop the optimistic row rather than leaving a permanently
      // disabled ghost entry sitting in the list.
      dispatchInvites({ type: "remove", id: temp.id });
    } else {
      close();
    }
    return result;
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      dispatchInvites({ type: "remove", id });
      await revokeInvite(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialMembers.length} member{initialMembers.length === 1 ? "" : "s"}
        </p>
        <Modal
          title="Invite a teammate"
          description="Everyone in your organization sees the same clients and shipments."
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Invite teammate
            </Button>
          }
        >
          {(close) => <InviteForm onSubmit={handleInvite} close={close} />}
        </Modal>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {initialMembers.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {member.fullName ?? "—"}
                    {member.id === currentProfileId && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ROLE_LABEL[member.role]}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(member.createdAt, { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {invites.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-primary">Pending invites</p>
          <Card className="overflow-hidden p-0">
            <ul>
              <AnimatePresence initial={false}>
                {invites.map((invite) => (
                  <motion.li
                    key={invite.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: invite.pending ? 0.6 : 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited by {invite.invitedByName ?? "a teammate"}{" "}
                        {formatDistanceToNow(invite.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-danger hover:bg-danger/10"
                      aria-label={`Revoke invite for ${invite.email}`}
                      disabled={invite.pending || isPending}
                      onClick={() => handleRevoke(invite.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Card>
        </div>
      )}

      {initialMembers.length === 1 && invites.length === 0 && (
        <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-foreground">Just you so far</p>
          <p className="text-xs text-muted-foreground">
            Invite a teammate above to share this organization&rsquo;s clients and shipments.
          </p>
        </Card>
      )}
    </div>
  );
}
