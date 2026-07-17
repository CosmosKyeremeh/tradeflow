"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatGHS } from "@/lib/utils";
import { estimateDuty, type DutyEstimate } from "../calculator/actions";
import { STATUS_LABEL, STATUS_ORDER, type ClientOption, type Shipment } from "./types";

export function ShipmentForm({
  shipment,
  clientOptions,
  error,
  submitLabel,
}: {
  shipment?: Shipment;
  clientOptions: ClientOption[];
  error?: string | null;
  submitLabel: string;
}) {
  const hsCodeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const [estimate, setEstimate] = useState<DutyEstimate | { error: string } | null>(null);
  const [isEstimating, startEstimate] = useTransition();

  function refreshEstimate() {
    const hsCode = hsCodeRef.current?.value.trim();
    const value = valueRef.current?.value;
    if (!hsCode || !value) return;

    const fd = new FormData();
    fd.set("hsCode", hsCode);
    fd.set("customsValueGhs", value);
    fd.set("quantity", quantityRef.current?.value || "1");

    startEstimate(async () => {
      setEstimate(await estimateDuty(fd));
    });
  }

  if (clientOptions.length === 0 && !shipment) {
    return (
      <p className="rounded-lg bg-surface-muted px-3 py-3 text-sm text-muted-foreground">
        Add a client first — shipments need one to attach to.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {shipment && <input type="hidden" name="id" value={shipment.id} />}

      <Field label="Client" htmlFor="clientId">
        <Select id="clientId" name="clientId" required defaultValue={shipment?.clientId ?? ""}>
          <option value="" disabled>
            Select a client
          </option>
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="HS code" htmlFor="hsCode">
        <Input
          ref={hsCodeRef}
          id="hsCode"
          name="hsCode"
          required
          placeholder="e.g. 8471.30"
          defaultValue={shipment?.hsCode}
          onBlur={refreshEstimate}
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={shipment?.description ?? ""}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Customs value (GHS)" htmlFor="customsValueGhs">
          <Input
            ref={valueRef}
            id="customsValueGhs"
            name="customsValueGhs"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={
              shipment ? (shipment.customsValuePesewas / 100).toFixed(2) : undefined
            }
            onBlur={refreshEstimate}
          />
        </Field>
        <Field label="Quantity" htmlFor="quantity">
          <Input
            ref={quantityRef}
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={shipment?.quantity ?? 1}
            onBlur={refreshEstimate}
          />
        </Field>
      </div>

      <AnimatePresence mode="wait">
        {(isEstimating || estimate) && (
          <motion.div
            key={isEstimating ? "pending" : JSON.stringify(estimate)}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="overflow-hidden rounded-lg bg-surface-muted px-3 py-2.5 text-xs"
          >
            {isEstimating ? (
              <span className="text-muted-foreground">Estimating duty…</span>
            ) : estimate && "error" in estimate ? (
              <span className="text-danger">{estimate.error}</span>
            ) : estimate && !estimate.found ? (
              <span className="text-muted-foreground">No published rate for this HS code yet</span>
            ) : (
              estimate && (
                <span className="text-foreground">
                  Est. duty{" "}
                  <span className="font-medium">{formatGHS(estimate.computedDutyPesewas!)}</span>{" "}
                  <span className="text-muted-foreground">({estimate.ratePercent}%)</span>
                </span>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {shipment && (
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={shipment.status}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <SubmitButton pendingLabel="Saving…" className="w-full">
        {submitLabel}
      </SubmitButton>
    </div>
  );
}
