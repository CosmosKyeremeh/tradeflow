import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TariffsData } from "./TariffsData";

export default function TariffsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Tariff schedule</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Shared across every organization — HS code, duty rate, and effective date.
      </p>

      <Suspense fallback={<TableSkeleton />}>
        <TariffsData />
      </Suspense>
    </div>
  );
}
