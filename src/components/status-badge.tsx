import clsx from "clsx";

import { STATUS_LABELS, type ApplicationStatus } from "@/lib/statuses";

const colorMap: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-700",
  screening: "bg-indigo-100 text-indigo-700",
  interview: "bg-violet-100 text-violet-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  withdrawn: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        colorMap[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
