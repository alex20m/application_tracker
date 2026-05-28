"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Sector,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Brush,
} from "recharts";
import type { PieSectorDataItem, PieSectorShapeProps } from "recharts";
import { CARD, TEXT_H2, TEXT_BODY, TEXT_META } from "@/lib/ui";
import type { StatusCount, DailyEntry, SourceStat } from "@/lib/analytics";

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

type Props = {
  statusCounts: StatusCount[];
  dailyTrend: DailyEntry[];
  sourceStats: SourceStat[];
};

export function AnalyticsCharts({ statusCounts, dailyTrend, sourceStats }: Props) {
  const TICK = { fontSize: 11, fill: "currentColor", opacity: 0.5 };
  const pieTotal = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [brushStart, setBrushStart] = useState(() => Math.max(0, dailyTrend.length - 60));
  const [brushEnd, setBrushEnd] = useState(() => Math.max(0, dailyTrend.length - 1));

  useEffect(() => {
    setBrushStart(Math.max(0, dailyTrend.length - 60));
    setBrushEnd(Math.max(0, dailyTrend.length - 1));
  }, [dailyTrend.length]);

  const visibleDays = Math.max(1, brushEnd - brushStart + 1);
  // Target ~12 labels; interval=N means label every (N+1)th tick. Min 0 = every day.
  const tickInterval = Math.max(0, Math.ceil(visibleDays / 12) - 1);

  // Reset when tapping/clicking outside the status card
  useEffect(() => {
    if (!isLocked) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsLocked(false);
        setActiveIndex(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isLocked]);

  const handleMouseEnter = (_: PieSectorDataItem, index: number) => {
    if (!isLocked) setActiveIndex(index);
  };
  const handleMouseLeave = () => {
    if (!isLocked) setActiveIndex(null);
  };
  const handleSliceClick = (_: PieSectorDataItem, index: number, e: React.MouseEvent<SVGGraphicsElement>) => {
    e.stopPropagation();
    if (isLocked && activeIndex === index) {
      setIsLocked(false);
      setActiveIndex(null);
    } else {
      setIsLocked(true);
      setActiveIndex(index);
    }
  };
  const handleLegendClick = (index: number) => {
    if (isLocked && activeIndex === index) {
      setIsLocked(false);
      setActiveIndex(null);
    } else {
      setIsLocked(true);
      setActiveIndex(index);
    }
  };

  const activeSlice = activeIndex !== null ? statusCounts[activeIndex] : null;
  const activePct = activeSlice ? Math.round((activeSlice.count / pieTotal) * 100) : null;

  // Use `shape` (renders every slice) instead of `activeShape` (recharts-internal)
  // so the pop-out is fully controlled by our state and doesn't get stuck on mobile.
  const pieShape = (props: PieSectorShapeProps, index: number) => (
    <Sector
      cx={props.cx}
      cy={props.cy}
      innerRadius={props.innerRadius}
      outerRadius={index === activeIndex ? props.outerRadius + 8 : props.outerRadius}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      fill={statusCounts[index]?.color ?? (props.fill as string)}
      cornerRadius={props.cornerRadius}
      strokeWidth={0}
      opacity={isLocked && activeIndex !== null && activeIndex !== index ? 0.35 : 1}
    />
  );

  return (
    <div className="space-y-4">
      {/* Daily trend with brush zoom */}
      {dailyTrend.length > 1 && (
        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Applications Over Time</h2>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval={tickInterval} />
              <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="linear" dataKey="applications" name="Applications" stroke="#60a5fa" fill="url(#grad-apps)" strokeWidth={2} dot={false} />
              <Area type="linear" dataKey="interviews" name="Interviews" stroke="#8b5cf6" fill="url(#grad-interviews)" strokeWidth={2} dot={false} />
              <Area type="linear" dataKey="offers" name="Offers" stroke="#22c55e" fill="url(#grad-offers)" strokeWidth={2} dot={false} />
              <Brush
                dataKey="label"
                startIndex={brushStart}
                endIndex={brushEnd}
                height={24}
                travellerWidth={6}
                stroke="#9ca3af"
                fill="rgba(156,163,175,0.08)"
                onChange={({ startIndex, endIndex }) => {
                  if (startIndex !== undefined && endIndex !== undefined) {
                    setBrushStart(startIndex);
                    setBrushEnd(endIndex);
                  }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status distribution + source performance */}
      <div className="grid grid-cols-2 gap-4 mobile:grid-cols-1">
        {statusCounts.length > 0 && (
          <div className={CARD} ref={cardRef}>
            <h2 className={`${TEXT_H2} mb-0.5`}>Current Status</h2>
            <p className={`${TEXT_META} mb-3`}>Where your applications stand right now</p>

            {/* Chart with center overlay */}
            <div
              className="relative outline-none select-none [&_svg]:outline-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
              onClick={() => {
                setIsLocked(false);
                setActiveIndex(null);
              }}
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusCounts}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    shape={pieShape}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleSliceClick}
                    style={{ cursor: "pointer" }}
                  >
                    {statusCounts.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center donut info */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {activeSlice ? (
                  <div className="text-center px-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {activeSlice.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activeSlice.count} · {activePct}%
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{pieTotal}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">total</p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom legend outside chart — no overlap on mobile */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
              {statusCounts.map((item, index) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => handleLegendClick(index)}
                  className={`flex items-center gap-1.5 text-xs transition-opacity ${
                    isLocked && activeIndex !== index ? "opacity-40" : "opacity-100"
                  } text-gray-700 dark:text-gray-300 hover:opacity-100`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Source performance */}
        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Source Performance</h2>
          {sourceStats.length === 0 ? (
            <p className={`${TEXT_META} text-center py-4`}>No applications yet</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
