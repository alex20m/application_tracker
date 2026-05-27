"use client";

import { useMemo, useState } from "react";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import {
  CARD,
  SECTION_STACK,
  TEXT_H2,
  TEXT_H3,
  TEXT_BODY,
  TEXT_META,
  TEXT_MUTED,
} from "@/lib/ui";
import type { ApplicationRecord } from "@/lib/types";

type TimePeriod = 30 | 60 | 90 | 180 | 365 | null;

const PERIODS: { label: string; value: TimePeriod }[] = [
  { label: "All time", value: null },
  { label: "30 days", value: 30 },
  { label: "3 months", value: 90 },
  { label: "6 months", value: 180 },
  { label: "1 year", value: 365 },
];

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
  const [period, setPeriod] = useState<TimePeriod>(null);

  const filtered = useMemo(() => {
    if (period === null) return applications;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return applications.filter(
      (a) => a.applied_on !== null && a.applied_on >= cutoffStr
    );
  }, [applications, period]);

  const analytics = useMemo(() => computeAnalytics(filtered), [filtered]);

  if (analytics.totalApplications === 0) {
    return (
      <div className={`${CARD} py-16 text-center`}>
        <p className={`${TEXT_H3} mb-2`}>
          {period !== null ? "No applications in this period" : "No data yet"}
        </p>
        <p className={TEXT_MUTED}>
          {period !== null
            ? "Try a longer time range or switch to All time."
            : "Start adding applications to see your analytics."}
        </p>
      </div>
    );
  }

  const a = analytics;

  return (
    <div className={SECTION_STACK}>
      {/* Time period filter */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={String(p.value)}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition mobile:min-h-9 ${
              period === p.value
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className={`${TEXT_META} self-center ml-1`}>
          {a.totalApplications} application{a.totalApplications !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Overview KPIs ──────────────────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Overview</h2>
        <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
          <StatCard
            label="Total Applied"
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
            sub={`${a.offeredCount} offer${a.offeredCount !== 1 ? "s" : ""}`}
            accent
          />
        </div>
      </section>

      {/* ── Stage-by-stage conversion ──────────────────────── */}
      <section>
        <h2 className={`${TEXT_H2} mb-3`}>Stage Conversions</h2>
        <div className={CARD}>
          {/* Applied → Interview block */}
          <div className="mb-4">
            <p className={`${TEXT_H3} mb-3 pb-2 border-b border-gray-100 dark:border-gray-800`}>
              From Applied
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mobile:grid-cols-1">
              {a.conversionRows.filter((r) => r.pctOfStage === null).map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className={`${TEXT_BODY} truncate`}>{row.label}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-8 text-right">
                      {row.count}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-10 text-right">
                      {row.pctOfApplied}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview → Offer block */}
          {a.interviewedCount > 0 && (
            <div>
              <p className={`${TEXT_H3} mb-3 pb-2 border-b border-gray-100 dark:border-gray-800`}>
                From Interview ({a.interviewedCount} reached)
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mobile:grid-cols-1">
                {a.conversionRows.filter((r) => r.pctOfStage !== null).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className={`${TEXT_BODY} truncate`}>{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-8 text-right">
                        {row.count}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-10 text-right">
                        {row.pctOfStage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={`${TEXT_META} mt-3 pt-2 border-t border-gray-100 dark:border-gray-800`}>
                Offer rate from total applied: <span className="font-semibold">{pct(a.overallOfferRate)}</span>
                &ensp;&middot;&ensp;
                Offer rate from interviews: <span className="font-semibold">{pct(a.offerFromInterviewRate)}</span>
              </p>
            </div>
          )}
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

      {/* ── Signal metrics ─────────────────────────────────── */}
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
            label="Offer / Interview"
            value={pct(a.offerFromInterviewRate)}
            sub={`${a.offeredCount} offer${a.offeredCount !== 1 ? "s" : ""} from ${a.interviewedCount} interviews`}
            accent={a.offerFromInterviewRate !== null && a.offerFromInterviewRate > 0}
          />
          <StatCard
            label="Withdrew"
            value={String(a.withdrewCount)}
            sub={a.interviewedCount > 0 ? `${Math.round((a.withdrewCount / a.interviewedCount) * 100)}% of interviewed` : undefined}
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
