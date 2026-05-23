export const STATUS = {
  wishlist: "wishlist",
  no_answer: "no_answer",
  cancelled: "cancelled",
  withdrew: "withdrew",
  rejected: "rejected",
  interviews: "interviews",
  no_offer: "no_offer",
  offer: "offer",
  accepted: "accepted",
  declined: "declined",
} as const;

export type ApplicationStatus = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_NAMES = {
  [STATUS.wishlist]: "Wishlist",
  [STATUS.no_answer]: "No Answer",
  [STATUS.cancelled]: "Cancelled",
  [STATUS.withdrew]: "Withdrew",
  [STATUS.rejected]: "Rejected",
  [STATUS.interviews]: "Interviews",
  [STATUS.no_offer]: "No Offer",
  [STATUS.offer]: "Offer",
  [STATUS.accepted]: "Accepted",
  [STATUS.declined]: "Declined",
} as const;

export const STATUS_NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
  [STATUS.wishlist]: [STATUS.no_answer],
  [STATUS.no_answer]: [STATUS.cancelled, STATUS.rejected, STATUS.interviews],
  [STATUS.cancelled]: [],
  [STATUS.withdrew]: [],
  [STATUS.rejected]: [],
  [STATUS.interviews]: [STATUS.withdrew, STATUS.no_offer, STATUS.offer],
  [STATUS.no_offer]: [],
  [STATUS.offer]: [STATUS.accepted, STATUS.declined],
  [STATUS.accepted]: [],
  [STATUS.declined]: [],
};

// Ranking is the index position in each depth array (lower index = higher up).
const DEPTH_ORDER: Record<number, ApplicationStatus[]> = {
  1: [STATUS.interviews, STATUS.cancelled, STATUS.no_answer, STATUS.rejected],
  2: [STATUS.offer, STATUS.withdrew, STATUS.no_offer],
  3: [STATUS.accepted, STATUS.declined],
};

export const STATUS_THEME: Record<
  ApplicationStatus,
  { dot: string; border: string; badge: string; sankey: string; sankeyDark: string }
> = {
  [STATUS.wishlist]:   { dot: "bg-slate-400",   border: "bg-slate-400",   badge: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",         sankey: "#94a3b8", sankeyDark: "#94a3b8" },
  [STATUS.no_answer]:  { dot: "bg-sky-500",     border: "bg-sky-500",     badge: "bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100",                   sankey: "#0ea5e9", sankeyDark: "#38bdf8" },
  [STATUS.cancelled]:  { dot: "bg-gray-500",    border: "bg-gray-400",    badge: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200",               sankey: "#9ca3af", sankeyDark: "#9ca3af" },
  [STATUS.withdrew]:   { dot: "bg-gray-500",    border: "bg-gray-400",    badge: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200",               sankey: "#94a3b8", sankeyDark: "#94a3b8" },
  [STATUS.rejected]:   { dot: "bg-red-500",     border: "bg-red-500",     badge: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",                   sankey: "#ef4444", sankeyDark: "#f87171" },
  [STATUS.interviews]: { dot: "bg-violet-500",  border: "bg-violet-500",  badge: "bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-100",       sankey: "#8b5cf6", sankeyDark: "#a78bfa" },
  [STATUS.no_offer]:   { dot: "bg-rose-500",    border: "bg-rose-500",    badge: "bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100",               sankey: "#f43f5e", sankeyDark: "#fb7185" },
  [STATUS.offer]:      { dot: "bg-green-500",   border: "bg-green-500",   badge: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",           sankey: "#22c55e", sankeyDark: "#4ade80" },
  [STATUS.accepted]:   { dot: "bg-emerald-500", border: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100",   sankey: "#10b981", sankeyDark: "#34d399" },
  [STATUS.declined]:   { dot: "bg-amber-500",   border: "bg-amber-500",   badge: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100",           sankey: "#f59e0b", sankeyDark: "#fbbf24" },
};

export const SANKEY_ROOT = "applications";
export const SANKEY_ROOT_COLOR = "#60a5fa";
export const SANKEY_ROOT_COLOR_DARK = "#93c5fd";
export const SANKEY_ROOT_LABEL = "Applications";

export function getStatusRankForDepth(status: ApplicationStatus, depth: number): number {
  const index = DEPTH_ORDER[depth]?.indexOf(status) ?? -1;
  return index >= 0 ? index : 999;
}
