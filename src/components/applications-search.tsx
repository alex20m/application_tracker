"use client";

import { useState, useMemo, useDeferredValue } from "react";
import type { ApplicationRecord } from "@/lib/types";
import { INPUT, TEXT_MUTED } from "@/lib/ui";
import { ApplicationList } from "@/components/application-list";

type ApplicationsSearchProps = {
  applications: ApplicationRecord[];
  fromFilter?: "open" | "closed" | "all";
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
      <input
        type="search"
        aria-label="Search applications"
        placeholder="Search by company or role"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={INPUT}
      />
      {deferredQuery.trim() && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-16 text-center mobile:px-4 mobile:py-10">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No matches for &ldquo;{deferredQuery.trim()}&rdquo;
          </p>
          <p className={`mt-1 ${TEXT_MUTED}`}>
            Try a different company name or role.
          </p>
        </div>
      ) : (
        <ApplicationList applications={filtered} fromFilter={fromFilter} />
      )}
    </div>
  );
}
