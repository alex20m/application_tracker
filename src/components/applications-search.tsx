"use client";

import { useState, useMemo, useDeferredValue } from "react";
import type { ApplicationRecord } from "@/lib/types";
import { ApplicationList } from "@/components/application-list";

type ApplicationsSearchProps = {
  applications: ApplicationRecord[];
  fromFilter?: "open" | "closed" | "all";
  counts?: { open: number; closed: number; all: number };
};

export function ApplicationsSearch({ applications, fromFilter }: ApplicationsSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.company.toLowerCase().includes(q) ||
        app.role.toLowerCase().includes(q)
    );
  }, [applications, deferredQuery]);

  return (
    <div className="space-y-4">
      {/* Search with leading magnifier icon */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="Search applications"
          placeholder="Search by company or role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full rounded-[10px] border border-border-base bg-surface pl-[38px] pr-3 py-2 text-sm text-ink placeholder:text-ink-3 transition focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/20 mobile:py-3 mobile:text-base"
        />
      </div>

      {deferredQuery.trim() && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
          <p className="text-sm font-semibold text-ink">
            No matches for &ldquo;{deferredQuery.trim()}&rdquo;
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Try a different company name or role.
          </p>
        </div>
      ) : (
        <ApplicationList applications={filtered} fromFilter={fromFilter} />
      )}
    </div>
  );
}
