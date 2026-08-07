export function ApplicationRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-2xl border border-border-base bg-surface shadow-soft"
        >
          <div className="w-[3px] flex-shrink-0 bg-border-base" />
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <div className="h-[42px] w-[42px] flex-shrink-0 rounded-[10px] bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-surface-2" />
              <div className="h-3 w-48 rounded bg-surface-3" />
            </div>
            <div className="h-6 w-20 rounded-full bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
