import type { ApplicationRecord } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { NEXT_STATUSES, STATUS_LABELS } from "@/lib/statuses";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { formatDate } from "@/lib/date";
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
              <div className="flex h-full flex-col items-end justify-start gap-2 whitespace-nowrap">
                <details>
                  <summary className="list-none cursor-pointer inline-block">
                    <StatusBadge status={app.status} />
                  </summary>
                  {(NEXT_STATUSES[app.status] ?? []).length > 0 ? (
                    <form action={transitionApplicationStatusAction} className="mt-2 flex items-center justify-end gap-2">
                      <input type="hidden" name="application_id" value={app.id} />
                      <select
                        name="next_status"
                        defaultValue=""
                        required
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                      >
                        <option value="" disabled>
                          Change...
                        </option>
                        {(NEXT_STATUSES[app.status] ?? []).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                        Save
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No further transitions</p>
                  )}
                </details>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
