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
  TEXT_H2,
  TEXT_H3,
  TEXT_MUTED,
} from "@/lib/ui";
import { DatePicker } from "@/components/date-picker";
import type { ApplicationRecord } from "@/lib/types";
import { STATUS } from "@/lib/statuses";

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function days(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "same day";
  return `${value}d`;
}

// ── Insight cards ────────────────────────────────────────────────────────────

type InsightVariant = "good" | "warn" | "info";

type Insight = {
  variant: InsightVariant;
  icon: string;
  title: string;
  body: string;
};

function buildInsights(analytics: ReturnType<typeof computeAnalytics>, applications: ApplicationRecord[]): Insight[] {
  const insights: Insight[] = [];

  // Good: best-performing source by interview conversion
  const sources = analytics.sourceStats.filter((s) => s.total >= 2);
  if (sources.length >= 2) {
    const sorted = [...sources].sort((a, b) => b.interviewRate - a.interviewRate);
    const best = sorted[0];
    const rest = sorted.slice(1);
    const avgOthers = rest.reduce((s, r) => s + r.interviewRate, 0) / rest.length;
    if (best.interviewRate > 0 && avgOthers > 0) {
      const multiplier = (best.interviewRate / avgOthers).toFixed(1);
      insights.push({
        variant: "good",
        icon: "★",
        title: `${best.source} converts best`,
        body: `${pct(best.interviewRate)} interview rate — ${multiplier}× higher than other sources.`,
      });
    }
  }

  // Warn: stalled applications (applied/ghosted for 21+ days)
  const today = new Date();
  const stalledApps = applications.filter((a) => {
    if (a.status !== STATUS.applied && a.status !== STATUS.ghosted) return false;
    if (!a.applied_on) return false;
    const appliedDate = new Date(a.applied_on);
    const diffDays = (today.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 21;
  });
  if (stalledApps.length > 0) {
    insights.push({
      variant: "warn",
      icon: "⏱",
      title: `${stalledApps.length} application${stalledApps.length > 1 ? "s" : ""} going cold`,
      body: `${stalledApps.length > 1 ? "These applications have" : "This application has"} had no activity for 21+ days.`,
    });
  }

  // Info: interview rate
  if (analytics.interviewRate !== null && analytics.totalApplications >= 3) {
    insights.push({
      variant: "info",
      icon: "📊",
      title: `Interview rate is ${pct(analytics.interviewRate)}`,
      body: analytics.offerFromInterviewRate !== null
        ? `${pct(analytics.offerFromInterviewRate)} of interviews result in an offer.`
        : `Based on ${analytics.totalApplications} applications.`,
    });
  }

  return insights.slice(0, 3);
}

function InsightCard({ insight }: { insight: Insight }) {
  const colors: Record<InsightVariant, { bg: string; border: string; icon: string }> = {
    good: {
      bg: "color-mix(in oklch, var(--st-offer) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--st-offer) 35%, transparent)",
      icon: "color-mix(in oklch, var(--st-offer) 90%, white 10%)",
    },
    warn: {
      bg: "color-mix(in oklch, var(--st-ghosted) 10%, var(--surface))",
      border: "color-mix(in oklch, var(--st-ghosted) 40%, transparent)",
      icon: "color-mix(in oklch, var(--st-ghosted) 90%, black 5%)",
    },
    info: {
      bg: "color-mix(in oklch, var(--accent) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--accent) 30%, transparent)",
      icon: "var(--accent)",
    },
  };
  const c = colors[insight.variant];

  return (
    <div
      className="rounded-xl border p-4 flex gap-3"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        style={{ background: c.border, color: c.icon }}
      >
        {insight.icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-snug">{insight.title}</p>
        <p className="text-[12.5px] text-ink-2 mt-0.5">{insight.body}</p>
      </div>
    </div>
  );
}

// ── KPI stat card ────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
};

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="rounded-xl bg-surface-2 border border-border-base p-4 mobile:p-3">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-1.5">{label}</p>
      <p
        className="font-mono text-[30px] font-semibold leading-none mobile:text-2xl"
        style={{ fontFeatureSettings: '"tnum"', color: accent ? "var(--accent)" : "var(--text)" }}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-ink-3 mt-1">{sub}</p>}
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
  const insights = useMemo(() => buildInsights(analytics, filtered), [analytics, filtered]);

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

      {/* ── Insight cards ─────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mobile:grid-cols-1">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}

      {/* ── KPI tiles ─────────────────────────────────────── */}
      <section>
        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Overview</h2>
          <div className="grid grid-cols-4 gap-3 mobile:grid-cols-2">
            <StatCard label="Total Applied" value={String(a.totalApplications)} />
            <StatCard label="Open" value={String(a.activeCount)} />
            <StatCard label="Interview Rate" value={pct(a.interviewRate)} accent />
            <StatCard label="Avg. First Response" value={days(a.avgDaysToFirstResponse)} />
          </div>
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
