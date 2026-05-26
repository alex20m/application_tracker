import { describe, it, expect } from "vitest";
import {
  computeAnalytics,
  daysBetween,
  formatMonthLabel,
} from "@/lib/analytics";
import { STATUS } from "@/lib/statuses";
import { makeApplication, makeStatusEvent } from "../../helpers/factories";

// ─── daysBetween ─────────────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for the same day", () => {
    expect(daysBetween("2026-01-01", "2026-01-01T12:00:00.000Z")).toBe(0);
  });

  it("returns correct positive difference", () => {
    expect(daysBetween("2026-01-01", "2026-01-15T00:00:00.000Z")).toBe(14);
  });

  it("returns negative when end is before start", () => {
    expect(daysBetween("2026-01-15", "2026-01-01T00:00:00.000Z")).toBeLessThan(0);
  });
});

// ─── formatMonthLabel ────────────────────────────────────────────────────────

describe("formatMonthLabel", () => {
  it("formats YYYY-MM into a human-readable label", () => {
    const label = formatMonthLabel("2026-01");
    expect(label).toMatch(/jan/i);
    expect(label).toContain("2026");
  });

  it("handles december", () => {
    const label = formatMonthLabel("2025-12");
    expect(label).toMatch(/dec/i);
    expect(label).toContain("2025");
  });
});

// ─── computeAnalytics ────────────────────────────────────────────────────────

describe("computeAnalytics", () => {
  it("returns zeros and nulls for empty input", () => {
    const result = computeAnalytics([]);
    expect(result.totalApplications).toBe(0);
    expect(result.interviewRate).toBeNull();
    expect(result.offerFromInterviewRate).toBeNull();
    expect(result.overallOfferRate).toBeNull();
    expect(result.acceptanceRate).toBeNull();
    expect(result.avgDaysToFirstResponse).toBeNull();
    expect(result.avgDaysToInterview).toBeNull();
    expect(result.avgDaysToOffer).toBeNull();
    expect(result.statusCounts).toEqual([]);
    expect(result.monthlyTrend).toEqual([]);
  });

  it("excludes wishlist apps from total", () => {
    const wishlistApp = makeApplication({ status: STATUS.wishlist });
    const appliedApp = makeApplication({ status: STATUS.no_answer });
    const result = computeAnalytics([wishlistApp, appliedApp]);
    expect(result.totalApplications).toBe(1);
  });

  it("counts total applications correctly", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.interviews }),
    ];
    expect(computeAnalytics(apps).totalApplications).toBe(3);
  });

  // ─── Rate calculations ──────────────────────────────────────────────────

  it("calculates interview rate as interviewedCount / total", () => {
    const apps = [
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
    ];
    const result = computeAnalytics(apps);
    expect(result.interviewedCount).toBe(1);
    expect(result.interviewRate).toBeCloseTo(0.25);
  });

  it("counts withdrew, no_offer, offer, accepted, declined as interviewed", () => {
    const apps = [
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
    ];
    const result = computeAnalytics(apps);
    expect(result.interviewedCount).toBe(5);
    expect(result.interviewRate).toBe(1);
  });

  it("calculates offer rate from interviews correctly", () => {
    const apps = [
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.interviews }),
    ];
    const result = computeAnalytics(apps);
    expect(result.interviewedCount).toBe(4);
    expect(result.offeredCount).toBe(1);
    expect(result.offerFromInterviewRate).toBeCloseTo(0.25);
  });

  it("counts accepted and declined as offered", () => {
    const apps = [
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
      makeApplication({ status: STATUS.no_offer }),
    ];
    const result = computeAnalytics(apps);
    expect(result.offeredCount).toBe(2);
  });

  it("calculates acceptance rate as accepted / offered", () => {
    const apps = [
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
    ];
    const result = computeAnalytics(apps);
    expect(result.acceptanceRate).toBeCloseTo(0.5);
  });

  it("returns null acceptanceRate when no offers", () => {
    const apps = [makeApplication({ status: STATUS.no_offer })];
    const result = computeAnalytics(apps);
    expect(result.acceptanceRate).toBeNull();
  });

  it("counts active statuses correctly (no_answer + interviews + offer)", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.accepted }),
    ];
    const result = computeAnalytics(apps);
    expect(result.activeCount).toBe(3);
  });

  // ─── Time calculations ──────────────────────────────────────────────────

  it("calculates avgDaysToFirstResponse from applied_on to first-response event", () => {
    // When transitioning from no_answer → interviews, appendStatusEvent replaces
    // the null→no_answer event with null→interviews. So the first response event
    // has from_status: null and to_status !== no_answer.
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-01-01",
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-15T00:00:00.000Z" }),
      ],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToFirstResponse).toBe(14);
  });

  it("ignores apps with null applied_on for time calculations", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: null,
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-15T00:00:00.000Z" }),
      ],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToFirstResponse).toBeNull();
    expect(result.avgDaysToInterview).toBeNull();
  });

  it("apps still in no_answer do not contribute to avgDaysToFirstResponse", () => {
    const app = makeApplication({
      status: STATUS.no_answer,
      applied_on: "2026-01-01",
      events: [
        // Still waiting — null→no_answer event, not replaced yet
        makeStatusEvent({ from_status: null, to_status: STATUS.no_answer, changed_at: "2026-01-01T00:00:00.000Z" }),
      ],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToFirstResponse).toBeNull();
  });

  it("calculates avgDaysToInterview from applied_on to interview event", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-02-01",
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-02-11T00:00:00.000Z" }),
      ],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToInterview).toBe(10);
  });

  it("calculates avgDaysToOffer from applied_on to offer event", () => {
    const app = makeApplication({
      status: STATUS.offer,
      applied_on: "2026-03-01",
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-03-10T00:00:00.000Z" }),
        makeStatusEvent({ from_status: STATUS.interviews, to_status: STATUS.offer, changed_at: "2026-03-21T00:00:00.000Z" }),
      ],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToOffer).toBe(20);
  });

  it("averages time metrics across multiple apps", () => {
    const app1 = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-11T00:00:00.000Z" })],
    });
    const app2 = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-21T00:00:00.000Z" })],
    });
    const result = computeAnalytics([app1, app2]);
    expect(result.avgDaysToInterview).toBe(15); // avg of 10 and 20
  });

  it("filters out negative day values", () => {
    // An event timestamp before applied_on should not be included
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-06-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-05-01T00:00:00.000Z" })],
    });
    const result = computeAnalytics([app]);
    expect(result.avgDaysToInterview).toBeNull();
  });

  // ─── Status counts ──────────────────────────────────────────────────────

  it("groups apps by current status", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.rejected }),
    ];
    const result = computeAnalytics(apps);
    const noAnswer = result.statusCounts.find((s) => s.status === STATUS.no_answer);
    const rejected = result.statusCounts.find((s) => s.status === STATUS.rejected);
    expect(noAnswer?.count).toBe(2);
    expect(rejected?.count).toBe(1);
  });

  it("sorts status counts descending by count", () => {
    const apps = [
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
    ];
    const result = computeAnalytics(apps);
    expect(result.statusCounts[0].status).toBe(STATUS.no_answer);
    expect(result.statusCounts[0].count).toBe(3);
  });

  it("does not include wishlist in status counts", () => {
    const apps = [
      makeApplication({ status: STATUS.wishlist }),
      makeApplication({ status: STATUS.no_answer }),
    ];
    const result = computeAnalytics(apps);
    const wishlist = result.statusCounts.find((s) => s.status === STATUS.wishlist);
    expect(wishlist).toBeUndefined();
  });

  it("status counts include color from STATUS_THEME", () => {
    const apps = [makeApplication({ status: STATUS.interviews })];
    const result = computeAnalytics(apps);
    expect(result.statusCounts[0].color).toBeDefined();
    expect(result.statusCounts[0].color).toMatch(/^#/);
  });

  // ─── Monthly trend ──────────────────────────────────────────────────────

  it("groups applications by applied_on month", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-01-10" }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-01-20" }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-02-05" }),
    ];
    const result = computeAnalytics(apps);
    expect(result.monthlyTrend).toHaveLength(2);
    expect(result.monthlyTrend[0].applications).toBe(2);
    expect(result.monthlyTrend[1].applications).toBe(1);
  });

  it("sorts monthly trend chronologically", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-03-01" }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-01-01" }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-02-01" }),
    ];
    const result = computeAnalytics(apps);
    expect(result.monthlyTrend[0].month).toBe("2026-01");
    expect(result.monthlyTrend[1].month).toBe("2026-02");
    expect(result.monthlyTrend[2].month).toBe("2026-03");
  });

  it("counts interviews and offers within each month based on final status", () => {
    const apps = [
      makeApplication({ status: STATUS.interviews, applied_on: "2026-01-01" }),
      makeApplication({ status: STATUS.offer, applied_on: "2026-01-15" }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-01-20" }),
    ];
    const result = computeAnalytics(apps);
    const jan = result.monthlyTrend.find((m) => m.month === "2026-01")!;
    expect(jan.applications).toBe(3);
    expect(jan.interviews).toBe(2); // interviews and offer both count as interviewed
    expect(jan.offers).toBe(1);
  });

  it("skips apps without applied_on in monthly trend", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer, applied_on: null }),
      makeApplication({ status: STATUS.no_answer, applied_on: "2026-01-01" }),
    ];
    const result = computeAnalytics(apps);
    expect(result.monthlyTrend).toHaveLength(1);
    expect(result.monthlyTrend[0].applications).toBe(1);
  });

  // ─── Funnel stages ──────────────────────────────────────────────────────

  it("first funnel stage is total applications at 100%", () => {
    const apps = [
      makeApplication({ status: STATUS.no_answer }),
      makeApplication({ status: STATUS.no_answer }),
    ];
    const result = computeAnalytics(apps);
    expect(result.funnelStages[0].label).toBe("Applied");
    expect(result.funnelStages[0].count).toBe(2);
    expect(result.funnelStages[0].percentage).toBe(100);
  });

  it("calculates funnel stage percentages relative to total", () => {
    const apps = [
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.no_answer }),
    ];
    const result = computeAnalytics(apps);
    const appliedStage = result.funnelStages.find((s) => s.label === "Applied")!;
    const interviewStage = result.funnelStages.find((s) => s.label === "Interviews")!;
    const offerStage = result.funnelStages.find((s) => s.label === "Offers")!;
    const acceptedStage = result.funnelStages.find((s) => s.label === "Accepted")!;

    expect(appliedStage.count).toBe(4);
    expect(interviewStage.count).toBe(3); // interviews + offer + accepted
    expect(offerStage.count).toBe(2);     // offer + accepted
    expect(acceptedStage.count).toBe(1);

    expect(interviewStage.percentage).toBe(75);
    expect(offerStage.percentage).toBe(50);
    expect(acceptedStage.percentage).toBe(25);
  });

  it("funnel percentages are 0 when total is 0", () => {
    const result = computeAnalytics([]);
    for (const stage of result.funnelStages) {
      if (stage.label !== "Applied") {
        expect(stage.percentage).toBe(0);
      }
    }
  });
});
