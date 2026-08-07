import Link from "next/link";

type ApplicationsTabsProps = {
  active: "open" | "closed" | "all";
};

const PILL_ACTIVE =
  "px-3 py-1.5 text-[13px] font-semibold rounded-full bg-surface shadow-soft text-ink";
const PILL_INACTIVE =
  "px-3 py-1.5 text-[13px] font-medium text-ink-3 hover:text-ink-2 transition-colors";

export function ApplicationsTabs({ active }: ApplicationsTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-[11px] bg-surface-2 border border-border-base p-[3px] w-fit">
      <Link href="/applications" className={active === "open" ? PILL_ACTIVE : PILL_INACTIVE}>
        Open
      </Link>
      <Link href="/applications?filter=closed" className={active === "closed" ? PILL_ACTIVE : PILL_INACTIVE}>
        Closed
      </Link>
      <Link href="/applications?filter=all" className={active === "all" ? PILL_ACTIVE : PILL_INACTIVE}>
        All
      </Link>
    </div>
  );
}
