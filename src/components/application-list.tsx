import type { ApplicationRecord } from "@/lib/types";
import { FormattedDate } from "@/lib/date";
import { ROW_STACK } from "@/lib/ui";
import { ApplicationStatusCell } from "@/components/application-status-cell";
import Link from "next/link";

type ApplicationListProps = {
  applications: ApplicationRecord[];
  fromFilter?: "open" | "closed" | "all";
};

function Monogram({ company }: { company: string }) {
  const initials = company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center rounded-[10px] border border-border-base bg-surface-2 text-[13px] font-bold text-ink-2 select-none">
      {initials}
    </div>
  );
}

export function ApplicationList({ applications, fromFilter }: ApplicationListProps) {
  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-ink">No applications yet</p>
        <p className="mt-1 text-xs text-ink-3">Add your first application to get started.</p>
      </div>
    );
  }

  return (
    <div className={ROW_STACK}>
      {applications.map((app) => (
        <div
          key={app.id}
          className="group relative flex overflow-hidden rounded-2xl border border-border-base bg-surface shadow-soft transition hover:-translate-y-px hover:shadow-panel hover:border-border-strong"
        >
          {/* Stretched link */}
          <Link
            href={`/applications/${app.id}${fromFilter && fromFilter !== "open" ? `?from=${fromFilter}` : ""}`}
            className="absolute inset-0"
            aria-label={`${app.company} – ${app.role}`}
          />

          {/* 3px status strip */}
          <div className="row-strip w-[3px] flex-shrink-0" data-status={app.status} />

          <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3 mobile:flex-wrap mobile:px-3 mobile:py-2.5">
            {/* Monogram */}
            <Monogram company={app.company} />

            {/* Main block */}
            <div className="min-w-0 w-[230px] flex-shrink-0 mobile:flex-1">
              <h3 className="text-[14.5px] font-[650] text-ink truncate leading-tight">{app.company}</h3>
              <p className="mt-0.5 text-[13px] text-ink-2 truncate">{app.role}</p>
            </div>

            {/* Meta row — hidden under 920px */}
            <div className="flex flex-1 min-w-0 items-center gap-x-4 text-xs text-ink-3 mobile:hidden" style={{ display: "none" }}>
              <span className="hidden [display:none] [@media(min-width:920px)]:flex items-center gap-1 min-w-0 flex-1">
                {app.location && (
                  <span className="flex items-center gap-1 truncate">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="6" cy="4.5" r="1" fill="currentColor" />
                    </svg>
                    {app.location}
                  </span>
                )}
                {app.applied_on && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="1" y="2.5" width="10" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 1v3M8 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className="tabular-nums">
                      <FormattedDate dateString={app.applied_on} />
                    </span>
                  </span>
                )}
              </span>
            </div>

            {/* Meta (CSS approach for 920px breakpoint) */}
            <div className="hidden [@media(min-width:920px)]:flex flex-1 min-w-0 items-center gap-x-4 text-xs text-ink-3">
              {app.location && (
                <span className="flex items-center gap-1 truncate">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="6" cy="4.5" r="1" fill="currentColor" />
                  </svg>
                  {app.location}
                </span>
              )}
              {app.applied_on && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <rect x="1" y="2.5" width="10" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 1v3M8 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span className="tabular-nums">
                    <FormattedDate dateString={app.applied_on} />
                  </span>
                </span>
              )}
              {app.source && (
                <span className="flex items-center gap-1 truncate">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M5 6.5a2.5 2.5 0 0 0 3.54.46l1.5-1.5a2.5 2.5 0 0 0-3.54-3.54L5.79 2.63" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 5.5a2.5 2.5 0 0 0-3.54-.46l-1.5 1.5a2.5 2.5 0 0 0 3.54 3.54l.67-.68" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {app.source}
                </span>
              )}
            </div>

            {/* End cluster: badge + move + chevron */}
            <div className="flex flex-shrink-0 items-center gap-2 ml-auto">
              <div className="relative z-10">
                <ApplicationStatusCell applicationId={app.id} currentStatus={app.status} />
              </div>
              <svg className="text-ink-3 mobile:hidden" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
