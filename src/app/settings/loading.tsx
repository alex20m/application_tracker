import { LoadingShell } from "@/components/loading-shell";
import { CARD, SECTION_STACK } from "@/lib/ui";

export default function SettingsLoading() {
  return (
    <LoadingShell>
      <div className={`max-w-lg mx-auto ${SECTION_STACK} animate-pulse`}>
        <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={CARD}>
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="space-y-3">
              <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
