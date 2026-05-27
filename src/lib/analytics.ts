import type { ApplicationRecord } from "@/lib/types";
import { STATUS, STATUS_NAMES, STATUS_THEME, type ApplicationStatus } from "@/lib/statuses";

export type StatusCount = {
  status: ApplicationStatus;
  name: string;
  count: number;
  color: string;
};

export type MonthlyEntry = {
  month: string;
  label: string;
  applications: number;
  interviews: number;
  offers: number;
};

export type ConversionRow = {
  key: string;
  label: string;
  count: number;
  /** % of total applied (0–100) */
  pctOfApplied: number;
  /** % of the preceding stage (0–100), null when N/A */
  pctOfStage: number | null;
  stageLabel: string | null;
  color: string;
};

export type SourceStat = {
  source: string;
  total: number;
  interviewed: number;
  offered: number;
  interviewRate: number;
  offerRate: number;
};

export type AnalyticsResult = {
  // ── Core counts ───────────────────────────────────
  totalApplications: number;
  activeCount: number;

  // Stage counts
  stillWaitingCount: number;
  cancelledCount: number;
  rejectedBeforeInterviewCount: number;
  interviewedCount: number;
  withdrewCount: number;
  noOfferCount: number;
  offeredCount: number;

  // ── Rates (0–1) ──────────────────────────────────
  interviewRate: number | null;
  offerFromInterviewRate: number | null;
  overallOfferRate: number | null;
  rejectionBeforeInterviewRate: number | null;
  noResponseRate: number | null;
  responseRate: number | null;

  // ── Ghost (still no_answer after ≥30 days) ────────
  ghostCount: number;
  ghostRate: number | null;

  // ── Time metrics (days) ───────────────────────────
  avgDaysToFirstResponse: number | null;
  avgDaysToInterview: number | null;
  avgDaysToOffer: number | null;
  avgDaysInterviewToOffer: number | null;

  // ── Detailed stage conversion table ──────────────
  conversionRows: ConversionRow[];

  // ── Distribution & trend ─────────────────────────
  statusCounts: StatusCount[];
  monthlyTrend: MonthlyEntry[];

  // ── Source performance ────────────────────────────
  sourceStats: SourceStat[];
};

const INTERVIEWED_STATUSES: ApplicationStatus[] = [
  STATUS.interviews,
  STATUS.withdrew,
  STATUS.no_offer,
  STATUS.offer,
  STATUS.accepted,
  STATUS.declined,
];

const OFFERED_STATUSES: ApplicationStatus[] = [
  STATUS.offer,
  STATUS.accepted,
  STATUS.declined,
];

const ACTIVE_STATUSES: ApplicationStatus[] = [
  STATUS.no_answer,
  STATUS.interviews,
  STATUS.offer,
];

export function daysBetween(startDate: string, endTimestamp: string): number {
  const start = new Date(startDate + "T00:00:00.000Z");
  const end = new Date(endTimestamp);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en", { month: "short", year: "numeric" });
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

export function computeAnalytics(
  applications: ApplicationRecord[],
  today: Date = new Date()
): AnalyticsResult {
  const apps = applications.filter((a) => a.status !== STATUS.wishlist);
  const total = apps.length;

  // ── Stage counts ──────────────────────────────────────────────────────────
  const stillWaitingCount = apps.filter((a) => a.status === STATUS.no_answer).length;
  const cancelledCount = apps.filter((a) => a.status === STATUS.cancelled).length;
  const rejectedCount = apps.filter((a) => a.status === STATUS.rejected).length;
  const rejectedBeforeInterviewCount = cancelledCount + rejectedCount;
  const interviewedCount = apps.filter((a) => INTERVIEWED_STATUSES.includes(a.status)).length;
  const withdrewCount = apps.filter((a) => a.status === STATUS.withdrew).length;
  const noOfferCount = apps.filter((a) => a.status === STATUS.no_offer).length;
  const offeredCount = apps.filter((a) => OFFERED_STATUSES.includes(a.status)).length;
  const activeCount = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;

  // ── Ghost detection (no_answer for ≥30 days) ─────────────────────────────
  const todayMs = today.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const ghostCount = apps.filter((a) => {
    if (a.status !== STATUS.no_answer || !a.applied_on) return false;
    const appliedMs = new Date(a.applied_on + "T00:00:00.000Z").getTime();
    return todayMs - appliedMs >= thirtyDaysMs;
  }).length;

  // ── Time metrics ──────────────────────────────────────────────────────────
  const daysToFirstResponse: number[] = [];
  const daysToInterview: number[] = [];
  const daysToOffer: number[] = [];
  const daysInterviewToOffer: number[] = [];

  for (const app of apps) {
    if (!app.applied_on) continue;

    // When appendStatusEvent transitions out of no_answer, the null→no_answer event
    // is replaced by null→newStatus. So null-from with to_status ≠ no_answer = first response.
    const firstResponseEvent = app.events.find(
      (e) => e.from_status === null && e.to_status !== STATUS.no_answer
    );
    if (firstResponseEvent) {
      const d = daysBetween(app.applied_on, firstResponseEvent.changed_at);
      if (d >= 0) daysToFirstResponse.push(d);
    }

    const interviewEvent = app.events.find((e) => e.to_status === STATUS.interviews);
    if (interviewEvent) {
      const d = daysBetween(app.applied_on, interviewEvent.changed_at);
      if (d >= 0) daysToInterview.push(d);
    }

    const offerEvent = app.events.find((e) => e.to_status === STATUS.offer);
    if (offerEvent) {
      const d = daysBetween(app.applied_on, offerEvent.changed_at);
      if (d >= 0) daysToOffer.push(d);

      if (interviewEvent) {
        const gap = Math.floor(
          (new Date(offerEvent.changed_at).getTime() -
            new Date(interviewEvent.changed_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (gap >= 0) daysInterviewToOffer.push(gap);
      }
    }
  }

  // ── Conversion rows ───────────────────────────────────────────────────────
  const conversionRows: ConversionRow[] = [
    {
      key: "waiting",
      label: "No Response Yet",
      count: stillWaitingCount,
      pctOfApplied: pct(stillWaitingCount, total),
      pctOfStage: null,
      stageLabel: null,
      color: STATUS_THEME[STATUS.no_answer].sankey,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: cancelledCount,
      pctOfApplied: pct(cancelledCount, total),
      pctOfStage: null,
      stageLabel: null,
      color: STATUS_THEME[STATUS.cancelled].sankey,
    },
    {
      key: "rejected_before",
      label: "Rejected (no interview)",
      count: rejectedCount,
      pctOfApplied: pct(rejectedCount, total),
      pctOfStage: null,
      stageLabel: null,
      color: STATUS_THEME[STATUS.rejected].sankey,
    },
    {
      key: "interviews",
      label: "Got Interview",
      count: interviewedCount,
      pctOfApplied: pct(interviewedCount, total),
      pctOfStage: null,
      stageLabel: null,
      color: STATUS_THEME[STATUS.interviews].sankey,
    },
    {
      key: "withdrew",
      label: "Withdrew",
      count: withdrewCount,
      pctOfApplied: pct(withdrewCount, total),
      pctOfStage: pct(withdrewCount, interviewedCount),
      stageLabel: "of interviewed",
      color: STATUS_THEME[STATUS.withdrew].sankey,
    },
    {
      key: "no_offer",
      label: "Rejected after interview",
      count: noOfferCount,
      pctOfApplied: pct(noOfferCount, total),
      pctOfStage: pct(noOfferCount, interviewedCount),
      stageLabel: "of interviewed",
      color: STATUS_THEME[STATUS.no_offer].sankey,
    },
    {
      key: "offer",
      label: "Got Offer",
      count: offeredCount,
      pctOfApplied: pct(offeredCount, total),
      pctOfStage: pct(offeredCount, interviewedCount),
      stageLabel: "of interviewed",
      color: STATUS_THEME[STATUS.offer].sankey,
    },
  ];

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCountMap = new Map<ApplicationStatus, number>();
  for (const app of apps) {
    statusCountMap.set(app.status, (statusCountMap.get(app.status) || 0) + 1);
  }
  const statusCounts: StatusCount[] = [...statusCountMap.entries()]
    .map(([status, count]) => ({
      status,
      name: STATUS_NAMES[status],
      count,
      color: STATUS_THEME[status].sankey,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Monthly trend ─────────────────────────────────────────────────────────
  const monthlyMap = new Map<
    string,
    { applications: number; interviews: number; offers: number }
  >();
  for (const app of apps) {
    if (!app.applied_on) continue;
    const month = app.applied_on.slice(0, 7);
    const entry = monthlyMap.get(month) ?? { applications: 0, interviews: 0, offers: 0 };
    entry.applications++;
    if (INTERVIEWED_STATUSES.includes(app.status)) entry.interviews++;
    if (OFFERED_STATUSES.includes(app.status)) entry.offers++;
    monthlyMap.set(month, entry);
  }
  const monthlyTrend: MonthlyEntry[] = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, label: formatMonthLabel(month), ...data }));

  // ── Source performance ────────────────────────────────────────────────────
  const sourceMap = new Map<
    string,
    { total: number; interviewed: number; offered: number }
  >();
  for (const app of apps) {
    const src = app.source?.trim() || "Unknown";
    const entry = sourceMap.get(src) ?? { total: 0, interviewed: 0, offered: 0 };
    entry.total++;
    if (INTERVIEWED_STATUSES.includes(app.status)) entry.interviewed++;
    if (OFFERED_STATUSES.includes(app.status)) entry.offered++;
    sourceMap.set(src, entry);
  }
  const sourceStats: SourceStat[] = [...sourceMap.entries()]
    .map(([source, data]) => ({
      source,
      ...data,
      interviewRate: pct(data.interviewed, data.total),
      offerRate: pct(data.offered, data.total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalApplications: total,
    activeCount,
    stillWaitingCount,
    cancelledCount,
    rejectedBeforeInterviewCount,
    interviewedCount,
    withdrewCount,
    noOfferCount,
    offeredCount,
    interviewRate: total > 0 ? interviewedCount / total : null,
    offerFromInterviewRate: interviewedCount > 0 ? offeredCount / interviewedCount : null,
    overallOfferRate: total > 0 ? offeredCount / total : null,
    rejectionBeforeInterviewRate: total > 0 ? rejectedBeforeInterviewCount / total : null,
    noResponseRate: total > 0 ? stillWaitingCount / total : null,
    responseRate: total > 0 ? (total - stillWaitingCount) / total : null,
    ghostCount,
    ghostRate: total > 0 ? ghostCount / total : null,
    avgDaysToFirstResponse: mean(daysToFirstResponse),
    avgDaysToInterview: mean(daysToInterview),
    avgDaysToOffer: mean(daysToOffer),
    avgDaysInterviewToOffer: mean(daysInterviewToOffer),
    conversionRows,
    statusCounts,
    monthlyTrend,
    sourceStats,
  };
}
