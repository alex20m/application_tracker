import Link from "next/link";

type AppShellProps = {
  email: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/applications", label: "Applications" },
  { href: "/sankey", label: "Sankey" },
];

export function AppShell({ email, children }: AppShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-8 pt-4 sm:px-6">
      <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Application Tracker</p>
            <h1 className="text-lg font-semibold text-slate-900">
              Sync across phone + desktop
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {email}
            </span>
            <form action="/auth/signout" method="post">
              <button className="button-secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-medium transition border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
