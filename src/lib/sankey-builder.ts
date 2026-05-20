import type { SankeyData } from "@/lib/types";
import type { ApplicationRecord, StatusEventRecord } from "@/lib/types";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/statuses";

export function buildSankeyData(
  applications: ApplicationRecord[],
  statusEvents: StatusEventRecord[]
): SankeyData {
  // Build a set of unique statuses that appear in the data
  const statusesSet = new Set<ApplicationStatus>();
  
  statusEvents.forEach((e) => {
    if (e.from_status) {
      statusesSet.add(e.from_status);
    }
    statusesSet.add(e.to_status);
  });

  // Add all statuses to ensure all possible values are represented
  APPLICATION_STATUSES.forEach((s) => statusesSet.add(s));

  const statusList = Array.from(statusesSet).sort();
  const statusToIndex = new Map(statusList.map((s, i) => [s, i]));

  // Count transitions
  const transitionCounts = new Map<string, number>();
  statusEvents.forEach((event) => {
    if (event.from_status) {
      const key = `${event.from_status}→${event.to_status}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    }
  });

  // Build links
  const links: Array<{ source: number; target: number; value: number }> = [];
  Array.from(transitionCounts.entries()).forEach(([key, count]) => {
    const [from, to] = key.split("→");
    const sourceIdx = statusToIndex.get(from as ApplicationStatus) ?? -1;
    const targetIdx = statusToIndex.get(to as ApplicationStatus) ?? -1;

    if (sourceIdx !== -1 && targetIdx !== -1) {
      links.push({
        source: sourceIdx,
        target: targetIdx,
        value: count,
      });
    }
  });

  return {
    nodes: statusList.map((s) => ({ name: s })),
    links,
  };
}
