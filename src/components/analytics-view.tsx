"use client";

import { useMemo, useState } from "react";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import {
  BTN_GHOST,
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isAllTime = startDate === "" && endDate === "";

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

  if (analytics.totalApplications === 0) {
    const hasFilter = !isAllTime;
    return (
      <>
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStart={setStartDate}
          onEnd={setEndDate}
          onClear={() => { setStartDate(""); setEndDate(""); }}
          isAllTime={isAllTime}
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
        startDate={startDate}
        endDate={endDate}
        onStart={setStartDate}
        onEnd={setEndDate}
        onClear={() => { setStartDate(""); setEndDate(""); }}
        isAllTime={isAllTime}
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
            label="Response Rate"
            value={pct(a.responseRate)}
            sub={`${a.stillWaitingCount} no response`}
          />
          <StatCard
            label="Interview Rate"
            value={pct(a.interviewRate)}
            sub={`${a.interviewedCount} reached interviews`}
            accent
          />
          <StatCard
            label="Overall Offer Rate"
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
            label="Ghosted (30+ days)"
            value={String(a.ghostCount)}
            sub={a.ghostRate !== null ? `${Math.round(a.ghostRate * 100)}% of applied` : undefined}
            warn={a.ghostCount > 0}
          />
          <StatCard
            label="Rejected Before Interview"
            value={String(a.rejectedBeforeInterviewCount)}
            sub={pct(a.rejectionBeforeInterviewRate) + " of applied"}
          />
          <StatCard
            label="No Response Rate"
            value={pct(a.noResponseRate)}
            sub={`${a.stillWaitingCount} still waiting`}
          />
          <StatCard
            label="Active Applications"
            value={String(a.activeCount)}
            sub="applied / interviews / offer"
          />
        </div>
      </section>

      {/* ── Interview details ───────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Interviews</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Reached Interview"
            value={String(a.interviewedCount)}
            sub={pct(a.interviewRate) + " of applied"}
            accent
          />
          <StatCard
            label="Currently Interviewing"
            value={String(a.currentlyInterviewingCount)}
            sub="in interview stage now"
          />
          <StatCard
            label="Rejected at Interview"
            value={String(a.noOfferCount)}
            sub={
              a.interviewedCount > 0
                ? `${Math.round((a.noOfferCount / a.interviewedCount) * 100)}% of interviewed`
                : undefined
            }
          />
          <StatCard
            label="Withdrew"
            value={String(a.withdrewCount)}
            sub={
              a.interviewedCount > 0
                ? `${Math.round((a.withdrewCount / a.interviewedCount) * 100)}% of interviewed`
                : undefined
            }
          />
        </div>
      </section>

      {/* ── Offer details ───────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Offers</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Offers Received"
            value={String(a.offeredCount)}
            sub={pct(a.overallOfferRate) + " of applied"}
            accent={a.offeredCount > 0}
          />
          <StatCard
            label="Currently at Offer Stage"
            value={String(a.currentlyOfferCount)}
            sub="awaiting decision"
          />
          <StatCard
            label="Offer / Interview"
            value={pct(a.offerFromInterviewRate)}
            sub={`of ${a.interviewedCount} interview${a.interviewedCount !== 1 ? "s" : ""}`}
            accent={a.offerFromInterviewRate !== null && a.offerFromInterviewRate > 0}
          />
          <StatCard
            label="Avg. Applied → Offer"
            value={days(a.avgDaysToOffer)}
            sub="total days from apply to offer"
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
    </div>
  );
}

type DateFilterProps = {
  startDate: string;
  endDate: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onClear: () => void;
  isAllTime: boolean;
};

function DateFilter({ startDate, endDate, onStart, onEnd, onClear, isAllTime }: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mobile:gap-2">
      <div className="flex items-center gap-2 mobile:flex-1">
        <label className={`${LABEL} whitespace-nowrap`}>From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStart(e.target.value)}
          max={endDate || undefined}
          className={`${INPUT} max-w-[10rem] mobile:max-w-none`}
        />
      </div>
      <span className="text-gray-400 dark:text-gray-500 text-sm mobile:hidden">—</span>
      <div className="flex items-center gap-2 mobile:flex-1">
        <label className={`${LABEL} whitespace-nowrap`}>To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEnd(e.target.value)}
          min={startDate || undefined}
          className={`${INPUT} max-w-[10rem] mobile:max-w-none`}
        />
      </div>
      {!isAllTime && (
        <button type="button" onClick={onClear} className={BTN_GHOST}>
          All time
        </button>
      )}
    </div>
  );
}
