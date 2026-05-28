import { revalidatePath } from "next/cache";
import { STATUS, type ApplicationStatus } from "./statuses";
import type { StatusEvent } from "./types";

export function revalidateApplicationViews() {
  revalidatePath("/applications");
  revalidatePath("/wishlist");

  revalidatePath("/analytics");
}

const APPLIED_LIKE: readonly ApplicationStatus[] = [STATUS.applied, STATUS.ghosted];

export function appendStatusEvent(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  events: StatusEvent[]
): StatusEvent[] {
  const changed_at = new Date().toISOString();
  if (APPLIED_LIKE.includes(currentStatus)) {
    return [
      ...events.filter((e) => !(e.from_status === null && APPLIED_LIKE.includes(e.to_status as ApplicationStatus))),
      { from_status: null, to_status: newStatus, changed_at },
    ];
  }
  return [...events, { from_status: currentStatus, to_status: newStatus, changed_at }];
}
