import clsx from "clsx";

import { STATUS_NAMES, STATUS_THEME, type ApplicationStatus } from "@/lib/statuses";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const theme = STATUS_THEME[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium mobile:text-sm mobile:px-3 mobile:py-1.5",
        theme.badge
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", theme.dot)} />
      {STATUS_NAMES[status]}
    </span>
  );
}
