import { LoadingShell } from "@/components/loading-shell";
import { SECTION_STACK } from "@/lib/ui";

export default function AnalyticsLoading() {
  return (
    <LoadingShell>
      <div className={`${SECTION_STACK} animate-pulse`}>
        {/* Page header skeleton */}
        <div className="h-8 w-28 rounded-lg bg-gray-200 dark:bg-gray-700" />
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mobile:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
            >
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-7 w-12 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
        {/* Chart placeholders */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="h-48 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="h-64 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </LoadingShell>
  );
}
