import Link from "next/link";
import { ROUTES } from "@/lib/env";

type ApplicationsTabsProps = {
  active: "open" | "closed";
};

const PILL_ACTIVE =
  "px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white";
const PILL_INACTIVE =
  "px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

export function ApplicationsTabs({ active }: ApplicationsTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1 w-fit">
      <Link
        href={ROUTES.applications}
        className={active === "open" ? PILL_ACTIVE : PILL_INACTIVE}
      >
        Open
      </Link>
      <Link
        href={ROUTES.closedApplications}
        className={active === "closed" ? PILL_ACTIVE : PILL_INACTIVE}
      >
        Closed
      </Link>
    </div>
  );
}
