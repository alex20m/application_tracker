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

  // Count transitions from no_answer onward
  const counts = new Map<string, number>();

  statusEvents.forEach((event) => {
    const from = event.from_status;
    const to = event.to_status;
    if (!from || from === "wishlist" || to === "wishlist") return;
    if (from === to) return;
    const key = `${from}→${to}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  // Count current status of each app to flow from no_answer
  const noAnswerOut = new Map<string, number>();
  apps.forEach((a) => {
    const s = a.status === "no_answer" ? "no_answer" : a.status;
    noAnswerOut.set(s, (noAnswerOut.get(s) || 0) + 1);
  });

  // Build node/link list
  // Fixed structure: applications → no_answer → (rest from status events)
  const nodes = new Set<string>(["applications", "no_answer"]);
  const links: Array<{ source: string; target: string; value: number }> = [];

  // applications → no_answer = total
  links.push({ source: "applications", target: "no_answer", value: totalApps });

  // no_answer → each non-no_answer status (from current app statuses)
  noAnswerOut.forEach((count, status) => {
    if (status === "no_answer") return;
    nodes.add(status);
    links.push({ source: "no_answer", target: status, value: count });
  });

  // further transitions (e.g. interviews → offer)
  counts.forEach((count, key) => {
    const [from, to] = key.split("→");
    if (from === "no_answer") return; // already handled above
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
