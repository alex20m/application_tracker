export const STATUS = {
  wishlist: "wishlist",
  no_answer: "no_answer",
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
  [STATUS.no_answer]: [STATUS.withdrew, STATUS.rejected, STATUS.interviews],
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
  1: [STATUS.interviews, STATUS.withdrew, STATUS.no_answer, STATUS.rejected],
  2: [STATUS.offer, STATUS.withdrew, STATUS.no_offer],
  3: [STATUS.accepted, STATUS.declined],
};

export const STATUS_THEME: Record<
  ApplicationStatus,
  { dot: string; border: string; badge: string; sankey: string }
> = {
  [STATUS.wishlist]:   { dot: "bg-slate-400",   border: "bg-slate-300",   badge: "bg-slate-100 text-slate-600",    sankey: "#94a3b8" },
  [STATUS.no_answer]:  { dot: "bg-blue-500",    border: "bg-blue-400",    badge: "bg-blue-50 text-blue-700",       sankey: "#818cf8" },
  [STATUS.withdrew]:   { dot: "bg-gray-400",    border: "bg-gray-300",    badge: "bg-gray-100 text-gray-600",      sankey: "#94a3b8" },
  [STATUS.rejected]:   { dot: "bg-red-500",     border: "bg-red-400",     badge: "bg-red-50 text-red-700",         sankey: "#f87171" },
  [STATUS.interviews]: { dot: "bg-violet-500",  border: "bg-violet-500",  badge: "bg-violet-50 text-violet-700",   sankey: "#a78bfa" },
  [STATUS.no_offer]:   { dot: "bg-orange-400",  border: "bg-orange-400",  badge: "bg-orange-50 text-orange-700",   sankey: "#fb923c" },
  [STATUS.offer]:      { dot: "bg-emerald-500", border: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", sankey: "#34d399" },
  [STATUS.accepted]:   { dot: "bg-green-500",   border: "bg-green-500",   badge: "bg-green-50 text-green-700",     sankey: "#22c55e" },
  [STATUS.declined]:   { dot: "bg-amber-400",   border: "bg-amber-400",   badge: "bg-amber-50 text-amber-700",     sankey: "#fbbf24" },
};

export const SANKEY_ROOT = "applications";
export const SANKEY_ROOT_COLOR = "#60a5fa";
export const SANKEY_ROOT_LABEL = "Applications";

export function getStatusRankForDepth(status: ApplicationStatus, depth: number): number {
  const index = DEPTH_ORDER[depth]?.indexOf(status) ?? -1;
  return index >= 0 ? index : 999;
}
