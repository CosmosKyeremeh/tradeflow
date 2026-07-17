import { Field, Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { TariffEntry } from "./types";

export function TariffForm({
  entry,
  error,
  submitLabel,
}: {
  entry?: TariffEntry;
  error?: string | null;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <Field label="HS code" htmlFor="hsCode">
        <Input
          id="hsCode"
          name="hsCode"
          required
          placeholder="e.g. 8471.30"
          defaultValue={entry?.hsCode}
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Input
          id="description"
          name="description"
          required
          placeholder="e.g. Portable computers (laptops)"
          defaultValue={entry?.description}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate (%)" htmlFor="ratePercent">
          <Input
            id="ratePercent"
            name="ratePercent"
            type="number"
            min="0"
            max="999.99"
            step="0.01"
            required
            defaultValue={entry?.ratePercent}
          />
        </Field>
        <Field label="Effective date" htmlFor="effectiveDate">
          <Input
            id="effectiveDate"
            name="effectiveDate"
            type="date"
            required
            defaultValue={entry?.effectiveDate}
          />
        </Field>
      </div>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        {submitLabel}
      </SubmitButton>
    </div>
  );
}
