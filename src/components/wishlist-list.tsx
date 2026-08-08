import type { ApplicationRecord } from "@/lib/types";
import { ROW_STACK } from "@/lib/ui";
import { WishlistApplyAction } from "@/components/wishlist-apply-action";
import Link from "next/link";

type WishlistListProps = {
  applications: ApplicationRecord[];
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

export function WishlistList({ applications }: WishlistListProps) {
  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21S4 15 4 9a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6-8 12-8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-ink">No wishlisted roles yet</p>
        <p className="mt-1 text-xs text-ink-3">Add roles you want to apply for later.</p>
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
          <Link href={`/wishlist/${app.id}`} className="absolute inset-0" aria-label={`${app.company} – ${app.role}`} />

          {/* 3px status strip — wishlist */}
          <div className="row-strip w-[4px] flex-shrink-0" data-status="wishlist" />

          <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3 mobile:flex-wrap mobile:px-3 mobile:py-2.5">
            <Monogram company={app.company} />

            <div className="min-w-0 w-[230px] flex-shrink-0 mobile:flex-1">
              <h3 className="text-[14.5px] font-[650] text-ink truncate leading-tight">{app.company}</h3>
              <p className="mt-0.5 text-[13px] text-ink-2 truncate">{app.role}</p>
            </div>

            {/* Meta */}
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
              {app.notes && (
                <span className="italic truncate text-ink-3">{app.notes}</span>
              )}
            </div>

            {/* End cluster */}
            <div className="relative z-10 flex flex-shrink-0 items-center gap-2 ml-auto">
              <WishlistApplyAction applicationId={app.id} />
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
