"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ROUTES } from "@/lib/env";
import { PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

type AppShellProps = {
  email: string;
  children: React.ReactNode;
};

const navItems = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".6" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".6" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".6" />
      </svg>
    ),
  },
  {
    href: ROUTES.applications,
    label: "Applications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: ROUTES.wishlist,
    label: "Wishlist",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 13.5S2 9.5 2 5.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: ROUTES.analytics,
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 12l3.5-4L9 10l4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13.5 8.5A6 6 0 0 1 7 2a6.5 6.5 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function AppShell({ email, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initials = getInitials(email);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border-base/80 bg-surface/82 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-[60px] items-center gap-4 mobile:h-[52px]`}>
          {/* Brand mark */}
          <Link
            href={ROUTES.dashboard}
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="AppTrack home"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <rect className="logo-fill" width="32" height="32" rx="8" fill="oklch(0.55 0.085 188)" />
              <rect x="0" y="0" width="32" height="14" rx="8" fill="white" fillOpacity="0.07" />
              <path d="M7 23 C12 23 12 15 16 15 C20 15 20 9 25 9" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.8" />
              <circle className="logo-fill" cx="7" cy="23" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <circle className="logo-fill" cx="16" cy="15" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
              <circle cx="16" cy="15" r="1.1" fill="white" fillOpacity="0.65" />
              <circle cx="25" cy="9" r="3.5" fill="white" />
              <circle className="logo-fill" cx="25" cy="9" r="1.7" fill="oklch(0.55 0.085 188)" />
            </svg>
            <span className="text-[14px] font-bold tracking-tight text-ink mobile:hidden">AppTrack</span>
          </Link>

          {/* Desktop nav */}
          <nav className="flex flex-1 items-center gap-0.5 ml-1 mobile:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== ROUTES.dashboard && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13.5px] font-medium transition",
                    isActive
                      ? "bg-accent-soft text-accent-strong font-semibold"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  ].join(" ")}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 ml-auto mobile:hidden">
            <Link
              href={ROUTES.newApplication}
              className="inline-flex items-center gap-1 rounded-[10px] border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink shadow-sm transition hover:bg-surface-2 mr-1"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Add
            </Link>
            <ThemeToggle />
            <Link
              href={ROUTES.settings}
              aria-label="Settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6.5 1.5h3l.4 1.8c.4.2.8.4 1.1.7l1.8-.6 1.5 2.6-1.4 1.2c0 .3.1.5.1.8s0 .5-.1.8l1.4 1.2-1.5 2.6-1.8-.6c-.3.3-.7.5-1.1.7l-.4 1.8h-3l-.4-1.8a4.5 4.5 0 0 1-1.1-.7l-1.8.6L1.7 10l1.4-1.2A4.5 4.5 0 0 1 3 8c0-.3 0-.5.1-.8L1.7 6 3.2 3.4l1.8.6c.3-.3.7-.5 1.1-.7l.4-1.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Link>
            <div className="mx-1.5 h-5 w-px bg-border-base" />
            <span className="text-xs text-ink-3">{email}</span>
            <span
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-accent-ink"
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
            >
              {initials}
            </span>
          </div>

          {/* Mobile hamburger trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="hidden mobile:inline-flex ml-auto cursor-pointer items-center justify-center rounded-lg p-2 min-h-11 min-w-11 text-ink-3 hover:bg-surface-2 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 hidden mobile:block">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border-base px-4 py-3">
              <span className="text-sm font-bold text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex cursor-pointer items-center justify-center min-h-11 min-w-11 rounded-lg text-ink-3 hover:bg-surface-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== ROUTES.dashboard && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-2.5 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-accent-soft text-accent-strong font-semibold"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    ].join(" ")}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-border-base p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-accent-ink flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}
                >
                  {initials}
                </span>
                <p className="text-xs text-ink-3 truncate">{email}</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href={ROUTES.settings}
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                  aria-label="Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6.5 1.5h3l.4 1.8c.4.2.8.4 1.1.7l1.8-.6 1.5 2.6-1.4 1.2c0 .3.1.5.1.8s0 .5-.1.8l1.4 1.2-1.5 2.6-1.8-.6c-.3.3-.7.5-1.1.7l-.4 1.8h-3l-.4-1.8a4.5 4.5 0 0 1-1.1-.7l-1.8.6L1.7 10l1.4-1.2A4.5 4.5 0 0 1 3 8c0-.3 0-.5.1-.8L1.7 6 3.2 3.4l1.8.6c.3-.3.7-.5 1.1-.7l.4-1.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </Link>
              </div>
              <form action={ROUTES.signOut} method="post">
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg border border-border-base px-3 py-2.5 text-sm font-medium text-ink-2 transition hover:bg-surface-2"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <main className={`${PAGE_CONTAINER} ${PAGE_VERTICAL}`}>{children}</main>
    </div>
  );
}
