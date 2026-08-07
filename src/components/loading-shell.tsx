import { PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

const NAV_LABELS = ["Dashboard", "Applications", "Wishlist", "Analytics"];

export function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border-base/80 bg-surface/82 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-[60px] items-center gap-4 mobile:h-[52px]`}>
          {/* Brand — matches AppShell exactly */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <rect className="logo-fill" width="32" height="32" rx="8" fill="oklch(0.525 0.130 250)" />
              <rect x="0" y="0" width="32" height="14" rx="8" fill="white" fillOpacity="0.07" />
              <path d="M7 23 C12 23 12 15 16 15 C20 15 20 9 25 9" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.8" />
              <circle className="logo-fill" cx="7" cy="23" r="2.5" fill="oklch(0.525 0.130 250)" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <circle className="logo-fill" cx="16" cy="15" r="2.5" fill="oklch(0.525 0.130 250)" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
              <circle cx="16" cy="15" r="1.1" fill="white" fillOpacity="0.65" />
              <circle cx="25" cy="9" r="3.5" fill="white" />
              <circle className="logo-fill" cx="25" cy="9" r="1.7" fill="oklch(0.525 0.130 250)" />
            </svg>
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
            <div className="h-[30px] w-[62px] rounded-full border border-border-strong bg-surface mr-1" />
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
