import { STATUS_NAMES, type ApplicationStatus } from "@/lib/statuses";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className="badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      data-status={status}
    >
      <span className="status-dot h-1.5 w-1.5 rounded-full" data-status={status} />
      {STATUS_NAMES[status]}
    </span>
  );
}
