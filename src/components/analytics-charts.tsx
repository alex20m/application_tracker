"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CARD, TEXT_H2, TEXT_H3, TEXT_META } from "@/lib/ui";
import type { StatusCount, MonthlyEntry, FunnelStage } from "@/lib/analytics";

type Props = {
  statusCounts: StatusCount[];
  monthlyTrend: MonthlyEntry[];
  funnelStages: FunnelStage[];
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

export function AnalyticsCharts({ statusCounts, monthlyTrend, funnelStages }: Props) {
  return (
    <div className="space-y-4">
      {monthlyTrend.length > 1 && (
        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Applications Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-apps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-interviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-offers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke="#60a5fa"
                fill="url(#grad-apps)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="interviews"
                name="Interviews"
                stroke="#8b5cf6"
                fill="url(#grad-interviews)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="offers"
                name="Offers"
                stroke="#22c55e"
                fill="url(#grad-offers)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mobile:grid-cols-1">
        {statusCounts.length > 0 && (
          <div className={CARD}>
            <h2 className={`${TEXT_H2} mb-4`}>By Status</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={statusCounts}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [value, "Applications"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusCounts.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Pipeline</h2>
          <div className="space-y-4">
            {funnelStages.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={TEXT_H3}>{stage.label}</span>
                  <span className={TEXT_META}>
                    {stage.count} &middot; {stage.percentage}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
