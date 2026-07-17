import { Suspense } from "react";
import { AnalyticsSkeleton } from "@/components/ui/Skeleton";
import { AnalyticsData } from "./AnalyticsData";

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Analytics</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Trends across your shipments, duty, and clients.
      </p>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsData />
      </Suspense>
    </div>
  );
}
