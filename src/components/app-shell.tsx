import Link from "next/link";
import { ROUTES } from "@/lib/env";

type AppShellProps = {
  email: string;
  children: React.ReactNode;
};

const navItems = [
  { href: ROUTES.applications, label: "Applications" },
  { href: ROUTES.sankey, label: "Flow" },
];

export function AppShell({ email, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-6xl items-center gap-6 px-6">
          <span className="text-sm font-bold tracking-tight text-gray-900">
            AppTrack
          </span>

          <nav className="flex flex-1 items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-gray-400 sm:block">{email}</span>
            <form action={ROUTES.signOut} method="post">
              <button
                type="submit"
                className="cursor-pointer text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
