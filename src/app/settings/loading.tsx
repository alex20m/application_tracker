import { LoadingShell } from "@/components/loading-shell";
import { CARD, SECTION_STACK } from "@/lib/ui";

export default function SettingsLoading() {
  return (
    <LoadingShell>
      <div className={`max-w-[580px] mx-auto ${SECTION_STACK} animate-pulse`}>
        <div className="h-8 w-24 rounded-lg bg-surface-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={CARD}>
            <div className="h-4 w-32 rounded bg-surface-2 mb-4" />
            <div className="space-y-3">
              <div className="h-9 rounded-lg bg-surface-2" />
              <div className="h-9 rounded-lg bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
