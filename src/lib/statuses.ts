export const APPLICATION_STATUSES = [
  "wishlist",
  "no_answer",
  "withdrew",
  "rejected",
  "interviews",
  "no_offer",
  "offer",
  "accepted",
  "declined",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  no_answer: "No Answer",
  withdrew: "Withdrew",
  rejected: "Rejected",
  interviews: "Interviews",
  no_offer: "No Offer",
  offer: "Offer",
  accepted: "Accepted",
  declined: "Declined",
};

export const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  wishlist: ["no_answer"],
  no_answer: ["withdrew", "rejected", "interviews"],
  withdrew: [],
  rejected: [],
  interviews: ["withdrew", "no_offer", "offer"],
  no_offer: [],
  offer: ["accepted", "declined"],
  accepted: [],
  declined: [],
};
