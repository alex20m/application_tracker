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
  { dot: string; border: string; badge: string; sankey: string }
> = {
  [STATUS.wishlist]:   { dot: "bg-slate-400",   border: "bg-slate-400",   badge: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",           sankey: "#94a3b8" },
  [STATUS.no_answer]:  { dot: "bg-sky-500",     border: "bg-sky-500",     badge: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-800 dark:text-sky-100 dark:ring-sky-700",                   sankey: "#0ea5e9" },
  [STATUS.cancelled]:  { dot: "bg-zinc-500",    border: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",             sankey: "#a1a1aa" },
  [STATUS.withdrew]:   { dot: "bg-stone-500",   border: "bg-stone-400",   badge: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700",       sankey: "#a8a29e" },
  [STATUS.rejected]:   { dot: "bg-red-500",     border: "bg-red-500",     badge: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-800 dark:text-red-100 dark:ring-red-700",                   sankey: "#ef4444" },
  [STATUS.interviews]: { dot: "bg-violet-500",  border: "bg-violet-500",  badge: "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200 dark:bg-violet-800 dark:text-violet-100 dark:ring-violet-700", sankey: "#8b5cf6" },
  [STATUS.no_offer]:   { dot: "bg-rose-500",    border: "bg-rose-500",    badge: "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-800 dark:text-rose-100 dark:ring-rose-700",             sankey: "#f43f5e" },
  [STATUS.offer]:      { dot: "bg-green-500",   border: "bg-green-500",   badge: "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-800 dark:text-green-100 dark:ring-green-700",       sankey: "#22c55e" },
  [STATUS.accepted]:   { dot: "bg-emerald-500", border: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-800 dark:text-emerald-100 dark:ring-emerald-700", sankey: "#10b981" },
  [STATUS.declined]:   { dot: "bg-amber-500",   border: "bg-amber-500",   badge: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:ring-amber-700",       sankey: "#f59e0b" },
};

export const SANKEY_ROOT = "applications";
export const SANKEY_ROOT_COLOR = "#60a5fa";
export const SANKEY_ROOT_LABEL = "Applications";

export function getStatusRankForDepth(status: ApplicationStatus, depth: number): number {
  const index = DEPTH_ORDER[depth]?.indexOf(status) ?? -1;
  return index >= 0 ? index : 999;
}
