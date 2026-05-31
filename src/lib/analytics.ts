import type { ApplicationRecord } from "@/lib/types";
import { STATUS, STATUS_NAMES, STATUS_THEME, STATUS_NEXT, ACTIVE_STATUSES, type ApplicationStatus } from "@/lib/statuses";

export type StatusCount = {
  status: ApplicationStatus;
  name: string;
  count: number;
  color: string;
};

export type DailyEntry = {
  date: string;
  label: string;
  applied: number | null;
  interviews: number | null;
  offers: number | null;
  ghosted: number | null;
  rejectedByCompany: number | null;
  rejectedByMe: number | null;
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
  currentlyInterviewingCount: number;
  withdrewCount: number;
  noOfferCount: number;
  offeredCount: number;
  currentlyOfferCount: number;

  // ── Rates (0–1) ──────────────────────────────────
  interviewRate: number | null;
  offerFromInterviewRate: number | null;
  overallOfferRate: number | null;
  rejectionBeforeInterviewRate: number | null;
  noResponseRate: number | null;
  responseRate: number | null;

  // ── Ghost (applications with no response moved to ghosted) ────────
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
  dailyTrend: DailyEntry[];

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


export function daysBetween(startDate: string, endTimestamp: string): number {
  const start = new Date(startDate + "T00:00:00.000Z");
  const end = new Date(endTimestamp);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleString("en", { month: "short", day: "numeric" });
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
  applications: ApplicationRecord[]
): AnalyticsResult {
  const apps = applications.filter((a) => a.status !== STATUS.wishlist);
  const total = apps.length;

  // ── Stage counts ──────────────────────────────────────────────────────────
  const stillWaitingCount = apps.filter((a) => a.status === STATUS.applied).length;
  const cancelledCount = apps.filter((a) => a.status === STATUS.cancelled).length;
  const rejectedCount = apps.filter((a) => a.status === STATUS.rejected).length;
  const rejectedBeforeInterviewCount = cancelledCount + rejectedCount;
  const interviewedCount = apps.filter((a) => INTERVIEWED_STATUSES.includes(a.status)).length;
  const withdrewCount = apps.filter((a) => a.status === STATUS.withdrew).length;
  const noOfferCount = apps.filter((a) => a.status === STATUS.no_offer).length;
  const offeredCount = apps.filter((a) => OFFERED_STATUSES.includes(a.status)).length;
  const currentlyInterviewingCount = apps.filter((a) => a.status === STATUS.interviews).length;
  const currentlyOfferCount = apps.filter((a) => a.status === STATUS.offer).length;
  const activeCount = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;

  // ── Ghost count (applications moved to ghosted status) ────────────────
  const ghostCount = apps.filter((a) => a.status === STATUS.ghosted).length;

  // ── Time metrics ──────────────────────────────────────────────────────────
  const daysToFirstResponse: number[] = [];
  const daysToInterview: number[] = [];
  const daysToOffer: number[] = [];
  const daysInterviewToOffer: number[] = [];

  for (const app of apps) {
    if (!app.applied_on) continue;

    // When appendStatusEvent transitions out of applied, the null→applied event
    // is replaced by null→newStatus. So null-from with to_status ≠ applied = first response.
    const firstResponseEvent = app.events.find(
      (e) => e.from_status === null && e.to_status !== STATUS.applied
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
      color: STATUS_THEME[STATUS.applied].sankey,
    },
    {
      key: "ghosted",
      label: "Ghosted",
      count: ghostCount,
      pctOfApplied: pct(ghostCount, total),
      pctOfStage: null,
      stageLabel: null,
      color: STATUS_THEME[STATUS.ghosted].sankey,
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

  // ── Cumulative milestone trend ────────────────────────────────────────────
  const milestoneAdds = {
    applied:           new Map<string, number>(),
    interviews:        new Map<string, number>(),
    offers:            new Map<string, number>(),
    ghosted:           new Map<string, number>(),
    rejectedByCompany: new Map<string, number>(),
    rejectedByMe:      new Map<string, number>(),
  };
  let trendMinDate = "";
  let trendMaxDate = "";

  function trackMilestone(map: Map<string, number>, date: string) {
    map.set(date, (map.get(date) ?? 0) + 1);
    if (!trendMinDate || date < trendMinDate) trendMinDate = date;
    if (date > trendMaxDate) trendMaxDate = date;
  }

  for (const app of apps) {
    if (!app.applied_on) continue;
    trackMilestone(milestoneAdds.applied, app.applied_on.slice(0, 10));
    for (const ev of app.events) {
      const d = ev.changed_at.slice(0, 10);
      if (ev.to_status === STATUS.interviews) {
        trackMilestone(milestoneAdds.interviews, d);
      } else if (ev.to_status === STATUS.offer) {
        trackMilestone(milestoneAdds.offers, d);
      } else if (ev.to_status === STATUS.ghosted) {
        trackMilestone(milestoneAdds.ghosted, d);
      } else if (ev.to_status === STATUS.rejected || ev.to_status === STATUS.no_offer) {
        trackMilestone(milestoneAdds.rejectedByCompany, d);
      } else if (
        ev.to_status === STATUS.cancelled ||
        ev.to_status === STATUS.withdrew ||
        ev.to_status === STATUS.declined
      ) {
        trackMilestone(milestoneAdds.rejectedByMe, d);
      }
    }
  }

  const dailyTrend: DailyEntry[] = [];
  if (trendMinDate) {
    let cumApplied = 0, cumInterviews = 0, cumOffers = 0;
    let cumGhosted = 0, cumRejectedByCompany = 0, cumRejectedByMe = 0;
    let cursor = new Date(trendMinDate + "T00:00:00.000Z");
    const last = new Date(trendMaxDate + "T00:00:00.000Z");
    while (cursor <= last) {
      const d = cursor.toISOString().slice(0, 10);
      cumApplied           += milestoneAdds.applied.get(d)           ?? 0;
      cumInterviews        += milestoneAdds.interviews.get(d)        ?? 0;
      cumOffers            += milestoneAdds.offers.get(d)            ?? 0;
      cumGhosted           += milestoneAdds.ghosted.get(d)           ?? 0;
      cumRejectedByCompany += milestoneAdds.rejectedByCompany.get(d) ?? 0;
      cumRejectedByMe      += milestoneAdds.rejectedByMe.get(d)      ?? 0;
      dailyTrend.push({
        date: d,
        label: formatDayLabel(d),
        applied:           cumApplied,
        interviews:        cumInterviews,
        offers:            cumOffers,
        ghosted:           cumGhosted,
        rejectedByCompany: cumRejectedByCompany,
        rejectedByMe:      cumRejectedByMe,
      });
      cursor = new Date(cursor.getTime() + 86_400_000);
    }

    // For each series, null out days where the cumulative value is still 0,
    // but keep the day immediately before the first non-zero entry at 0 so the
    // line visually starts from 0 rather than appearing out of nowhere.
    const trendSeriesKeys = [
      "applied", "interviews", "offers", "ghosted", "rejectedByCompany", "rejectedByMe",
    ] as const;
    for (const key of trendSeriesKeys) {
      const firstNonZeroIdx = dailyTrend.findIndex(e => (e[key] as number) > 0);
      if (firstNonZeroIdx <= 0) continue;
      for (let i = 0; i < firstNonZeroIdx - 1; i++) {
        dailyTrend[i][key] = null;
      }
      // dailyTrend[firstNonZeroIdx - 1][key] stays at 0 — the visible "anchor" point
    }
  }

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
    currentlyInterviewingCount,
    withdrewCount,
    noOfferCount,
    offeredCount,
    currentlyOfferCount,
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
    dailyTrend,
    sourceStats,
  };
}

// Returns all statuses transitively reachable from `from` via STATUS_NEXT (excludes `from` itself).
export function getReachableStatuses(from: ApplicationStatus): ApplicationStatus[] {
  const visited = new Set<ApplicationStatus>();
  const queue: ApplicationStatus[] = [...STATUS_NEXT[from]];
  for (const s of queue) {
    if (!visited.has(s)) {
      visited.add(s);
      queue.push(...STATUS_NEXT[s]);
    }
  }
  return [...visited];
}

export type StageDurationResult = {
  avg: number | null;
  count: number;
  min: number | null;
  max: number | null;
};

export function computeAvgDaysBetweenStatuses(
  applications: ApplicationRecord[],
  startStatus: ApplicationStatus,
  endStatus: ApplicationStatus
): StageDurationResult {
  const durations: number[] = [];

  for (const app of applications) {
    let startMs: number | null = null;

    if (startStatus === STATUS.applied) {
      if (app.applied_on) startMs = new Date(app.applied_on + "T00:00:00.000Z").getTime();
    } else if (startStatus === STATUS.wishlist) {
      startMs = new Date(app.created_at).getTime();
    } else {
      const ev = app.events.find((e) => e.to_status === startStatus);
      if (ev) startMs = new Date(ev.changed_at).getTime();
    }

    if (startMs === null) continue;

    const endEv = app.events.find((e) => e.to_status === endStatus);
    if (!endEv) continue;

    const d = Math.floor((new Date(endEv.changed_at).getTime() - startMs) / (1000 * 60 * 60 * 24));
    if (d >= 0) durations.push(d);
  }

  if (durations.length === 0) return { avg: null, count: 0, min: null, max: null };

  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  return {
    avg,
    count: durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
  };
}
