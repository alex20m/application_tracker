import type { ApplicationRecord } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { ApplicationStatusQuickActions } from "@/components/application-status-quick-actions";
import Link from "next/link";

type ApplicationListProps = {
  applications: ApplicationRecord[];
};

export function ApplicationList({ applications }: ApplicationListProps) {
  if (!applications.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center text-slate-500">
        <p>No applications yet.</p>
        <p className="mt-1 text-sm">Create your first one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        // Keep status transitions one-click in preview for a simpler flow.
        <div
          key={app.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="grid gap-3 md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-start">
            <Link href={`/applications/${app.id}`} className="block min-w-0 pr-2">
              <h3 className="font-semibold text-slate-900">{app.company}</h3>
              <p className="mt-1 text-sm text-slate-600">{app.role}</p>
              <p className="mt-1 text-xs text-slate-500">{app.location}</p>
              {app.applied_on && (
                <p className="mt-1 text-xs text-slate-500">
                  Applied: {formatDate(app.applied_on)}
                </p>
              )}
            </Link>

            <Link
              href={`/applications/${app.id}`}
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Notes
              </p>
              {app.notes ? (
                <p className="mt-1 text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
                  {app.notes}
                </p>
              ) : null}
            </Link>

            <div className="text-right pl-2">
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
