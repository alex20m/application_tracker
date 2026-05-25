import { SANKEY_ROOT } from "@/lib/statuses";
import type { SankeyData } from "@/lib/types";
import type { ApplicationRecord } from "@/lib/types";

export function buildSankeyData(applications: ApplicationRecord[]): SankeyData {
  const apps = applications.filter((a) => a.status !== "wishlist");

  if (apps.length === 0) {
    return { nodes: [], links: [] };
  }

  // Flatten all events from all apps.
  // from_status=null means applications → to_status.
  const transitionCounts = new Map<string, number>();
  apps.forEach((app) => {
    (app.events || []).forEach((event) => {
      const from = event.from_status ?? SANKEY_ROOT;
      const to = event.to_status;
      if (!to || to === "wishlist" || from === "wishlist") return;
      if (from === to) return;
      const key = `${from}→${to}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    });
  });

  const nodes = new Set<string>([SANKEY_ROOT]);
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
