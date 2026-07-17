"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileWarning, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  createTariffEntry,
  deleteTariffEntry,
  updateTariffEntry,
  type ActionState,
} from "./actions";
import { TariffForm } from "./TariffForm";
import type { OptimisticTariffEntry, TariffEntry } from "./types";

type OptimisticAction =
  | { type: "add"; entry: OptimisticTariffEntry }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<TariffEntry> };

function reducer(
  state: OptimisticTariffEntry[],
  action: OptimisticAction,
): OptimisticTariffEntry[] {
  switch (action.type) {
    case "add":
      return [action.entry, ...state];
    case "remove":
      return state.filter((e) => e.id !== action.id);
    case "update":
      return state.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e));
    default:
      return state;
  }
}

export function TariffsBoard({ initialEntries }: { initialEntries: TariffEntry[] }) {
  const [optimisticEntries, dispatchOptimistic] = useOptimistic<
    OptimisticTariffEntry[],
    OptimisticAction
  >(initialEntries, reducer);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData, close: () => void) {
    const temp: OptimisticTariffEntry = {
      id: `temp-${crypto.randomUUID()}`,
      hsCode: String(formData.get("hsCode") ?? ""),
      description: String(formData.get("description") ?? ""),
      ratePercent: String(formData.get("ratePercent") ?? "0"),
      effectiveDate: String(formData.get("effectiveDate") ?? ""),
      createdAt: new Date(),
      pending: true,
    };
    dispatchOptimistic({ type: "add", entry: temp });
    const result = await createTariffEntry(formData);
    if (!result.error) close();
    return result;
  }

  async function handleUpdate(formData: FormData, close: () => void) {
    const id = String(formData.get("id") ?? "");
    dispatchOptimistic({
      type: "update",
      id,
      patch: {
        hsCode: String(formData.get("hsCode") ?? ""),
        description: String(formData.get("description") ?? ""),
        ratePercent: String(formData.get("ratePercent") ?? "0"),
        effectiveDate: String(formData.get("effectiveDate") ?? ""),
      },
    });
    const result = await updateTariffEntry(formData);
    if (!result.error) close();
    return result;
  }

  function handleDelete(entry: TariffEntry) {
    startTransition(async () => {
      dispatchOptimistic({ type: "remove", id: entry.id });
      const fd = new FormData();
      fd.set("id", entry.id);
      await deleteTariffEntry(fd);
    });
  }

  return (
    <div>
      <div className="mb-4 rounded-lg bg-accent/15 px-4 py-3 text-sm text-accent-foreground">
        <p className="flex items-center gap-2 font-medium">
          <FileWarning className="h-4 w-4" />
          Placeholder rates
        </p>
        <p className="mt-1 text-xs">
          These example entries let the calculator work end-to-end, but they are{" "}
          <strong>not</strong> Ghana&apos;s real published tariff schedule. Replace them with the
          current GRA rates before quoting a real client.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {optimisticEntries.length} rate{optimisticEntries.length === 1 ? "" : "s"}
        </p>
        <Modal
          title="Add a tariff entry"
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add rate
            </Button>
          }
        >
          {(close) => <CreatePanel onSubmit={handleCreate} close={close} />}
        </Modal>
      </div>

      {optimisticEntries.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <p className="text-sm text-foreground">No tariff entries yet</p>
          <p className="text-xs text-muted-foreground">Add your first rate above.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">HS code</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Rate</th>
                <th className="px-4 py-2.5 font-medium">Effective</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {optimisticEntries.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: entry.pending ? 0.6 : 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {entry.hsCode}
                    </td>
                    <td className="px-4 py-3 text-foreground">{entry.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.ratePercent}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.effectiveDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Modal
                          title="Edit tariff entry"
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              aria-label={`Edit ${entry.hsCode}`}
                              disabled={entry.pending}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <EditPanel entry={entry} onSubmit={handleUpdate} close={close} />
                          )}
                        </Modal>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-danger hover:bg-danger/10"
                          aria-label={`Delete ${entry.hsCode}`}
                          disabled={entry.pending || isPending}
                          onClick={() => handleDelete(entry)}
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

function CreatePanel({
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
      <TariffForm submitLabel="Add rate" error={error} />
    </form>
  );
}

function EditPanel({
  entry,
  onSubmit,
  close,
}: {
  entry: TariffEntry;
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
      <TariffForm entry={entry} submitLabel="Save changes" error={error} />
    </form>
  );
}
