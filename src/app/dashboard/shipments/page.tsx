import { Suspense } from "react";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { ShipmentsData } from "./ShipmentsData";

export default function ShipmentsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Shipments</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every job in flight, from booking to delivery.
      </p>

      <Suspense fallback={<CardGridSkeleton />}>
        <ShipmentsData />
      </Suspense>
    </div>
  );
}
