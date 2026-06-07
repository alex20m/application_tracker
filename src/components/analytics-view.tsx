"use client";

import { useMemo, useState } from "react";
import { computeAnalytics } from "@/lib/analytics";
import { ApplicationsTrendChart, StatusSourceCharts } from "@/components/analytics-charts";
import { AvgStageTime } from "@/components/avg-stage-time";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";
import {
  CARD,
  LABEL,
  SECTION_STACK,
  TEXT_H3,
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

// ── KPI stat card ────────────────────────────────────────────────────────────

type StatCardProps = { label: string; value: string; sub?: string };

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1.5"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <p className="text-[12.5px] text-ink-2">{label}</p>
      <p className="text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>
      {sub && <p className="text-[12.5px] text-ink-3">{sub}</p>}
    </div>
  );
}

// ── Date filter (segmented control) ─────────────────────────────────────────

type DateFilterProps = {
  allTime: boolean;
  onAllTime: (v: boolean) => void;
  startDate: string;
  endDate: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
};

function DateFilter({ allTime, onAllTime, startDate, endDate, onStart, onEnd }: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mobile:gap-2">
      <div className="flex items-center gap-[3px] rounded-[11px] border border-border-base bg-surface-2 p-[3px]">
        <button
          type="button"
          onClick={() => onAllTime(true)}
          className={[
            "cursor-pointer rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all",
            allTime
              ? "bg-surface shadow-sm font-semibold text-ink"
              : "text-ink-3 hover:text-ink-2",
          ].join(" ")}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => onAllTime(false)}
          className={[
            "cursor-pointer rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all",
            !allTime
              ? "bg-surface shadow-sm font-semibold text-ink"
              : "text-ink-3 hover:text-ink-2",
          ].join(" ")}
        >
          Date range
        </button>
      </div>

      {!allTime && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className={`${LABEL} whitespace-nowrap`}>From</label>
            <div className="w-36">
              <DatePicker
                value={startDate}
                onChange={onStart}
                max={endDate || undefined}
                className="mobile:py-2"
              />
            </div>
          </div>
          <span className="text-ink-3 text-sm mobile:hidden">—</span>
          <div className="flex items-center gap-2">
            <label className={`${LABEL} whitespace-nowrap`}>To</label>
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

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  applications: ApplicationRecord[];
};

export function AnalyticsView({ applications }: Props) {
  const [allTime, setAllTime] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    if (allTime) return applications;
    return applications.filter((a) => {
      if (!a.applied_on) return false;
      if (startDate && a.applied_on < startDate) return false;
      if (endDate && a.applied_on > endDate) return false;
      return true;
    });
  }, [applications, startDate, endDate, allTime]);

  const analytics = useMemo(() => computeAnalytics(filtered), [filtered]);
  const sankeyData = useMemo(() => buildSankeyData(filtered), [filtered]);
  if (analytics.totalApplications === 0) {
    const hasFilter = !allTime;
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

      {/* ── KPI tiles ─────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-4 gap-3 mobile:grid-cols-2">
          <StatCard
            label="Total applications"
            value={String(a.totalApplications)}
            sub="Total submitted"
          />
          <StatCard
            label="Open"
            value={String(a.activeCount)}
            sub="Active in pipeline"
          />
          <StatCard
            label="Interview rate"
            value={pct(a.interviewRate)}
            sub={a.offerFromInterviewRate !== null ? `${pct(a.offerFromInterviewRate)} of interviews lead to an offer` : undefined}
          />
          <StatCard
            label="Avg. first reply"
            value={days(a.avgDaysToFirstResponse)}
            sub="Average across applications"
          />
        </div>
      </section>

      {/* ── Application Flow ────────────────────────────────── */}
      <section>
        <SankeyChart data={sankeyData} />
      </section>

      {/* ── Applications Over Time ───────────────────────────── */}
      <section>
        <ApplicationsTrendChart dailyTrend={a.dailyTrend} />
      </section>

      {/* ── Current Status + Source Performance ─────────────── */}
      <section>
        <StatusSourceCharts
          statusCounts={a.statusCounts}
          sourceStats={a.sourceStats}
        />
      </section>

      {/* ── Stage Duration ──────────────────────────────────── */}
      <section>
        <AvgStageTime applications={filtered} />
      </section>
    </div>
  );
}
