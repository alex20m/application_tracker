"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

type Filter = "open" | "closed" | "all";

const PILL_BASE = "cursor-pointer px-3 py-1.5 text-sm rounded-lg transition-colors";
const PILL_ACTIVE = `${PILL_BASE} font-semibold bg-indigo-600 text-white`;
const PILL_INACTIVE = `${PILL_BASE} font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100`;

const TABS: { filter: Filter; label: string; href: string }[] = [
  { filter: "open", label: "Open", href: "/applications" },
  { filter: "closed", label: "Closed", href: "/applications?filter=closed" },
  { filter: "all", label: "All", href: "/applications?filter=all" },
];

export function ApplicationsFilterView({
  active,
  children,
}: {
  active: Filter;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilter, setOptimisticFilter] = useOptimistic(active);

  const navigate = (filter: Filter, href: string) => {
    startTransition(() => {
      setOptimisticFilter(filter);
      router.push(href);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1 w-fit">
        {TABS.map(({ filter, label, href }) => (
          <button
            key={filter}
            type="button"
            onClick={() => navigate(filter, href)}
            className={optimisticFilter === filter ? PILL_ACTIVE : PILL_INACTIVE}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={
          isPending
            ? "opacity-50 pointer-events-none transition-opacity duration-150"
            : "transition-opacity duration-150"
        }
      >
        {children}
      </div>
    </div>
  );
}
