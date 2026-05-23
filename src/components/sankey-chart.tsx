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
  SANKEY_ROOT_COLOR_DARK,
  SANKEY_ROOT_LABEL,
  getStatusRankForDepth,
  type ApplicationStatus,
} from "@/lib/statuses";
import { useIsMobile } from "@/hooks/use-is-mobile";

type NodeDatum = { name: string };
type LinkDatum = { value: number };

// After layout, d3-sankey mutates input objects with position fields.
// These types represent the actual runtime structure post-layout.
type LayoutNode = SankeyNode<NodeDatum, LinkDatum> & NodeDatum & {
  x0: number; x1: number; y0: number; y1: number;
  depth: number; value: number;
};
type LayoutLink = SankeyLink<NodeDatum, LinkDatum> & {
  source: LayoutNode; target: LayoutNode;
  width: number;
};
type LayoutGraph = { nodes: LayoutNode[]; links: LayoutLink[] };

const NODE_WIDTH = 16;
const CHART_FRAME = "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm h-[500px] mobile:h-[360px]";

// Module-level typed path generator — avoids an `any` cast in the render.
type LinkForPath = SankeyLinkMinimal<SankeyNode<NodeDatum, LinkDatum>, LinkDatum>;
const sankeyPath = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

function nodeColor(name: string, dark: boolean): string {
  if (name === SANKEY_ROOT) return dark ? SANKEY_ROOT_COLOR_DARK : SANKEY_ROOT_COLOR;
  const theme = STATUS_THEME[name as ApplicationStatus];
  if (!theme) return dark ? "#818cf8" : "#6366f1";
  return dark ? theme.sankeyDark : theme.sankey;
}

function nodeLabel(name: string): string {
  if (name === SANKEY_ROOT) return SANKEY_ROOT_LABEL;
  return STATUS_NAMES[name as ApplicationStatus] ?? name;
}

// --- Inner content components (no outer frame — rendered inside the stable CHART_FRAME div) ---

function EmptyContent() {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
      No applications yet. Create an application to see the flow.
    </div>
  );
}

function SingleNodeContent({ node }: { node: NodeDatum }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="inline-flex items-center gap-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-4">
        <div className="w-4 h-16 rounded bg-indigo-500 dark:bg-indigo-400" />
        <div className="text-left">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{SANKEY_ROOT_LABEL}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
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
  isMobile,
  dark,
}: {
  node: LayoutNode;
  graph: LayoutGraph;
  width: number;
  isMobile: boolean;
  dark: boolean;
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
        fill={nodeColor(node.name, dark)}
        fillOpacity={1}
      />
      <text
        x={lx}
        y={node.y0 + h / 2 - 6}
        textAnchor={anchor}
        fontSize={isMobile ? 10 : 12}
        fill="var(--foreground)"
        fontWeight={600}
      >
        {label}
      </text>
      <text
        x={lx}
        y={node.y0 + h / 2 + 9}
        textAnchor={anchor}
        fontSize={isMobile ? 9 : 11}
        fill="var(--foreground)"
        fillOpacity={dark ? 0.85 : 0.65}
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
  const nodePadding = isMobile ? 12 : 20;

  const sankeyGen = sankey<NodeDatum, LinkDatum>()
    .nodeWidth(NODE_WIDTH)
    .nodePadding(nodePadding)
    .nodeAlign(sankeyLeft)
    .nodeSort((a, b) => {
      if (a.depth !== b.depth) return 0;
      const ra = a.name === SANKEY_ROOT ? -1 : getStatusRankForDepth(a.name as ApplicationStatus, a.depth ?? 0);
      const rb = b.name === SANKEY_ROOT ? -1 : getStatusRankForDepth(b.name as ApplicationStatus, b.depth ?? 0);
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

  return (
    <div className="relative w-full h-full">
      <svg width={width} height={height}>
        {graph.links.map((link, i) => (
          <path
            key={i}
            d={sankeyPath(link as unknown as LinkForPath) || ""}
            fill="none"
            stroke={nodeColor(link.source.name, dark)}
            strokeOpacity={dark ? 0.7 : 0.4}
            strokeWidth={Math.max(2, link.width)}
          />
        ))}

        {graph.nodes.map((node, i) => (
          <SankeyNodeShape key={i} node={node} graph={graph} width={width} isMobile={isMobile} dark={dark} />
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
    <div className={CHART_FRAME} ref={containerRef}>
      {content}
    </div>
  );
}
