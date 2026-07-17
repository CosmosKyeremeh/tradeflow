"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  createClientRecord,
  deleteClientRecord,
  updateClientRecord,
  type ActionState,
} from "./actions";
import { ClientForm } from "./ClientForm";
import type { Client, OptimisticClient } from "./types";

function AddClientPanel({
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
    >
      <ClientForm submitLabel="Add client" error={error} />
    </form>
  );
}

function EditClientPanel({
  client,
  onSubmit,
  close,
}: {
  client: Client;
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
    >
      <ClientForm client={client} submitLabel="Save changes" error={error} />
    </form>
  );
}

type OptimisticAction =
  | { type: "add"; client: OptimisticClient }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<Client> };

function reducer(state: OptimisticClient[], action: OptimisticAction): OptimisticClient[] {
  switch (action.type) {
    case "add":
      return [action.client, ...state];
    case "remove":
      return state.filter((c) => c.id !== action.id);
    case "update":
      return state.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c));
    default:
      return state;
  }
}

export function ClientsBoard({
  initialClients,
  organizationId,
}: {
  initialClients: Client[];
  organizationId: string;
}) {
  const [optimisticClients, dispatchOptimistic] = useOptimistic<OptimisticClient[], OptimisticAction>(
    initialClients,
    reducer,
  );
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData, close: () => void) {
    const temp: OptimisticClient = {
      id: `temp-${crypto.randomUUID()}`,
      organizationId,
      name: String(formData.get("name") ?? ""),
      contactEmail: (String(formData.get("contactEmail") ?? "").trim() || null) as string | null,
      contactPhone: (String(formData.get("contactPhone") ?? "").trim() || null) as string | null,
      createdAt: new Date(),
      pending: true,
    };
    // `<form action>` already runs this inside a transition, so the
    // optimistic dispatch below (called synchronously, pre-await) is
    // picked up immediately while createClientRecord is in flight.
    dispatchOptimistic({ type: "add", client: temp });
    const result = await createClientRecord(formData);
    if (!result.error) close();
    return result;
  }

  async function handleUpdate(formData: FormData, close: () => void) {
    const id = String(formData.get("id") ?? "");
    const patch = {
      name: String(formData.get("name") ?? ""),
      contactEmail: (String(formData.get("contactEmail") ?? "").trim() || null) as string | null,
      contactPhone: (String(formData.get("contactPhone") ?? "").trim() || null) as string | null,
    };
    dispatchOptimistic({ type: "update", id, patch });
    const result = await updateClientRecord(formData);
    if (!result.error) close();
    return result;
  }

  function handleDelete(client: Client) {
    startTransition(async () => {
      dispatchOptimistic({ type: "remove", id: client.id });
      const fd = new FormData();
      fd.set("id", client.id);
      await deleteClientRecord(fd);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {optimisticClients.length} client{optimisticClients.length === 1 ? "" : "s"}
        </p>
        <Modal
          title="Add a client"
          description="They'll show up in the shipment form once saved."
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add client
            </Button>
          }
        >
          {(close) => <AddClientPanel onSubmit={handleCreate} close={close} />}
        </Modal>
      </div>

      {optimisticClients.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-foreground">No clients yet</p>
          <p className="text-xs text-muted-foreground">Add your first client above.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {optimisticClients.map((client) => (
                  <motion.tr
                    key={client.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: client.pending ? 0.6 : 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.contactEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.contactPhone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Modal
                          title="Edit client"
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              aria-label={`Edit ${client.name}`}
                              disabled={client.pending}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <EditClientPanel client={client} onSubmit={handleUpdate} close={close} />
                          )}
                        </Modal>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-danger hover:bg-danger/10"
                          aria-label={`Delete ${client.name}`}
                          disabled={client.pending || isPending}
                          onClick={() => handleDelete(client)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
