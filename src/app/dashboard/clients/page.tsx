export default function ClientsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Clients</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Client records will live here. Built in Phase 1.
      </p>

      <div className="rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
        <p className="text-sm text-foreground">No clients yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first client once shipment &amp; client CRUD ships in Phase 1.
        </p>
      </div>
    </div>
  );
}
