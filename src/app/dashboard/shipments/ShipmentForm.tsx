import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
          id="hsCode"
          name="hsCode"
          required
          placeholder="e.g. 8471.30"
          defaultValue={shipment?.hsCode}
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
            id="customsValueGhs"
            name="customsValueGhs"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={
              shipment ? (shipment.customsValuePesewas / 100).toFixed(2) : undefined
            }
          />
        </Field>
        <Field label="Quantity" htmlFor="quantity">
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={shipment?.quantity ?? 1}
          />
        </Field>
      </div>

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
