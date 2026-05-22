import clsx from "clsx";

import { STATUS_LABELS, type ApplicationStatus } from "@/lib/statuses";

export const STATUS_DOT_COLOR: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-400",
  no_answer: "bg-blue-500",
  withdrew: "bg-gray-400",
  rejected: "bg-red-500",
  interviews: "bg-violet-500",
  no_offer: "bg-orange-400",
  offer: "bg-emerald-500",
  accepted: "bg-green-500",
  declined: "bg-amber-400",
};

export const STATUS_LEFT_BORDER: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-300",
  no_answer: "bg-blue-400",
  withdrew: "bg-gray-300",
  rejected: "bg-red-400",
  interviews: "bg-violet-500",
  no_offer: "bg-orange-400",
  offer: "bg-emerald-500",
  accepted: "bg-green-500",
  declined: "bg-amber-400",
};

const BADGE_STYLE: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-100 text-slate-600",
  no_answer: "bg-blue-50 text-blue-700",
  withdrew: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-700",
  interviews: "bg-violet-50 text-violet-700",
  no_offer: "bg-orange-50 text-orange-700",
  offer: "bg-emerald-50 text-emerald-700",
  accepted: "bg-green-50 text-green-700",
  declined: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        BADGE_STYLE[status]
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_DOT_COLOR[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
