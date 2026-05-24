import type { ApplicationRecord } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { STATUS_THEME } from "@/lib/statuses";
import { TEXT_BODY, TEXT_META, TEXT_MUTED, ROW_STACK } from "@/lib/ui";
import { ApplicationStatusQuickActions } from "@/components/application-status-quick-actions";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";

type ApplicationListProps = {
  applications: ApplicationRecord[];
};

export function ApplicationList({ applications }: ApplicationListProps) {
  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-16 text-center mobile:px-4 mobile:py-10">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No applications yet</p>
        <p className={`mt-1 ${TEXT_MUTED}`}>Add your first application to get started.</p>
      </div>
    );
  }

  return (
    <div className={ROW_STACK}>
      {applications.map((app) => (
        <div
          key={app.id}
          className="group flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/80 dark:hover:bg-gray-800 dark:hover:border-gray-500 dark:hover:shadow-lg dark:hover:shadow-black/40"
        >
          {/* Status color strip */}
          <div className={`w-1 flex-shrink-0 ${STATUS_THEME[app.status].border}`} />

          {/* Content: single flex row on desktop, wraps to two rows on mobile */}
          <div className="flex flex-1 min-w-0 items-start gap-3 px-4 py-2.5 mobile:flex-wrap mobile:px-3 mobile:py-2">
            <Link
              href={`/applications/${app.id}`}
              className="min-w-0 order-1 mobile:flex-1"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{app.company}</h3>
              <p className={`mt-0.5 ${TEXT_BODY} truncate`}>{app.role}</p>
              <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 ${TEXT_META}`}>
                {app.location && <span>{app.location}</span>}
                {app.applied_on && <span>Applied {formatDate(app.applied_on)}</span>}
              </div>
            </Link>

            {/* Notes — center column on desktop, full-width row below on mobile */}
            {app.notes && (
              <div className="min-w-0 flex-1 order-2 mobile:order-3 mobile:basis-full">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-700/70 px-3 py-2 mobile:py-1.5">
                  <p className={`${TEXT_META} leading-relaxed whitespace-pre-wrap break-words`}>{app.notes}</p>
                </div>
              </div>
            )}

            {/* Badge + actions — right column on desktop, stays top-right on mobile */}
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5 order-3 mobile:order-2">
              <StatusBadge status={app.status} />
              <ApplicationStatusQuickActions
                applicationId={app.id}
                currentStatus={app.status}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
