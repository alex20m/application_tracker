import { PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

const NAV_LABELS = ["Dashboard", "Applications", "Wishlist", "Analytics"];

export function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border-base bg-surface/82 backdrop-blur-md" style={{ height: "60px" }}>
        <div className={`${PAGE_CONTAINER} flex h-full items-center gap-6 mobile:gap-4`}>
          {/* Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M2 6.5L5 9.5L11 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">AppTrack</span>
          </div>
          {/* Nav placeholder */}
          <nav className="flex flex-1 items-center gap-1 mobile:hidden">
            {NAV_LABELS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center justify-center px-3 py-1.5 text-[13.5px] font-medium text-ink-3 rounded-lg"
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
