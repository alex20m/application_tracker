import type { ApplicationRecord } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { STATUS_THEME } from "@/lib/statuses";
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
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mobile:text-base">No applications yet</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 mobile:text-sm">Add your first application to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {applications.map((app) => (
        <div
          key={app.id}
          className="group flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={`w-1 flex-shrink-0 ${STATUS_THEME[app.status].border}`} />

          <div className="flex flex-1 flex-col gap-3 px-4 py-4 mobile:gap-2">
            {/* Top row: company/role/meta + status badge */}
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/applications/${app.id}`}
                className="flex-1 min-w-0"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mobile:text-base">{app.company}</h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate mobile:text-base">{app.role}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mobile:text-sm">
                  {app.location && <span>{app.location}</span>}
                  {app.applied_on && (
                    <span>Applied {formatDate(app.applied_on)}</span>
                  )}
                </div>
              </Link>

              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <StatusBadge status={app.status} />
                <ApplicationStatusQuickActions
                  applicationId={app.id}
                  currentStatus={app.status}
                />
              </div>
            </div>

            {/* Notes: full width below on all screen sizes */}
            {app.notes && (
              <Link
                href={`/applications/${app.id}`}
                className="block rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mobile:text-sm"
              >
                {app.notes}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
