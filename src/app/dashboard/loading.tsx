import { LoadingShell } from "@/components/loading-shell";
import { SECTION_STACK } from "@/lib/ui";

export default function DashboardLoading() {
  return (
    <LoadingShell>
      <div className={`${SECTION_STACK} animate-pulse`}>
        {/* Greeting + button */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-52 rounded-lg bg-surface-2" />
            <div className="h-4 w-72 rounded bg-surface-2" />
          </div>
          <div className="h-10 w-36 rounded-[10px] bg-surface-2" />
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-3 mobile:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border-base bg-surface p-5">
              <div className="h-3 w-16 rounded bg-surface-2 mb-3" />
              <div className="h-8 w-12 rounded bg-surface-3" />
            </div>
          ))}
        </div>

        {/* Needs Attention + Pipeline */}
        <div className="grid grid-cols-[1fr_300px] gap-4 mobile:grid-cols-1">
          {/* Needs Attention */}
          <div className="rounded-3xl border border-border-base bg-surface p-[22px]">
            <div className="h-3 w-28 rounded bg-surface-2 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border-base bg-surface-2 px-3 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-surface-3 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-40 rounded bg-surface-3" />
                    <div className="h-3 w-24 rounded bg-surface-3" />
                  </div>
                  <div className="h-7 w-20 rounded-lg bg-surface-3" />
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="rounded-3xl border border-border-base bg-surface p-[22px]">
            <div className="h-3 w-16 rounded bg-surface-2 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-surface-2" />
                    <div className="h-3 w-6 rounded bg-surface-2" />
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity header */}
        <div className="flex justify-between items-center">
          <div className="h-3 w-28 rounded bg-surface-2" />
          <div className="h-3 w-12 rounded bg-surface-2" />
        </div>

        {/* Recent rows */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex overflow-hidden rounded-2xl border border-border-base bg-surface shadow-soft">
              <div className="w-[3px] flex-shrink-0 bg-surface-3" />
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <div className="h-[42px] w-[42px] flex-shrink-0 rounded-[10px] bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-surface-2" />
                  <div className="h-3 w-24 rounded bg-surface-2" />
                </div>
                <div className="h-6 w-20 rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
