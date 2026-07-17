"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatGHS } from "@/lib/utils";
import {
  advanceShipmentStatus,
  createShipmentRecord,
  deleteShipmentRecord,
  updateShipmentRecord,
  type ActionState,
} from "./actions";
import { ShipmentForm } from "./ShipmentForm";
import { StatusBadge } from "./StatusBadge";
import { STATUS_LABEL, nextStatus, type ClientOption, type OptimisticShipment, type Shipment } from "./types";

type OptimisticAction =
  | { type: "add"; shipment: OptimisticShipment }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<OptimisticShipment> };

function reducer(state: OptimisticShipment[], action: OptimisticAction): OptimisticShipment[] {
  switch (action.type) {
    case "add":
      return [action.shipment, ...state];
    case "remove":
      return state.filter((s) => s.id !== action.id);
    case "update":
      return state.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s));
    default:
      return state;
  }
}

export function ShipmentsBoard({
  initialShipments,
  clientOptions,
  organizationId,
  profileId,
}: {
  initialShipments: OptimisticShipment[];
  clientOptions: ClientOption[];
  organizationId: string;
  profileId: string;
}) {
  const [optimisticShipments, dispatchOptimistic] = useOptimistic<
    OptimisticShipment[],
    OptimisticAction
  >(initialShipments, reducer);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData, close: () => void) {
    const clientId = String(formData.get("clientId") ?? "");
    const clientName = clientOptions.find((c) => c.id === clientId)?.name ?? "";
    const temp: OptimisticShipment = {
      id: `temp-${crypto.randomUUID()}`,
      organizationId,
      clientId,
      clientName,
      hsCode: String(formData.get("hsCode") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      customsValuePesewas: Math.round(Number(formData.get("customsValueGhs") ?? 0) * 100),
      quantity: Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1,
      status: "booked",
      createdBy: profileId,
      createdAt: new Date(),
      updatedAt: new Date(),
      computedDutyPesewas: null,
      dutyRatePercent: null,
      pending: true,
    };
    dispatchOptimistic({ type: "add", shipment: temp });
    const result = await createShipmentRecord(formData);
    if (!result.error) close();
    return result;
  }

  async function handleUpdate(formData: FormData, close: () => void) {
    const id = String(formData.get("id") ?? "");
    const clientId = String(formData.get("clientId") ?? "");
    const clientName = clientOptions.find((c) => c.id === clientId)?.name;
    dispatchOptimistic({
      type: "update",
      id,
      patch: {
        clientId,
        clientName,
        hsCode: String(formData.get("hsCode") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        customsValuePesewas: Math.round(Number(formData.get("customsValueGhs") ?? 0) * 100),
        quantity: Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1,
        status: String(formData.get("status") ?? "booked") as Shipment["status"],
        computedDutyPesewas: null,
        dutyRatePercent: null,
      },
    });
    const result = await updateShipmentRecord(formData);
    if (!result.error) close();
    return result;
  }

  function handleDelete(shipment: Shipment) {
    startTransition(async () => {
      dispatchOptimistic({ type: "remove", id: shipment.id });
      const fd = new FormData();
      fd.set("id", shipment.id);
      await deleteShipmentRecord(fd);
    });
  }

  function handleAdvance(shipment: Shipment) {
    const next = nextStatus(shipment.status);
    if (!next) return;
    startTransition(async () => {
      dispatchOptimistic({ type: "update", id: shipment.id, patch: { status: next } });
      await advanceShipmentStatus(shipment.id, next);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {optimisticShipments.length} shipment{optimisticShipments.length === 1 ? "" : "s"}
        </p>
        <Modal
          title="Create a shipment"
          description="Attach it to a client and set the customs value."
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New shipment
            </Button>
          }
        >
          {(close) => <CreateShipmentPanel clientOptions={clientOptions} onSubmit={handleCreate} close={close} />}
        </Modal>
      </div>

      {optimisticShipments.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-foreground">No shipments yet</p>
          <p className="text-xs text-muted-foreground">Create your first shipment above.</p>
        </Card>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence initial={false}>
            {optimisticShipments.map((shipment) => {
              const next = nextStatus(shipment.status);
              return (
                <motion.div
                  key={shipment.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: shipment.pending ? 0.6 : 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <Card interactive className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{shipment.clientName}</p>
                        <p className="text-xs text-muted-foreground">HS {shipment.hsCode}</p>
                      </div>
                      <StatusBadge status={shipment.status} />
                    </div>

                    {shipment.description && (
                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                        {shipment.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold tracking-tight text-primary">
                        {formatGHS(shipment.customsValuePesewas)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        × {shipment.quantity}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {shipment.pending ? (
                        "Estimating duty…"
                      ) : shipment.computedDutyPesewas === null ? (
                        "No published rate for this HS code yet"
                      ) : (
                        <>
                          Est. duty{" "}
                          <span className="font-medium text-foreground">
                            {formatGHS(shipment.computedDutyPesewas)}
                          </span>{" "}
                          ({shipment.dutyRatePercent}%)
                        </>
                      )}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      {next ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={shipment.pending}
                          onClick={() => handleAdvance(shipment)}
                        >
                          Mark {STATUS_LABEL[next]}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1">
                        <Modal
                          title="Edit shipment"
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              aria-label="Edit shipment"
                              disabled={shipment.pending}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <EditShipmentPanel
                              shipment={shipment}
                              clientOptions={clientOptions}
                              onSubmit={handleUpdate}
                              close={close}
                            />
                          )}
                        </Modal>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-danger hover:bg-danger/10"
                          aria-label="Delete shipment"
                          disabled={shipment.pending || isPending}
                          onClick={() => handleDelete(shipment)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function CreateShipmentPanel({
  clientOptions,
  onSubmit,
  close,
}: {
  clientOptions: ClientOption[];
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
      <ShipmentForm clientOptions={clientOptions} submitLabel="Create shipment" error={error} />
    </form>
  );
}

function EditShipmentPanel({
  shipment,
  clientOptions,
  onSubmit,
  close,
}: {
  shipment: Shipment;
  clientOptions: ClientOption[];
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
      <ShipmentForm
        shipment={shipment}
        clientOptions={clientOptions}
        submitLabel="Save changes"
        error={error}
      />
    </form>
  );
}
