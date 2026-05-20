import type { ApplicationRecord } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
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
        <Link key={app.id} href={`/applications/${app.id}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{app.company}</h3>
                <p className="text-sm text-slate-600">{app.role}</p>
                {app.applied_on && (
                  <p className="text-xs text-slate-500 mt-1">
                    Applied: {new Date(app.applied_on).toLocaleDateString()}
                  </p>
                )}
              </div>
              <StatusBadge status={app.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
