"use client";

import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import type { SankeyNode, SankeyLink, SankeyLinkMinimal } from "d3-sankey";
import type { SankeyData } from "@/lib/types";
import {
  STATUS_NAMES,
  STATUS_THEME,
  SANKEY_ROOT,
  SANKEY_ROOT_COLOR,
  SANKEY_ROOT_LABEL,
  getStatusRank,
  type ApplicationStatus,
} from "@/lib/statuses";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { CARD, TEXT_H2 } from "@/lib/ui";

type NodeDatum = { name: string };
type LinkDatum = { value: number };

// After layout, d3-sankey mutates input objects with position fields.
// These types represent the actual runtime structure post-layout.
type LayoutNode = SankeyNode<NodeDatum, LinkDatum> & NodeDatum & {
  x0: number; x1: number; y0: number; y1: number;
  depth: number; value: number;
  sourceLinks: LayoutLink[]; targetLinks: LayoutLink[];
};
type LayoutLink = SankeyLink<NodeDatum, LinkDatum> & {
  source: LayoutNode; target: LayoutNode;
  width: number;
};
type LayoutGraph = { nodes: LayoutNode[]; links: LayoutLink[] };

const NODE_WIDTH = 16;
const CHART_FRAME = `flex flex-col ${CARD} mobile:min-w-[640px]`;

// Module-level typed path generator — avoids an `any` cast in the render.
type LinkForPath = SankeyLinkMinimal<SankeyNode<NodeDatum, LinkDatum>, LinkDatum>;
const sankeyPath = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

function nodeColor(name: string): string {
  if (name === SANKEY_ROOT) return SANKEY_ROOT_COLOR;
  const theme = STATUS_THEME[name as ApplicationStatus];
  if (!theme) return "#6366f1";
  return theme.sankey;
}

function nodeLabel(name: string): string {
  if (name === SANKEY_ROOT) return SANKEY_ROOT_LABEL;
  return STATUS_NAMES[name as ApplicationStatus] ?? name;
}

// --- Inner content components (no outer frame — rendered inside the stable CHART_FRAME div) ---

function EmptyContent() {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
      No applications yet. Create an application to see the flow.
    </div>
  );
}

function SingleNodeContent({ node }: { node: NodeDatum }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="inline-flex items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-4">
        <div className="w-4 h-16 rounded bg-indigo-500 dark:bg-indigo-400" />
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{SANKEY_ROOT_LABEL}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {node.name === SANKEY_ROOT ? "No transitions yet" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function SankeyNodeShape({
  node,
  graph,
  width,
}: {
  node: LayoutNode;
  graph: LayoutGraph;
  width: number;
}) {
  const h = Math.max(node.y1 - node.y0, 1);
  const label = nodeLabel(node.name);
  const total = node.value;

  const incomingLinks = graph.links.filter((l) => l.target === node);
  let pct = 0;
  if (incomingLinks.length > 0) {
    const best = incomingLinks.reduce((a, b) => (a.value >= b.value ? a : b));
    const parentTotal = best.source.value;
    if (parentTotal > 0) {
      pct = Math.round((best.value / parentTotal) * 100);
    }
  }

  const sub = node.name === SANKEY_ROOT ? `${total}` : `${total} · ${pct}%`;
  const rightSide = node.x0 > width / 2;
  const lx = rightSide ? node.x0 - 8 : node.x1 + 8;
  const anchor = rightSide ? "end" : "start";

  return (
    <g>
      <rect
        x={node.x0}
        y={node.y0}
        width={node.x1 - node.x0}
        height={h}
        rx={4}
        fill={nodeColor(node.name)}
        fillOpacity={1}
      />
      <text
        x={lx}
        y={node.y0 + h / 2 - 6}
        textAnchor={anchor}
        fontSize={12}
        fill="var(--text)"
        fontWeight={600}
      >
        {label}
      </text>
      <text
        x={lx}
        y={node.y0 + h / 2 + 9}
        textAnchor={anchor}
        fontSize={11}
        fill="var(--text)"
      >
        {sub}
      </text>
    </g>
  );
}

function DiagramContent({
  data,
  dims,
  isMobile,
  dark,
}: {
  data: SankeyData;
  dims: { w: number; h: number };
  isMobile: boolean;
  dark: boolean;
}) {
  const { w: width, h: height } = dims;
  const margin = isMobile ? 60 : 120;
  const nodePadding = isMobile ? 16 : 20;

  const sankeyGen = sankey<NodeDatum, LinkDatum>()
    .nodeWidth(NODE_WIDTH)
    .nodePadding(nodePadding)
    .nodeAlign(sankeyLeft)
    .nodeSort((a, b) => {
      if (a.name === SANKEY_ROOT) return -1;
      if (b.name === SANKEY_ROOT) return 1;
      const ra = getStatusRank(a.name as ApplicationStatus);
      const rb = getStatusRank(b.name as ApplicationStatus);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    })
    .extent([
      [margin, 20],
      [width - margin, height - 20],
    ]);

  // Cast is needed because d3-sankey types don't distinguish pre/post layout state.
  const graph = sankeyGen({
    nodes: data.nodes.map((d) => ({ ...d })),
    links: data.links.map((d) => ({ ...d })),
  }) as unknown as LayoutGraph;

  // d3-sankey's relaxation re-sorts links by intermediate (pre-resolveCollisions)
  // node positions, which can be swapped relative to the final layout — causing
  // visually crossing bands even with a correct nodeSort. Fix: re-sort by the
  // final y0 values and recompute link y0/y1 so the stacking matches column order.
  for (const node of graph.nodes) {
    node.sourceLinks.sort((a, b) => (a.target as LayoutNode).y0 - (b.target as LayoutNode).y0);
    node.targetLinks.sort((a, b) => (a.source as LayoutNode).y0 - (b.source as LayoutNode).y0);
  }
  for (const node of graph.nodes) {
    let sy = node.y0;
    let ty = node.y0;
    for (const link of node.sourceLinks) { link.y0 = sy + link.width / 2; sy += link.width; }
    for (const link of node.targetLinks) { link.y1 = ty + link.width / 2; ty += link.width; }
  }

  return (
    <div className="relative w-full h-full">
      <svg width={width} height={height}>
        {graph.links.map((link, i) => (
          <path
            key={i}
            d={sankeyPath(link as unknown as LinkForPath) || ""}
            fill="none"
            stroke={nodeColor(link.target.name)}
            strokeOpacity={dark ? 0.7 : 0.4}
            strokeWidth={Math.max(2, link.width)}
          />
        ))}

        {graph.nodes.map((node, i) => (
          <SankeyNodeShape key={i} node={node} graph={graph} width={width} />
        ))}
      </svg>
    </div>
  );
}

// --- Top-level dispatcher ---

type SankeyChartProps = { data: SankeyData };

export function SankeyChart({ data }: SankeyChartProps) {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const dark = resolvedTheme === "dark";

  // Callback ref (React 19): attaches ResizeObserver when the container mounts,
  // returns cleanup that disconnects it. The outer CHART_FRAME div is always
  // rendered so this ref fires exactly once regardless of data/dims state.
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let content: React.ReactNode;
  if (!data.nodes.length) {
    content = <EmptyContent />;
  } else if (!dims) {
    content = null;
  } else if (!data.links.length && data.nodes.length === 1) {
    content = <SingleNodeContent node={data.nodes[0]} />;
  } else {
    content = <DiagramContent data={data} dims={dims} isMobile={isMobile} dark={dark} />;
  }

  return (
    <div className="overflow-x-auto">
      <div className={CHART_FRAME}>
        <h2 className={`${TEXT_H2} mb-4 shrink-0`}>Application Flow</h2>
        <div className="relative h-[452px] mobile:h-[408px]" ref={containerRef}>
          {content}
        </div>
      </div>
    </div>
  );
}
