import { Suspense } from "react";
import { StatGridSkeleton } from "@/components/ui/Skeleton";
import { OverviewStats } from "./OverviewStats";

export default function DashboardOverviewPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Overview</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        A quick read on where the business stands today.
      </p>

      <Suspense fallback={<StatGridSkeleton />}>
        <OverviewStats />
      </Suspense>
    </div>
  );
}
