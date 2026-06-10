"use client";

import { useState, useMemo } from "react";
import type { ApplicationRecord } from "@/lib/types";
import { SearchInput } from "@/components/search-input";
import { WishlistList } from "@/components/wishlist-list";

type WishlistSearchProps = {
  applications: ApplicationRecord[];
};

export function WishlistSearch({ applications }: WishlistSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.company.toLowerCase().includes(q) ||
        app.role.toLowerCase().includes(q)
    );
  }, [applications, query]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        ariaLabel="Search wishlist"
      />
      {query.trim() && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
          <p className="text-sm font-semibold text-ink">No matches for &ldquo;{query.trim()}&rdquo;</p>
          <p className="mt-1 text-xs text-ink-3">Try a different company name or role.</p>
        </div>
      ) : (
        <WishlistList applications={filtered} />
      )}
    </div>
  );
}
