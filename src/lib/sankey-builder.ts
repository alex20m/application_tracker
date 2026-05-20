import type { SankeyData } from "@/lib/types";
import type { ApplicationRecord, StatusEventRecord } from "@/lib/types";

export function buildSankeyData(
  applications: ApplicationRecord[],
  statusEvents: StatusEventRecord[]
): SankeyData {
  const apps = applications.filter((a) => !a.deleted_at && a.status !== "wishlist");
  const totalApps = apps.length;

  if (totalApps === 0) {
    return { nodes: [], links: [] };
  }

  // Purely event-driven.
  // Events with from_status=null represent the initial placement: applications → to_status.
  // All other events are deeper transitions: from_status → to_status.
  const transitionCounts = new Map<string, number>();
  statusEvents.forEach((event) => {
    const from = event.from_status ?? "applications";
    const to = event.to_status;
    if (!to || to === "wishlist") return;
    if (from === to) return;
    const key = `${from}→${to}`;
    transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
  });

  const nodes = new Set<string>(["applications"]);
  const links: Array<{ source: string; target: string; value: number }> = [];

  transitionCounts.forEach((count, key) => {
    const [from, to] = key.split("→");
    nodes.add(from);
    nodes.add(to);
    links.push({ source: from, target: to, value: count });
  });

  const nodeList = Array.from(nodes);
  const nodeIndex = new Map(nodeList.map((s, i) => [s, i]));

  return {
    nodes: nodeList.map((name) => ({ name })),
    links: links.map((l) => ({
      source: nodeIndex.get(l.source)!,
      target: nodeIndex.get(l.target)!,
      value: l.value,
    })),
  };
}
