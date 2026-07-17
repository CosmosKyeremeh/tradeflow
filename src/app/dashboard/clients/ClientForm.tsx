import { Field, Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Client } from "./types";

export function ClientForm({
  client,
  error,
  submitLabel,
}: {
  client?: Client;
  error?: string | null;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {client && <input type="hidden" name="id" value={client.id} />}
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" required defaultValue={client?.name} autoFocus />
      </Field>
      <Field label="Email" htmlFor="contactEmail">
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={client?.contactEmail ?? ""}
        />
      </Field>
      <Field label="Phone" htmlFor="contactPhone">
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          defaultValue={client?.contactPhone ?? ""}
        />
      </Field>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        {submitLabel}
      </SubmitButton>
    </div>
  );
}
