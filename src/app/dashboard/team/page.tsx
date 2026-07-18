import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TeamData } from "./TeamData";

export default function TeamPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Team</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Everyone in your organization sees the same clients and shipments.
      </p>

      <Suspense fallback={<TableSkeleton />}>
        <TeamData />
      </Suspense>
    </div>
  );
}
