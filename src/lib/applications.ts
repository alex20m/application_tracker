import { revalidatePath } from "next/cache";
import { STATUS, type ApplicationStatus } from "./statuses";
import type { StatusEvent } from "./types";

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
