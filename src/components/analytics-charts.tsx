"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ResponsiveContainer,
  Cell,
  Brush,
} from "recharts";
import type { PieSectorDataItem, PieSectorShapeProps } from "recharts";
import { CARD, TEXT_H2, TEXT_BODY, TEXT_META } from "@/lib/ui";
import type { StatusCount, DailyEntry, SourceStat } from "@/lib/analytics";
import { STATUS, STATUS_THEME } from "@/lib/statuses";
import { useIsMobile } from "@/hooks/use-is-mobile";

type TrendKey = Exclude<keyof DailyEntry, "date" | "label">;

const TREND_SERIES: Array<{ key: TrendKey; name: string; color: string }> = [
  { key: "applied",           name: "Applied",             color: STATUS_THEME[STATUS.applied].sankey },
  { key: "interviews",        name: "Interviews",          color: STATUS_THEME[STATUS.interviews].sankey },
  { key: "offers",            name: "Offers",              color: STATUS_THEME[STATUS.offer].sankey },
  { key: "ghosted",           name: "Ghosted",             color: STATUS_THEME[STATUS.ghosted].sankey },
  { key: "rejectedByCompany", name: "Rejected by company", color: STATUS_THEME[STATUS.rejected].sankey },
  { key: "rejectedByMe",      name: "Rejected by me",      color: STATUS_THEME[STATUS.withdrew].sankey },
];

type TrendSeries = typeof TREND_SERIES[number];

function applyJitter(
  data: DailyEntry[],
  series: TrendSeries[],
  step: number,
): Array<Record<string, number | string | null>> {
  return data.map(entry => {
    const out: Record<string, number | string | null> = { ...entry };
    const byValue = new Map<number, TrendSeries[]>();
    for (const s of series) {
      const raw = entry[s.key];
      if (raw === null) { out[`${s.key}_jitter`] = null; continue; }
      const bucket = byValue.get(raw) ?? [];
      bucket.push(s);
      byValue.set(raw, bucket);
    }
    for (const [val, group] of byValue) {
      if (group.length <= 1 || val === 0) {
        for (const s of group) out[`${s.key}_jitter`] = val;
      } else {
        const start = val - step * (group.length - 1) / 2;
        group.forEach((s, i) => { out[`${s.key}_jitter`] = start + i * step; });
      }
    }
    return out;
  });
}

function BrushTraveller({
  x, y, width, height,
}: {
  x: number; y: number; width: number; height: number;
}) {
  const cx = x + width / 2;
  const pillH = 16;
  const pillW = 4;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="transparent" />
      <rect
        x={cx - pillW / 2}
        y={y + (height - pillH) / 2}
        width={pillW}
        height={pillH}
        rx={2}
        fill="var(--border-2, #9ca3af)"
      />
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string; payload?: Record<string, number> }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p) => p.value !== null);
  if (!visible.length) return null;
  return (
    <div className="rounded-xl border border-border-base bg-surface px-3 py-2 text-xs shadow-md">
      {label && (
        <p className="font-semibold text-ink mb-1">{label}</p>
      )}
      {visible.map((p) => {
        const realKey = p.dataKey?.endsWith("_jitter") ? p.dataKey.slice(0, -7) : undefined;
        const value = realKey && p.payload ? (p.payload[realKey] ?? p.value) : p.value;
        return (
          <p key={p.name} className="text-ink-2">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
            {p.name}: <span className="font-medium">{value}</span>
          </p>
        );
      })}
    </div>
  );
}

type TrendProps = {
  dailyTrend: DailyEntry[];
};

export function ApplicationsTrendChart({ dailyTrend }: TrendProps) {
  const TICK = { fontSize: 11, fill: "var(--text-3)", opacity: 1 };
  const isMobile = useIsMobile();

  const { visibleSeries, jitterData } = useMemo(() => {
    const lastEntry = dailyTrend.at(-1);
    const visible = TREND_SERIES.filter(s => (lastEntry?.[s.key] ?? 0) > 0);
    const maxValue = dailyTrend.reduce((m, e) => {
      for (const s of visible) m = Math.max(m, e[s.key] ?? 0);
      return m;
    }, 1);
    const jitterStep = Math.max(0.3, maxValue * 0.015);
    return { visibleSeries: visible, jitterData: applyJitter(dailyTrend, visible, jitterStep) };
  }, [dailyTrend]);

  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd, setBrushEnd] = useState(() => Math.max(0, dailyTrend.length - 1));

  const maxIdx = Math.max(0, dailyTrend.length - 1);
  const safeStart = Math.min(brushStart, maxIdx);
  const safeEnd = Math.min(brushEnd, maxIdx);
  const visibleDays = Math.max(1, safeEnd - safeStart + 1);
  const labelTarget = isMobile ? 5 : 12;
  const tickInterval = Math.max(0, Math.ceil(visibleDays / labelTarget) - 1);

  if (dailyTrend.length <= 1) return null;

  return (
    <div className={CARD}>
      <h2 className={`${TEXT_H2} mb-3`}>Applications Over Time</h2>

      {visibleSeries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          {visibleSeries.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="overflow-hidden">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 270}>
          <AreaChart data={jitterData} margin={{ top: 4, right: 20, left: -20, bottom: 0 }}>
            <defs>
              {visibleSeries.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-2)", strokeWidth: 1.5 }} />
            {visibleSeries.map((s) => (
              <Area
                key={s.key}
                type="linear"
                dataKey={`${s.key}_jitter`}
                name={s.name}
                stroke={s.color}
                fill={`url(#grad-${s.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: s.color, stroke: "var(--surface)", strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
            <Brush
              dataKey="label"
              startIndex={safeStart}
              endIndex={safeEnd}
              height={24}
              travellerWidth={isMobile ? 20 : 6}
              traveller={<BrushTraveller x={0} y={0} width={0} height={0} />}
              stroke="var(--border-2)"
              fill="var(--surface-2)"
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
    </div>
  );
}

type StatusSourceProps = {
  statusCounts: StatusCount[];
  sourceStats: SourceStat[];
};

export function StatusSourceCharts({ statusCounts, sourceStats }: StatusSourceProps) {
  const pieTotal = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
    <div className="grid grid-cols-2 gap-4 mobile:grid-cols-1">
      {statusCounts.length > 0 && (
        <div className={CARD} ref={cardRef}>
          <h2 className={`${TEXT_H2} mb-0.5`}>Current Status</h2>
          <p className={`${TEXT_META} mb-3`}>Where your applications stand right now</p>

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

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {activeSlice ? (
                <div className="text-center px-2">
                  <p className="text-sm font-semibold text-ink leading-tight">
                    {activeSlice.name}
                  </p>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {activeSlice.count} · {activePct}%
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink">{pieTotal}</p>
                  <p className="text-xs text-ink-3">total</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
            {statusCounts.map((item, index) => (
              <button
                key={item.status}
                type="button"
                onClick={() => handleLegendClick(index)}
                className={`flex cursor-pointer items-center gap-1.5 text-xs transition-opacity ${
                  isLocked && activeIndex !== index ? "opacity-40" : "opacity-100"
                } text-ink-2 hover:opacity-100`}
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

      <div className={CARD}>
        <h2 className={`${TEXT_H2} mb-4`}>Source Performance</h2>
        {sourceStats.length === 0 ? (
          <p className={`${TEXT_META} text-center py-4`}>No applications yet</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-base">
                  <th className="text-left py-1.5 px-2 font-semibold text-ink-3">Source</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-ink-3">Applied</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-ink-3">Interview%</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-ink-3">Offer%</th>
                </tr>
              </thead>
              <tbody>
                {sourceStats.map((s) => (
                  <tr key={s.source} className="border-b border-border-base/50 last:border-0">
                    <td className={`py-1.5 px-2 ${TEXT_BODY} max-w-[120px] truncate`}>{s.source}</td>
                    <td className={`py-1.5 px-2 text-right ${TEXT_BODY}`}>{s.total}</td>
                    <td className={`py-1.5 px-2 text-right font-medium ${s.interviewRate >= 20 ? "text-accent-strong" : "text-ink-2"}`}>
                      {s.interviewRate}%
                    </td>
                    <td className={`py-1.5 px-2 text-right font-medium ${s.offerRate >= 10 ? "[color:var(--st-offer)]" : "text-ink-2"}`}>
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
  );
}
