"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/env";
import { BTN_GHOST, PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

type AppShellProps = {
  email: string;
  children: React.ReactNode;
};

const navItems = [
  { href: ROUTES.applications, label: "Applications" },
  { href: ROUTES.wishlist, label: "Wishlist" },
  { href: ROUTES.analytics, label: "Analytics" },
  { href: ROUTES.settings, label: "Settings" },
];

export function AppShell({ email, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-13 items-center gap-4 mobile:h-12`}>
          <Link
            href={ROUTES.applications}
            className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 mobile:text-base"
          >
            AppTrack
          </Link>

          {/* Desktop nav */}
          <nav className="flex flex-1 items-center gap-0.5 mobile:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={BTN_GHOST}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 mobile:hidden">
            <span className="text-xs text-gray-500 dark:text-gray-500">{email}</span>
            <form action={ROUTES.signOut} method="post">
              <button
                type="submit"
                className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100 flex items-center"
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile hamburger trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="hidden mobile:inline-flex ml-auto items-center justify-center rounded-lg p-2 min-h-11 min-w-11 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white dark:bg-slate-900 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex items-center justify-center min-h-11 min-w-11 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
              <form action={ROUTES.signOut} method="post">
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800"
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
