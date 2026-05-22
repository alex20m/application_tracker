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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">No applications yet</p>
        <p className="mt-1 text-xs text-gray-400">Add your first application to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {applications.map((app) => (
        <div
          key={app.id}
          className="group flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={`w-1 flex-shrink-0 ${STATUS_THEME[app.status].border}`} />

          <div className="flex flex-1 items-start gap-4 px-5 py-4">
            <Link
              href={`/applications/${app.id}`}
              className="flex flex-1 min-w-0 items-start gap-4 self-stretch"
            >
              <div className="w-52 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 truncate">{app.company}</h3>
                <p className="mt-0.5 text-sm text-gray-500 truncate">{app.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                  {app.location && <span>{app.location}</span>}
                  {app.applied_on && (
                    <span>Applied {formatDate(app.applied_on)}</span>
                  )}
                </div>
              </div>

              {app.notes && (
                <div className="flex-1 min-w-0 self-stretch rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 leading-relaxed hover:bg-gray-100 transition-colors">
                  {app.notes}
                </div>
              )}
            </Link>

            <div className="flex flex-shrink-0 flex-col items-end gap-2">
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
