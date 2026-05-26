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

export type FunnelStage = {
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type AnalyticsResult = {
  totalApplications: number;
  activeCount: number;
  interviewedCount: number;
  offeredCount: number;
  acceptedCount: number;
  interviewRate: number | null;
  offerFromInterviewRate: number | null;
  overallOfferRate: number | null;
  acceptanceRate: number | null;
  avgDaysToFirstResponse: number | null;
  avgDaysToInterview: number | null;
  avgDaysToOffer: number | null;
  statusCounts: StatusCount[];
  monthlyTrend: MonthlyEntry[];
  funnelStages: FunnelStage[];
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
  // startDate is "YYYY-MM-DD", endTimestamp is an ISO string
  const start = new Date(startDate + "T00:00:00.000Z");
  const end = new Date(endTimestamp);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en", { month: "short", year: "numeric" });
}

export function computeAnalytics(applications: ApplicationRecord[]): AnalyticsResult {
  const apps = applications.filter((a) => a.status !== STATUS.wishlist);
  const total = apps.length;

  const interviewedCount = apps.filter((a) => INTERVIEWED_STATUSES.includes(a.status)).length;
  const offeredCount = apps.filter((a) => OFFERED_STATUSES.includes(a.status)).length;
  const acceptedCount = apps.filter((a) => a.status === STATUS.accepted).length;
  const activeCount = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;

  const daysToFirstResponse: number[] = [];
  const daysToInterview: number[] = [];
  const daysToOffer: number[] = [];

  for (const app of apps) {
    if (!app.applied_on) continue;

    // First response: when transitioning out of no_answer, appendStatusEvent replaces
    // the null→no_answer event with null→newStatus. So if from_status is null and
    // to_status is not no_answer, that's when the first response arrived.
    const firstResponseEvent = app.events.find(
      (e) => e.from_status === null && e.to_status !== STATUS.no_answer
    );
    if (firstResponseEvent) {
      const days = daysBetween(app.applied_on, firstResponseEvent.changed_at);
      if (days >= 0) daysToFirstResponse.push(days);
    }

    const interviewEvent = app.events.find((e) => e.to_status === STATUS.interviews);
    if (interviewEvent) {
      const days = daysBetween(app.applied_on, interviewEvent.changed_at);
      if (days >= 0) daysToInterview.push(days);
    }

    const offerEvent = app.events.find((e) => e.to_status === STATUS.offer);
    if (offerEvent) {
      const days = daysBetween(app.applied_on, offerEvent.changed_at);
      if (days >= 0) daysToOffer.push(days);
    }
  }

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

  const funnelStages: FunnelStage[] = [
    { label: "Applied", count: total, percentage: 100, color: "#60a5fa" },
    {
      label: "Interviews",
      count: interviewedCount,
      percentage: total > 0 ? Math.round((interviewedCount / total) * 100) : 0,
      color: STATUS_THEME[STATUS.interviews].sankey,
    },
    {
      label: "Offers",
      count: offeredCount,
      percentage: total > 0 ? Math.round((offeredCount / total) * 100) : 0,
      color: STATUS_THEME[STATUS.offer].sankey,
    },
    {
      label: "Accepted",
      count: acceptedCount,
      percentage: total > 0 ? Math.round((acceptedCount / total) * 100) : 0,
      color: STATUS_THEME[STATUS.accepted].sankey,
    },
  ];

  return {
    totalApplications: total,
    activeCount,
    interviewedCount,
    offeredCount,
    acceptedCount,
    interviewRate: total > 0 ? interviewedCount / total : null,
    offerFromInterviewRate: interviewedCount > 0 ? offeredCount / interviewedCount : null,
    overallOfferRate: total > 0 ? offeredCount / total : null,
    acceptanceRate: offeredCount > 0 ? acceptedCount / offeredCount : null,
    avgDaysToFirstResponse: mean(daysToFirstResponse),
    avgDaysToInterview: mean(daysToInterview),
    avgDaysToOffer: mean(daysToOffer),
    statusCounts,
    monthlyTrend,
    funnelStages,
  };
}
