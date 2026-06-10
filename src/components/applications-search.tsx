"use client";

import { useState, useMemo, useDeferredValue, useRef, useEffect } from "react";
import type { ApplicationRecord } from "@/lib/types";
import type { ApplicationStatus } from "@/lib/statuses";
import { STATUS_NAMES } from "@/lib/statuses";
import { ApplicationList } from "@/components/application-list";
import { SearchInput } from "@/components/search-input";

type ApplicationsSearchProps = {
  applications: ApplicationRecord[];
  fromFilter?: "open" | "closed" | "all";
  counts?: { open: number; closed: number; all: number };
};

// ─── Filter dropdown ─────────────────────────────────────────────────────────

type FilterDropdownProps = {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  formatLabel?: (value: string) => string;
};

function FilterDropdown({ label, options, selected, onToggle, onClear, formatLabel }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const count = selected.size;
  const isActive = count > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[13px] font-medium transition select-none",
          isActive
            ? "border-accent-line bg-accent/10 text-accent-strong"
            : "border-border-base bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink",
        ].join(" ")}
      >
        {label}
        {isActive && (
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-ink leading-none">
            {count}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={["transition-transform", open ? "rotate-180" : ""].join(" ")}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[180px] rounded-[12px] border border-border-base bg-surface shadow-lg">
          {isActive && (
            <div className="border-b border-border-base px-3 py-2">
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto py-1.5">
            {options.map((opt) => {
              const checked = selected.has(opt);
              return (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-surface-2 transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(opt)}
                      className="h-3.5 w-3.5 rounded accent-accent"
                    />
                    {formatLabel ? formatLabel(opt) : opt}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ApplicationsSearch({ applications, fromFilter }: ApplicationsSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [locationFilters, setLocationFilters] = useState<Set<string>>(new Set());

  const availableStatuses = useMemo(
    () => [...new Set(applications.map((a) => a.status))].sort(),
    [applications]
  );

  const availableLocations = useMemo(
    () =>
      [...new Set(applications.map((a) => a.location).filter(Boolean))].sort() as string[],
    [applications]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (q && !app.company.toLowerCase().includes(q) && !app.role.toLowerCase().includes(q)) return false;
      if (statusFilters.size > 0 && !statusFilters.has(app.status)) return false;
      if (locationFilters.size > 0 && !locationFilters.has(app.location)) return false;
      return true;
    });
  }, [applications, deferredQuery, statusFilters, locationFilters]);

  const hasActiveFilters = statusFilters.size > 0 || locationFilters.size > 0 || deferredQuery.trim();

  function toggleStatus(s: string) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  }

  function toggleLocation(l: string) {
    setLocationFilters((prev) => {
      const next = new Set(prev);
      if (next.has(l)) { next.delete(l); } else { next.add(l); }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — full-width on mobile so filters wrap to a second row */}
        <div className="flex-1 min-w-[180px] mobile:flex-none mobile:w-full">
          <SearchInput
            value={query}
            onChange={setQuery}
            ariaLabel="Search applications"
          />
        </div>

        {/* Status filter */}
        {availableStatuses.length > 1 && (
          <FilterDropdown
            label="Status"
            options={availableStatuses}
            selected={statusFilters}
            onToggle={toggleStatus}
            onClear={() => setStatusFilters(new Set())}
            formatLabel={(s) => STATUS_NAMES[s as ApplicationStatus] ?? s}
          />
        )}

        {/* Location filter */}
        {availableLocations.length > 1 && (
          <FilterDropdown
            label="Location"
            options={availableLocations}
            selected={locationFilters}
            onToggle={toggleLocation}
            onClear={() => setLocationFilters(new Set())}
          />
        )}

        {/* Clear all filters */}
        {(statusFilters.size > 0 || locationFilters.size > 0) && (
          <button
            type="button"
            onClick={() => { setStatusFilters(new Set()); setLocationFilters(new Set()); }}
            className="text-xs font-medium text-ink-3 hover:text-ink transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {hasActiveFilters && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
          <p className="text-sm font-semibold text-ink">No matching applications</p>
          <p className="mt-1 text-xs text-ink-3">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <ApplicationList applications={filtered} fromFilter={fromFilter} />
      )}
    </div>
  );
}
