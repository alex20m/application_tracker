"use client";

import { useMemo, useState } from "react";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { AvgStageTime } from "@/components/avg-stage-time";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";
import {
  CARD,
  LABEL,
  SECTION_STACK,
  TEXT_H2,
  TEXT_H3,
  TEXT_META,
  TEXT_MUTED,
} from "@/lib/ui";
import { DatePicker } from "@/components/date-picker";
import type { ApplicationRecord } from "@/lib/types";

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function days(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "same day";
  return `${value}d`;
}

type StatCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={CARD}>
      <p className={`${TEXT_META} mb-1`}>{label}</p>
      <p
        className={`text-3xl font-bold mobile:text-2xl ${
          accent
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  applications: ApplicationRecord[];
};

export function AnalyticsView({ applications }: Props) {
  const [allTime, setAllTime] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isAllTime = allTime;

  const filtered = useMemo(() => {
    if (isAllTime) return applications;
    return applications.filter((a) => {
      if (!a.applied_on) return false;
      if (startDate && a.applied_on < startDate) return false;
      if (endDate && a.applied_on > endDate) return false;
      return true;
    });
  }, [applications, startDate, endDate, isAllTime]);

  const analytics = useMemo(() => computeAnalytics(filtered), [filtered]);
  const sankeyData = useMemo(() => buildSankeyData(filtered), [filtered]);

  if (analytics.totalApplications === 0) {
    const hasFilter = !isAllTime;
    return (
      <>
        <DateFilter
          allTime={allTime}
          onAllTime={setAllTime}
          startDate={startDate}
          endDate={endDate}
          onStart={setStartDate}
          onEnd={setEndDate}
        />
        <div className={`${CARD} py-16 text-center`}>
          <p className={`${TEXT_H3} mb-2`}>
            {hasFilter ? "No applications in this date range" : "No data yet"}
          </p>
          <p className={TEXT_MUTED}>
            {hasFilter
              ? "Adjust the date range or clear the filter to see all data."
              : "Start adding applications to see your analytics."}
          </p>
        </div>
      </>
    );
  }

  const a = analytics;

  return (
    <div className={SECTION_STACK}>
      {/* ── Date range filter ─────────────────────────────── */}
      <DateFilter
        allTime={allTime}
        onAllTime={setAllTime}
        startDate={startDate}
        endDate={endDate}
        onStart={setStartDate}
        onEnd={setEndDate}
      />

      {/* ── Overview ─────────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Overview</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Total Roles Applied"
            value={String(a.totalApplications)}
          />
          <StatCard
            label="Open Applications"
            value={String(a.activeCount)}
          />
          <StatCard
            label="Interview Rate"
            value={pct(a.interviewRate)}
            accent
          />
          <StatCard
            label="Avg. to First Response"
            value={days(a.avgDaysToFirstResponse)}
          />
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────── */}
      <section>
        <AnalyticsCharts
          statusCounts={a.statusCounts}
          dailyTrend={a.dailyTrend}
          sourceStats={a.sourceStats}
        />
      </section>

      {/* ── Stage Duration ──────────────────────────────────── */}
      <section>
        <AvgStageTime applications={filtered} />
      </section>

      {/* ── Application Flow ────────────────────────────────── */}
      <section>
        <SankeyChart data={sankeyData} />
      </section>
    </div>
  );
}

type DateFilterProps = {
  allTime: boolean;
  onAllTime: (v: boolean) => void;
  startDate: string;
  endDate: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
};

const PILL_ACTIVE =
  "cursor-pointer px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white";
const PILL_INACTIVE =
  "cursor-pointer px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

function DateFilter({ allTime, onAllTime, startDate, endDate, onStart, onEnd }: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mobile:gap-2">
      {/* Toggle pills — always visible */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
        <button
          type="button"
          onClick={() => onAllTime(true)}
          className={allTime ? PILL_ACTIVE : PILL_INACTIVE}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => onAllTime(false)}
          className={!allTime ? PILL_ACTIVE : PILL_INACTIVE}
        >
          Date range
        </button>
      </div>

      {/* Date pickers — only shown when date range is selected */}
      {!allTime && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-start" className={`${LABEL} whitespace-nowrap`}>From</label>
            <div className="w-36">
              <DatePicker
                value={startDate}
                onChange={onStart}
                max={endDate || undefined}
                className="mobile:py-2"
              />
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-sm mobile:hidden">—</span>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-end" className={`${LABEL} whitespace-nowrap`}>To</label>
            <div className="w-36">
              <DatePicker
                value={endDate}
                onChange={onEnd}
                min={startDate || undefined}
                className="mobile:py-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
