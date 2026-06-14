import { revalidatePath } from "next/cache";
import { STATUS, type ApplicationStatus } from "./statuses";
import type { InterviewRound, StatusEvent } from "./types";

type ViewScope = "applications" | "wishlist";

export function revalidateApplicationViews(scope: ViewScope = "applications") {
  if (scope === "wishlist") {
    revalidatePath("/wishlist");
    revalidatePath("/applications");
  } else {
    revalidatePath("/applications");
  }
  revalidatePath("/analytics");
}

const NO_RESPONSE_STATUSES: readonly ApplicationStatus[] = [STATUS.applied, STATUS.ghosted];

export function addInterviewRound(
  rounds: InterviewRound[],
  partial: Omit<InterviewRound, "id">
): InterviewRound[] {
  return [...rounds, { ...partial, id: crypto.randomUUID() }];
}

export function updateInterviewRound(
  rounds: InterviewRound[],
  id: string,
  patch: Partial<Omit<InterviewRound, "id">>
): InterviewRound[] {
  return rounds.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export function removeInterviewRound(rounds: InterviewRound[], id: string): InterviewRound[] {
  return rounds.filter((r) => r.id !== id);
}

export function isLatestRound(rounds: InterviewRound[], id: string): boolean {
  return rounds.length > 0 && rounds[rounds.length - 1].id === id;
}

export function appendStatusEvent(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  events: StatusEvent[]
): StatusEvent[] {
  const changed_at = new Date().toISOString();
  if (NO_RESPONSE_STATUSES.includes(currentStatus)) {
    return [
      ...events.filter((e) => !(e.from_status === null && NO_RESPONSE_STATUSES.includes(e.to_status as ApplicationStatus))),
      { from_status: null, to_status: newStatus, changed_at },
    ];
  }
  return [...events, { from_status: currentStatus, to_status: newStatus, changed_at }];
}
