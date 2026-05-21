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

const STATUS_NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
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

export const APPLICATION_STATUSES = Object.values(STATUS) as ApplicationStatus[];

export const STATUS_LABELS: Record<ApplicationStatus, string> = STATUS_NAMES;
export const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = STATUS_NEXT;

export function getStatusRankForDepth(status: ApplicationStatus, depth: number): number {
  const index = DEPTH_ORDER[depth]?.indexOf(status) ?? -1;
  return index >= 0 ? index : 999;
}
