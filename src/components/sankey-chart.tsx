"use client";

import { useEffect, useRef, useState } from "react";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import type { SankeyData } from "@/lib/types";
import { STATUS_LABELS, getStatusRankForDepth } from "@/lib/statuses";

type SankeyChartProps = { data: SankeyData };

const COLORS: Record<string, string> = {
  applications: "#60a5fa",
  no_answer: "#818cf8",
  withdrew: "#94a3b8",
  rejected: "#f87171",
  interviews: "#a78bfa",
  no_offer: "#fb923c",
  offer: "#34d399",
  accepted: "#22c55e",
  declined: "#fbbf24",
};

export function SankeyChart({ data }: SankeyChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data.nodes.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center text-sm text-slate-500">
        No applications yet. Create an application to see the flow.
      </div>
    );
  }

  if (!dims) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-[500px]" ref={ref} />
    );
  }

  const margin = 120;
  const width = dims.w;
  const height = dims.h;

  // Handle case with no links (only applications node)
  if (!data.links.length && data.nodes.length === 1) {
    const node = data.nodes[0];
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-[500px]">
        <div ref={ref} className="relative w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-indigo-50 px-6 py-4">
              <div className="w-4 h-16 rounded bg-indigo-500" />
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">Applications</div>
                <div className="text-xs text-slate-600 mt-1">
                  {data.nodes[0].name === "applications" ? "No transitions yet" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build sankey

  const sankeyGen = sankey<any, any>()
    .nodeWidth(16)
    .nodePadding(20)
    .nodeAlign(sankeyLeft)
    .nodeSort((a: any, b: any) => {
      // Only compare ordering inside the same column/level.
      if (a.depth !== b.depth) return 0;
      const ra =
        a.name === "applications"
          ? -1
          : getStatusRankForDepth(a.name, a.depth);
      const rb =
        b.name === "applications"
          ? -1
          : getStatusRankForDepth(b.name, b.depth);
      if (ra !== rb) return ra - rb;
      return String(a.name).localeCompare(String(b.name));
    })
    .extent([
      [margin, 20],
      [width - margin, height - 20],
    ]);

  const graph = sankeyGen({
    nodes: data.nodes.map((d) => ({ ...d })) as any,
    links: data.links.map((d) => ({ ...d })) as any,
  });

  // Compute total applications coming out of the root "applications" node
  // using the built graph to avoid relying on original index ordering.
  const appliedTotal =
    graph.links
      .filter((l: any) => (l.source as any)?.name === "applications")
      .reduce((s: number, l: any) => s + (l.value || 0), 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-[500px]">
      <div ref={ref} className="relative w-full h-full">
        <svg width={width} height={height}>
          {/* Links */}
          {graph.links.map((link, i) => {
            const src = link.source as any;
            const color = COLORS[src.name] || "#a5b4fc";
            return (
              <path
                key={i}
                d={sankeyLinkHorizontal()(link as any) || ""}
                fill="none"
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={Math.max(2, link.width || 2)}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node: any, i) => {
            const label =
              node.name === "applications" ? "Applications" :
              node.name === "no_answer" ? "No Answer" :
              (STATUS_LABELS[node.name as keyof typeof STATUS_LABELS] || node.name);
            const h = Math.max(node.y1 - node.y0, 1);
            const total = node.value || 0;

            // Percentage = flow from best parent / parent's total value (includes apps still in that stage).
            // Using parent.value (d3-sankey sets this to max(incoming, outgoing)) rather than
            // summing outgoing links, so apps that haven't transitioned out are still counted.
            const incomingLinks = graph.links.filter((l: any) => (l.target as any) === node);
            let pct = 0;
            if (incomingLinks.length > 0) {
              const best = incomingLinks.reduce((a: any, b: any) => ((a.value || 0) >= (b.value || 0) ? a : b));
              const parent = best.source as any;
              const parentTotal = parent.value || 0;
              if (parentTotal > 0) {
                pct = Math.round(((best.value || 0) / parentTotal) * 100);
              }
            }

            const sub = node.name === "applications" ? `${total}` : `${total} · ${pct}%`;
            const rightSide = node.x0 > width / 2;
            const lx = rightSide ? node.x0 - 8 : node.x1 + 8;
            const anchor = rightSide ? "end" : "start";

            return (
              <g key={i}>
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={node.x1 - node.x0}
                  height={h}
                  rx={3}
                  fill={COLORS[node.name] || "#6366f1"}
                  fillOpacity={0.9}
                />
                <text
                  x={lx}
                  y={node.y0 + h / 2 - 6}
                  textAnchor={anchor}
                  fontSize={12}
                  fill="#1e293b"
                  fontWeight={600}
                >
                  {label}
                </text>
                <text
                  x={lx}
                  y={node.y0 + h / 2 + 9}
                  textAnchor={anchor}
                  fontSize={11}
                  fill="#64748b"
                >
                  {sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
