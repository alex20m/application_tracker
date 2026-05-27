"use client";

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CARD, TEXT_H2, TEXT_BODY, TEXT_META } from "@/lib/ui";
import type { StatusCount, MonthlyEntry, SourceStat } from "@/lib/analytics";

// Custom tooltip avoids recharts default inline styles that ignore dark mode
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs shadow-md">
      {label && (
        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.name} className="text-gray-700 dark:text-gray-300">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ readonly payload: StatusCount }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{d.name}</p>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: d.color }} />
        {d.count} application{d.count !== 1 ? "s" : ""} · {pct}% of applied
      </p>
    </div>
  );
}

type Props = {
  statusCounts: StatusCount[];
  monthlyTrend: MonthlyEntry[];
  sourceStats: SourceStat[];
};

export function AnalyticsCharts({ statusCounts, monthlyTrend, sourceStats }: Props) {
  const TICK = { fontSize: 11, fill: "currentColor", opacity: 0.5 };
  const pieTotal = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      {/* Monthly trend */}
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
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#60a5fa" fill="url(#grad-apps)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="interviews" name="Interviews" stroke="#8b5cf6" fill="url(#grad-interviews)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="offers" name="Offers" stroke="#22c55e" fill="url(#grad-offers)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status distribution + source performance */}
      <div className="grid grid-cols-2 gap-4 mobile:grid-cols-1">
        {statusCounts.length > 0 && (
          <div className={CARD}>
            <h2 className={`${TEXT_H2} mb-0.5`}>Current Status</h2>
            <p className={`${TEXT_META} mb-4`}>Where your applications stand right now</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusCounts}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {statusCounts.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <PieTooltip {...props} total={pieTotal} />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => (
                    <span className="text-gray-700 dark:text-gray-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Source performance */}
        {sourceStats.length > 1 && (
          <div className={CARD}>
            <h2 className={`${TEXT_H2} mb-4`}>Source Performance</h2>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-500 dark:text-gray-400">Source</th>
                    <th className="text-right py-1.5 px-2 font-semibold text-gray-500 dark:text-gray-400">Applied</th>
                    <th className="text-right py-1.5 px-2 font-semibold text-gray-500 dark:text-gray-400">Interview%</th>
                    <th className="text-right py-1.5 px-2 font-semibold text-gray-500 dark:text-gray-400">Offer%</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceStats.map((s) => (
                    <tr key={s.source} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                      <td className={`py-1.5 px-2 ${TEXT_BODY} max-w-[120px] truncate`}>{s.source}</td>
                      <td className={`py-1.5 px-2 text-right ${TEXT_BODY}`}>{s.total}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${s.interviewRate >= 20 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {s.interviewRate}%
                      </td>
                      <td className={`py-1.5 px-2 text-right font-medium ${s.offerRate >= 10 ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {s.offerRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sourceStats.length === 0 && (
              <p className={`${TEXT_META} text-center py-4`}>No source data yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
