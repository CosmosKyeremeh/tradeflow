export default function ShipmentsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Shipments</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Shipment records and the duty calculator will live here. Built in
        Phases 1&ndash;2.
      </p>

      <div className="rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
        <p className="text-sm text-foreground">No shipments yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first shipment once this module ships.
        </p>
      </div>
    </div>
  );
}
