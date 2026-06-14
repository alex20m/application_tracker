"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

type Filter = "open" | "closed" | "all";

const TABS: { filter: Filter; label: string; href: string }[] = [
  { filter: "open", label: "Open", href: "/applications" },
  { filter: "closed", label: "Closed", href: "/applications?filter=closed" },
  { filter: "all", label: "All", href: "/applications?filter=all" },
];

export function ApplicationsFilterView({
  active,
  counts,
  actions,
  children,
}: {
  active: Filter;
  counts?: { open: number; closed: number; all: number };
  actions?: React.ReactNode;
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
      {/* Tabs + action buttons row */}
      <div className="flex items-center justify-between gap-3 mobile:flex-col mobile:items-start">
        <div className="flex items-center gap-1 rounded-[11px] bg-surface-2 border border-border-base p-[3px] w-fit">
          {TABS.map(({ filter, label, href }) => {
            const isActive = optimisticFilter === filter;
            const count = counts?.[filter];
            return (
              <button
                key={filter}
                type="button"
                onClick={() => navigate(filter, href)}
                className={[
                  "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] transition-all",
                  isActive
                    ? "bg-surface shadow-sm font-semibold text-ink"
                    : "font-medium text-ink-3 hover:text-ink-2",
                ].join(" ")}
              >
                {label}
                {count !== undefined && (
                  <span className={[
                    "font-mono text-[11px] leading-none",
                    isActive ? "text-accent-strong" : "text-ink-3",
                  ].join(" ")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
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
