import { PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

const NAV_LABELS = ["Dashboard", "Applications", "Wishlist", "Analytics"];

export function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border-base/80 bg-surface/82 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-[60px] items-center gap-4 mobile:h-[52px]`}>
          {/* Brand — matches AppShell exactly */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px]"
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M2.5 6.5L5 9L10.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[14px] font-bold tracking-tight text-ink mobile:hidden">AppTrack</span>
          </div>

          {/* Nav placeholder */}
          <nav className="flex flex-1 items-center gap-0.5 ml-1 mobile:hidden">
            {NAV_LABELS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13.5px] font-medium text-ink-2"
              >
                {label}
              </span>
            ))}
          </nav>

          {/* Right cluster skeleton — prevents layout shift when real AppShell mounts */}
          <div className="flex items-center gap-1.5 ml-auto mobile:hidden">
            <div className="h-[30px] w-[62px] rounded-[10px] border border-border-strong bg-surface mr-1" />
            <div className="h-8 w-8 rounded-lg bg-surface-2" />
            <div className="h-8 w-8 rounded-lg bg-surface-2" />
            <div className="mx-1.5 h-5 w-px bg-border-base" />
            <div className="h-3 w-24 rounded bg-surface-2" />
            <div className="ml-1 h-7 w-7 rounded-full bg-surface-2" />
          </div>

          {/* Mobile hamburger skeleton */}
          <div className="hidden mobile:inline-flex ml-auto h-11 w-11 items-center justify-center rounded-lg bg-surface-2" />
        </div>
      </header>
      <main className={`${PAGE_CONTAINER} ${PAGE_VERTICAL}`}>{children}</main>
    </div>
  );
}
