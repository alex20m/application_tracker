"use client";

import { ResponsiveContainer, Sankey, Tooltip } from "recharts";

import type { SankeyData } from "@/lib/types";

type SankeyChartProps = {
  data: SankeyData;
};

export function SankeyChart({ data }: SankeyChartProps) {
  if (!data.links.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-500">
        Not enough transitions yet. Update statuses in the Applications page to build
        flow data.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-[460px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodePadding={36}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          link={{ stroke: "#6366f1" }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
