export default function WishlistLoading() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        >
          <div className="w-1 flex-shrink-0 bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
