export const STATUS = {
  wishlist: "wishlist",
  applied: "applied",
  ghosted: "ghosted",
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
  [STATUS.applied]: "Applied",
  [STATUS.ghosted]: "Ghosted",
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
  [STATUS.wishlist]: [STATUS.applied],
  [STATUS.applied]: [STATUS.cancelled, STATUS.rejected, STATUS.interviews, STATUS.ghosted],
  [STATUS.ghosted]: [STATUS.cancelled, STATUS.rejected, STATUS.interviews],
  [STATUS.cancelled]: [],
  [STATUS.withdrew]: [],
  [STATUS.rejected]: [],
  [STATUS.interviews]: [STATUS.withdrew, STATUS.no_offer, STATUS.offer],
  [STATUS.no_offer]: [],
  [STATUS.offer]: [STATUS.accepted, STATUS.declined],
  [STATUS.accepted]: [],
  [STATUS.declined]: [],
};

// Statuses with no onward transitions — the process has fully ended.
export const FINAL_STATUSES: readonly ApplicationStatus[] = [
  STATUS.cancelled,
  STATUS.withdrew,
  STATUS.rejected,
  STATUS.no_offer,
  STATUS.accepted,
  STATUS.declined,
];

// Closed = ghosted (stalled/no response) + all final statuses.
export const CLOSED_STATUSES: readonly ApplicationStatus[] = [STATUS.ghosted, ...FINAL_STATUSES];

// Active (Open) = non-wishlist statuses that are not closed.
export const ACTIVE_STATUSES: readonly ApplicationStatus[] = [
  STATUS.applied,
  STATUS.interviews,
  STATUS.offer,
];

export function isClosedStatus(s: ApplicationStatus): boolean {
  return (CLOSED_STATUSES as readonly string[]).includes(s);
}

export function isActiveStatus(s: ApplicationStatus): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(s);
}

// Logical level for each status (independent of d3-sankey's runtime depth).
// Lower index within a level = higher up in the column.
const LEVEL_ORDER: Record<number, ApplicationStatus[]> = {
  1: [STATUS.interviews, STATUS.cancelled, STATUS.applied, STATUS.ghosted, STATUS.rejected],
  2: [STATUS.offer, STATUS.withdrew, STATUS.no_offer],
  3: [STATUS.accepted, STATUS.declined],
};

const STATUS_LEVEL: Record<ApplicationStatus, number> = (() => {
  const m = {} as Record<ApplicationStatus, number>;
  for (const [lvl, list] of Object.entries(LEVEL_ORDER) as [string, ApplicationStatus[]][]) {
    for (const s of list) m[s] = Number(lvl);
  }
  m[STATUS.wishlist] = 0;
  return m;
})();

export const STATUS_THEME: Record<
  ApplicationStatus,
  { dot: string; border: string; badge: string; sankey: string }
> = {
  [STATUS.wishlist]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-wishlist)" },
  [STATUS.applied]:    { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-applied)" },
  [STATUS.ghosted]:    { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-ghosted)" },
  [STATUS.cancelled]:  { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-cancelled)" },
  [STATUS.withdrew]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-withdrew)" },
  [STATUS.rejected]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-rejected)" },
  [STATUS.interviews]: { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-interviews)" },
  [STATUS.no_offer]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-no_offer)" },
  [STATUS.offer]:      { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-offer)" },
  [STATUS.accepted]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-accepted)" },
  [STATUS.declined]:   { dot: "status-dot", border: "row-strip", badge: "badge", sankey: "var(--st-declined)" },
};

export const SANKEY_ROOT = "applications";
// The root "Applications" node is chrome, not a status — it follows the accent
// so it stays theme-aware alongside the var(--st-*) colours above.
export const SANKEY_ROOT_COLOR = "var(--accent)";
export const SANKEY_ROOT_LABEL = "Applications";

export function getStatusRank(status: ApplicationStatus): number {
  const level = STATUS_LEVEL[status] ?? 99;
  const idx = LEVEL_ORDER[level]?.indexOf(status) ?? 99;
  return level * 100 + idx;
}

// Pipeline stage index for the detail-page stepper.
// Stages: 0=Applied, 1=Interviews, 2=Offer, 3=Decision
// Returns -1 for statuses that are not actively in a stage (wishlist,
// negative exits like rejected/withdrew, etc.) so no stage is highlighted.
export function statusStageIndex(status: ApplicationStatus): number {
  switch (status) {
    case STATUS.applied:    return 0;
    case STATUS.interviews: return 1;
    case STATUS.offer:      return 2;
    case STATUS.accepted:
    case STATUS.declined:   return 3;
    default:                return -1;
  }
}
