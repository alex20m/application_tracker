import { LoadingShell } from "@/components/loading-shell";
import { ApplicationRowsSkeleton } from "@/components/application-rows-skeleton";
import { SECTION_STACK } from "@/lib/ui";

export default function ApplicationsLoading() {
  return (
    <LoadingShell>
      <div className={SECTION_STACK}>
        {/* Page header skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="h-8 w-36 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-3 w-24 rounded bg-surface-2 animate-pulse" />
          </div>
          <div className="h-9 w-48 rounded-lg bg-surface-2 animate-pulse" />
        </div>
        {/* Tabs skeleton */}
        <div className="h-9 w-56 rounded-xl bg-surface-2 animate-pulse" />
        <ApplicationRowsSkeleton />
      </div>
    </LoadingShell>
  );
}
