import { LoadingShell } from "@/components/loading-shell";
import { SECTION_STACK } from "@/lib/ui";

export default function AnalyticsLoading() {
  return (
    <LoadingShell>
      <div className={`${SECTION_STACK} animate-pulse`}>
        {/* Page header skeleton */}
        <div className="h-8 w-28 rounded-lg bg-surface-2" />
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mobile:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border-base bg-surface p-4">
              <div className="h-3 w-20 rounded bg-surface-2 mb-2" />
              <div className="h-7 w-12 rounded bg-surface-3" />
            </div>
          ))}
        </div>
        {/* Chart placeholders */}
        <div className="rounded-2xl border border-border-base bg-surface p-5">
          <div className="h-48 rounded-xl bg-surface-2" />
        </div>
        <div className="rounded-2xl border border-border-base bg-surface p-5">
          <div className="h-64 rounded-xl bg-surface-2" />
        </div>
      </div>
    </LoadingShell>
  );
}
