"use client";

import { useEffect, useRef, useState } from "react";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import type { SankeyNode, SankeyLink, SankeyLinkMinimal } from "d3-sankey";
import type { SankeyData } from "@/lib/types";
import {
  STATUS_NAMES,
  STATUS_THEME,
  SANKEY_ROOT,
  SANKEY_ROOT_COLOR,
  SANKEY_ROOT_LABEL,
  getStatusRankForDepth,
  type ApplicationStatus,
} from "@/lib/statuses";

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

const MARGIN = 120;
const NODE_WIDTH = 16;
const NODE_PADDING = 20;
const CHART_HEIGHT = "h-[500px]";
const CHART_FRAME = `rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${CHART_HEIGHT}`;

// Module-level typed path generator — avoids an `any` cast in the render.
type LinkForPath = SankeyLinkMinimal<SankeyNode<NodeDatum, LinkDatum>, LinkDatum>;
const sankeyPath = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

function nodeColor(name: string): string {
  if (name === SANKEY_ROOT) return SANKEY_ROOT_COLOR;
  return STATUS_THEME[name as ApplicationStatus]?.sankey ?? "#6366f1";
}

function nodeLabel(name: string): string {
  if (name === SANKEY_ROOT) return SANKEY_ROOT_LABEL;
  return STATUS_NAMES[name as ApplicationStatus] ?? name;
}

// --- Sub-components ---

function EmptySankey() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center text-sm text-slate-500">
      No applications yet. Create an application to see the flow.
    </div>
  );
}

function SingleNodeSankey({
  node,
  containerRef,
}: {
  node: NodeDatum;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={CHART_FRAME}>
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-indigo-50 px-6 py-4">
            <div className="w-4 h-16 rounded bg-indigo-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">{SANKEY_ROOT_LABEL}</div>
              <div className="text-xs text-slate-600 mt-1">
                {node.name === SANKEY_ROOT ? "No transitions yet" : ""}
              </div>
            </div>
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
        rx={3}
        fill={nodeColor(node.name)}
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
}

function SankeyDiagram({
  data,
  dims,
  containerRef,
}: {
  data: SankeyData;
  dims: { w: number; h: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { w: width, h: height } = dims;

  const sankeyGen = sankey<NodeDatum, LinkDatum>()
    .nodeWidth(NODE_WIDTH)
    .nodePadding(NODE_PADDING)
    .nodeAlign(sankeyLeft)
    .nodeSort((a, b) => {
      if (a.depth !== b.depth) return 0;
      const ra = a.name === SANKEY_ROOT ? -1 : getStatusRankForDepth(a.name as ApplicationStatus, a.depth ?? 0);
      const rb = b.name === SANKEY_ROOT ? -1 : getStatusRankForDepth(b.name as ApplicationStatus, b.depth ?? 0);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    })
    .extent([
      [MARGIN, 20],
      [width - MARGIN, height - 20],
    ]);

  // Cast is needed because d3-sankey types don't distinguish pre/post layout state.
  const graph = sankeyGen({
    nodes: data.nodes.map((d) => ({ ...d })),
    links: data.links.map((d) => ({ ...d })),
  }) as unknown as LayoutGraph;

  return (
    <div className={CHART_FRAME}>
      <div ref={containerRef} className="relative w-full h-full">
        <svg width={width} height={height}>
          {graph.links.map((link, i) => (
            <path
              key={i}
              d={sankeyPath(link as unknown as LinkForPath) || ""}
              fill="none"
              stroke={nodeColor(link.source.name)}
              strokeOpacity={0.4}
              strokeWidth={Math.max(2, link.width)}
            />
          ))}

          {graph.nodes.map((node, i) => (
            <SankeyNodeShape key={i} node={node} graph={graph} width={width} />
          ))}
        </svg>
      </div>
    </div>
  );
}

// --- Top-level dispatcher ---

type SankeyChartProps = { data: SankeyData };

export function SankeyChart({ data }: SankeyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data.nodes.length) {
    return <EmptySankey />;
  }

  if (!dims) {
    return (
      <div className={CHART_FRAME} ref={containerRef} />
    );
  }

  if (!data.links.length && data.nodes.length === 1) {
    return <SingleNodeSankey node={data.nodes[0]} containerRef={containerRef} />;
  }

  return <SankeyDiagram data={data} dims={dims} containerRef={containerRef} />;
}
