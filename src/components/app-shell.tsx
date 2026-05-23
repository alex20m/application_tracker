import Link from "next/link";
import { ROUTES } from "@/lib/env";
import { BTN_GHOST, PAGE_CONTAINER, PAGE_VERTICAL } from "@/lib/ui";

type AppShellProps = {
  email: string;
  children: React.ReactNode;
};

const navItems = [
  { href: ROUTES.applications, label: "Applications" },
  { href: ROUTES.sankey, label: "Flow" },
  { href: ROUTES.settings, label: "Settings" },
];

export function AppShell({ email, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className={`${PAGE_CONTAINER} flex h-13 items-center gap-4 mobile:h-12`}>
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 mobile:text-base">
            AppTrack
          </span>

          <nav className="flex flex-1 items-center gap-0.5">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={BTN_GHOST}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="mobile:hidden hidden text-xs text-gray-400 dark:text-gray-500 sm:block">{email}</span>
            <form action={ROUTES.signOut} method="post">
              <button
                type="submit"
                className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100 mobile:text-sm mobile:min-h-11 flex items-center"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} ${PAGE_VERTICAL}`}>{children}</main>
    </div>
  );
}
