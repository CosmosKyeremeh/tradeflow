import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ClientsData } from "./ClientsData";

export default function ClientsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Clients</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every client your organization works with.
      </p>

      <Suspense fallback={<TableSkeleton />}>
        <ClientsData />
      </Suspense>
    </div>
  );
}
