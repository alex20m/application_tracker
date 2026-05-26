import { revalidatePath } from "next/cache";
import { STATUS, type ApplicationStatus } from "./statuses";
import type { StatusEvent } from "./types";

export function revalidateApplicationViews() {
  revalidatePath("/applications");
  revalidatePath("/wishlist");
  revalidatePath("/sankey");
  revalidatePath("/analytics");
}

export function appendStatusEvent(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  events: StatusEvent[]
): StatusEvent[] {
  const changed_at = new Date().toISOString();
  if (currentStatus === STATUS.no_answer) {
    return [
      ...events.filter((e) => !(e.from_status === null && e.to_status === STATUS.no_answer)),
      { from_status: null, to_status: newStatus, changed_at },
    ];
  }
  return [...events, { from_status: currentStatus, to_status: newStatus, changed_at }];
}
