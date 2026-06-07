import { LoadingShell } from "@/components/loading-shell";
import { SECTION_STACK } from "@/lib/ui";

export default function WishlistLoading() {
  return (
    <LoadingShell>
      <div className={SECTION_STACK}>
        {/* Page header skeleton */}
        <div className="h-8 w-24 rounded-lg bg-surface-2 animate-pulse" />
        {/* Row skeletons */}
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex overflow-hidden rounded-[13px] border border-border-base bg-surface shadow-sm">
              <div className="w-[3px] flex-shrink-0 bg-surface-3" />
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <div className="h-[42px] w-[42px] flex-shrink-0 rounded-[10px] bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-surface-2" />
                  <div className="h-3 w-48 rounded bg-surface-2" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
