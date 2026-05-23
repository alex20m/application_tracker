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
    <div className="space-y-2">
      {applications.map((app) => (
        <div
          key={app.id}
          className="group flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition hover:shadow-md hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500 dark:hover:shadow-lg dark:hover:shadow-black/40"
        >
          {/* Status color strip */}
          <div className={`w-1 flex-shrink-0 ${STATUS_THEME[app.status].border}`} />

          {/* Clickable area: left (company/role/meta) + middle (notes) */}
          <Link
            href={`/applications/${app.id}`}
            className="flex flex-1 min-w-0 items-center gap-4 px-4 py-3 mobile:flex-col mobile:items-start mobile:gap-2"
          >
            {/* Left: company / role / meta — shrinks to content width on desktop */}
            <div className="min-w-0 shrink-0 mobile:w-full">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mobile:text-base">{app.company}</h3>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-400 truncate mobile:text-base">{app.role}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500 mobile:text-sm">
                {app.location && <span>{app.location}</span>}
                {app.applied_on && <span>Applied {formatDate(app.applied_on)}</span>}
              </div>
            </div>

            {/* Middle: notes grey box — fills remaining space between left and right */}
            {app.notes && (
              <div className="flex-1 min-w-0 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 mobile:w-full">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mobile:text-sm">{app.notes}</p>
              </div>
            )}
          </Link>

          {/* Right: status badge + quick actions — outside Link so buttons remain interactive */}
          <div className="flex flex-shrink-0 flex-col items-end justify-center gap-2 px-4 py-3">
            <StatusBadge status={app.status} />
            <ApplicationStatusQuickActions
              applicationId={app.id}
              currentStatus={app.status}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
