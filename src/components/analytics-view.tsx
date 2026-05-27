"use client";

import { useMemo, useState } from "react";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";
import {
  CARD,
  INPUT,
  LABEL,
  SECTION_STACK,
  TEXT_H2,
  TEXT_H3,
  TEXT_META,
  TEXT_MUTED,
} from "@/lib/ui";
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
  sub?: string;
  accent?: boolean;
  warn?: boolean;
};

function StatCard({ label, value, sub, accent, warn }: StatCardProps) {
  return (
    <div className={CARD}>
      <p className={`${TEXT_META} mb-1`}>{label}</p>
      <p
        className={`text-3xl font-bold mobile:text-2xl ${
          accent
            ? "text-indigo-600 dark:text-indigo-400"
            : warn
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className={`${TEXT_META} mt-1`}>{sub}</p>}
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
            label="Applied"
            value={String(a.totalApplications)}
            sub={`${a.activeCount} still active`}
          />
          <StatCard
            label="Outstanding"
            value={String(a.activeCount - a.ghostCount)}
            sub="not in final state, not ghosted"
          />
          <StatCard
            label="Interview Rate"
            value={pct(a.interviewRate)}
            sub={`${a.interviewedCount} reached interviews`}
            accent
          />
          <StatCard
            label="Offer / Applied"
            value={pct(a.overallOfferRate)}
            sub={`${a.offeredCount} offer${a.offeredCount !== 1 ? "s" : ""} received`}
            accent
          />
        </div>
      </section>

      {/* ── Response times ─────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Response Times</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Avg. to First Response"
            value={days(a.avgDaysToFirstResponse)}
            sub="from applied date"
          />
          <StatCard
            label="Avg. to Interview"
            value={days(a.avgDaysToInterview)}
            sub="from applied date"
          />
          <StatCard
            label="Avg. to Offer"
            value={days(a.avgDaysToOffer)}
            sub="from applied date"
          />
          <StatCard
            label="Avg. Interview → Offer"
            value={days(a.avgDaysInterviewToOffer)}
            sub="from interview stage"
          />
        </div>
      </section>

      {/* ── Search quality ─────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Search Quality</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Offer / Interview"
            value={pct(a.offerFromInterviewRate)}
            sub={`of ${a.interviewedCount} interview${a.interviewedCount !== 1 ? "s" : ""}`}
            accent={a.offerFromInterviewRate !== null && a.offerFromInterviewRate > 0}
          />
          <StatCard
            label="Rejected Before Interview"
            value={String(a.rejectedBeforeInterviewCount)}
            sub={pct(a.rejectionBeforeInterviewRate) + " of applied"}
          />
          <StatCard
            label="No Offer After Interview"
            value={String(a.noOfferCount)}
            sub={
              a.interviewedCount > 0
                ? `${Math.round((a.noOfferCount / a.interviewedCount) * 100)}% of interviewed`
                : undefined
            }
          />
          <StatCard
            label="Ghosted (30+ days)"
            value={String(a.ghostCount)}
            sub={a.ghostRate !== null ? `${Math.round(a.ghostRate * 100)}% of applied` : undefined}
            warn={a.ghostCount > 0}
          />
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Breakdown</h2>
        <AnalyticsCharts
          statusCounts={a.statusCounts}
          monthlyTrend={a.monthlyTrend}
          sourceStats={a.sourceStats}
        />
      </section>

      {/* ── Application Flow ────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Application Flow</h2>
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
  "cursor-pointer px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white mobile:min-h-11 mobile:px-4 mobile:text-base";
const PILL_INACTIVE =
  "cursor-pointer px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mobile:min-h-11 mobile:px-4 mobile:text-base";

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

      {/* Date inputs — always visible but only active when date range is selected */}
      <div className="flex flex-wrap items-center gap-2 mobile:gap-2">
        <div className="flex items-center gap-2 mobile:flex-1">
          <label className={`${LABEL} whitespace-nowrap ${allTime ? "opacity-40" : ""}`}>From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStart(e.target.value)}
            max={endDate || undefined}
            disabled={allTime}
            className={`${INPUT} max-w-[10rem] mobile:max-w-none ${allTime ? "opacity-40 cursor-not-allowed" : ""}`}
          />
        </div>
        <span className={`text-gray-400 dark:text-gray-500 text-sm mobile:hidden ${allTime ? "opacity-40" : ""}`}>—</span>
        <div className="flex items-center gap-2 mobile:flex-1">
          <label className={`${LABEL} whitespace-nowrap ${allTime ? "opacity-40" : ""}`}>To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEnd(e.target.value)}
            min={startDate || undefined}
            disabled={allTime}
            className={`${INPUT} max-w-[10rem] mobile:max-w-none ${allTime ? "opacity-40 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
