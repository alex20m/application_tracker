import { PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

const NAV_LABELS = ["Applications", "Wishlist", "Analytics", "Settings"];

export function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-13 items-center gap-4 mobile:h-12`}>
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
            AppTrack
          </span>
          <nav className="flex flex-1 items-center gap-0.5 mobile:hidden">
            {NAV_LABELS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-400 dark:text-gray-500"
              >
                {label}
              </span>
            ))}
          </nav>
        </div>
      </header>
      <main className={`${PAGE_CONTAINER} ${PAGE_VERTICAL}`}>{children}</main>
    </div>
  );
}
