import { describe, it, expect } from "vitest";
import { computeAnalytics, daysBetween, formatMonthLabel } from "@/lib/analytics";
import { STATUS } from "@/lib/statuses";
import { makeApplication, makeStatusEvent } from "../../helpers/factories";

// ─── daysBetween ─────────────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same-day events (noon UTC vs midnight UTC)", () => {
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
  // ── Empty / baseline ───────────────────────────────────────────────────────

  it("returns zeros and nulls for empty input", () => {
    const r = computeAnalytics([]);
    expect(r.totalApplications).toBe(0);
    expect(r.interviewRate).toBeNull();
    expect(r.offerFromInterviewRate).toBeNull();
    expect(r.overallOfferRate).toBeNull();
    expect(r.rejectionBeforeInterviewRate).toBeNull();
    expect(r.noResponseRate).toBeNull();
    expect(r.responseRate).toBeNull();
    expect(r.ghostRate).toBeNull();
    expect(r.avgDaysToFirstResponse).toBeNull();
    expect(r.avgDaysToInterview).toBeNull();
    expect(r.avgDaysToOffer).toBeNull();
    expect(r.avgDaysInterviewToOffer).toBeNull();
    expect(r.statusCounts).toEqual([]);
    expect(r.monthlyTrend).toEqual([]);
    expect(r.sourceStats).toEqual([]);
  });

  it("excludes wishlist apps from total", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.wishlist }),
      makeApplication({ status: STATUS.applied }),
    ]);
    expect(r.totalApplications).toBe(1);
  });

  // ── Stage counts ───────────────────────────────────────────────────────────

  it("counts stillWaiting as apps still in applied", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.rejected }),
    ]);
    expect(r.stillWaitingCount).toBe(2);
  });

  it("counts rejectedBeforeInterview as cancelled + rejected", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.cancelled }),
      makeApplication({ status: STATUS.cancelled }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.interviews }),
    ]);
    expect(r.cancelledCount).toBe(2);
    expect(r.rejectedBeforeInterviewCount).toBe(3);
  });

  it("counts withdrew and no_offer separately", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.no_offer }),
    ]);
    expect(r.withdrewCount).toBe(2);
    expect(r.noOfferCount).toBe(1);
  });

  it("counts active statuses (applied + interviews + offer)", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.accepted }),
    ]);
    expect(r.activeCount).toBe(3);
  });

  it("counts currentlyInterviewingCount as apps with status === interviews", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.no_offer }),
    ]);
    expect(r.currentlyInterviewingCount).toBe(2);
  });

  it("counts currentlyOfferCount as apps with status === offer only", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
    ]);
    expect(r.currentlyOfferCount).toBe(1);
  });

  // ── Rate calculations ──────────────────────────────────────────────────────

  it("calculates interview rate as interviewedCount / total", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
    ]);
    expect(r.interviewRate).toBeCloseTo(0.25);
  });

  it("counts withdrew, no_offer, offer, accepted, declined as interviewed", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
    ]);
    expect(r.interviewedCount).toBe(5);
    expect(r.interviewRate).toBe(1);
  });

  it("calculates offer rate from interviews", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.interviews }),
    ]);
    expect(r.offerFromInterviewRate).toBeCloseTo(0.25);
  });

  it("counts accepted and declined as offered", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.accepted }),
      makeApplication({ status: STATUS.declined }),
      makeApplication({ status: STATUS.no_offer }),
    ]);
    expect(r.offeredCount).toBe(2);
  });

  it("returns null offerFromInterviewRate when no interviews", () => {
    const r = computeAnalytics([makeApplication({ status: STATUS.applied })]);
    expect(r.offerFromInterviewRate).toBeNull();
  });

  it("calculates rejectionBeforeInterviewRate", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.cancelled }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
    ]);
    expect(r.rejectionBeforeInterviewRate).toBeCloseTo(0.5);
  });

  it("calculates noResponseRate and responseRate as complements", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.interviews }),
    ]);
    expect(r.noResponseRate).toBeCloseTo(0.25);
    expect(r.responseRate).toBeCloseTo(0.75);
  });

  // ── Ghost detection ────────────────────────────────────────────────────────

  it("counts apps with ghosted status", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.ghosted }),
      makeApplication({ status: STATUS.ghosted }),
      makeApplication({ status: STATUS.interviews }),
    ]);
    expect(r.ghostCount).toBe(2);
    expect(r.ghostRate).toBeCloseTo(2 / 3);
  });

  it("does not count applied or other statuses as ghosts", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied, applied_on: "2025-01-01" }),
      makeApplication({ status: STATUS.rejected, applied_on: "2025-01-01" }),
    ]);
    expect(r.ghostCount).toBe(0);
  });

  it("ghostCount is zero when no ghosted apps", () => {
    const r = computeAnalytics([makeApplication({ status: STATUS.applied })]);
    expect(r.ghostCount).toBe(0);
    expect(r.ghostRate).toBeCloseTo(0);
  });

  // ── Time calculations ──────────────────────────────────────────────────────

  it("calculates avgDaysToFirstResponse from applied_on to first-response event", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-15T00:00:00.000Z" })],
    });
    expect(computeAnalytics([app]).avgDaysToFirstResponse).toBe(14);
  });

  it("apps still in applied do not contribute to avgDaysToFirstResponse", () => {
    const app = makeApplication({
      status: STATUS.applied,
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.applied, changed_at: "2026-01-01T00:00:00.000Z" })],
    });
    expect(computeAnalytics([app]).avgDaysToFirstResponse).toBeNull();
  });

  it("ignores apps with null applied_on for time calculations", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: null,
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-15T00:00:00.000Z" })],
    });
    const r = computeAnalytics([app]);
    expect(r.avgDaysToFirstResponse).toBeNull();
    expect(r.avgDaysToInterview).toBeNull();
  });

  it("calculates avgDaysToInterview from applied_on to interview event", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-02-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-02-11T00:00:00.000Z" })],
    });
    expect(computeAnalytics([app]).avgDaysToInterview).toBe(10);
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
    const r = computeAnalytics([app]);
    expect(r.avgDaysToOffer).toBe(20);
  });

  it("calculates avgDaysInterviewToOffer as gap between interview and offer events", () => {
    const app = makeApplication({
      status: STATUS.offer,
      applied_on: "2026-03-01",
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-03-10T00:00:00.000Z" }),
        makeStatusEvent({ from_status: STATUS.interviews, to_status: STATUS.offer, changed_at: "2026-03-20T00:00:00.000Z" }),
      ],
    });
    expect(computeAnalytics([app]).avgDaysInterviewToOffer).toBe(10);
  });

  it("returns null avgDaysInterviewToOffer when no offer events", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-10T00:00:00.000Z" })],
    });
    expect(computeAnalytics([app]).avgDaysInterviewToOffer).toBeNull();
  });

  it("averages time metrics across multiple apps", () => {
    const make = (interviewDays: number) =>
      makeApplication({
        status: STATUS.interviews,
        applied_on: "2026-01-01",
        events: [makeStatusEvent({
          from_status: null,
          to_status: STATUS.interviews,
          changed_at: `2026-01-${String(1 + interviewDays).padStart(2, "0")}T00:00:00.000Z`,
        })],
      });
    const r = computeAnalytics([make(10), make(20)]);
    expect(r.avgDaysToInterview).toBe(15);
  });

  it("filters out negative day values", () => {
    const app = makeApplication({
      status: STATUS.interviews,
      applied_on: "2026-06-01",
      events: [makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-05-01T00:00:00.000Z" })],
    });
    expect(computeAnalytics([app]).avgDaysToInterview).toBeNull();
  });

  // ── Conversion rows ────────────────────────────────────────────────────────

  it("conversionRows contains all expected keys", () => {
    const keys = computeAnalytics([]).conversionRows.map((r) => r.key);
    expect(keys).toContain("waiting");
    expect(keys).toContain("cancelled");
    expect(keys).toContain("ghosted");
    expect(keys).toContain("rejected_before");
    expect(keys).toContain("interviews");
    expect(keys).toContain("withdrew");
    expect(keys).toContain("no_offer");
    expect(keys).toContain("offer");
  });

  it("rows with pctOfStage are the post-interview rows", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.applied }),
    ]);
    const postInterview = r.conversionRows.filter((row) => row.pctOfStage !== null);
    expect(postInterview.map((r) => r.key)).toEqual(
      expect.arrayContaining(["withdrew", "no_offer", "offer"])
    );
  });

  it("pctOfApplied for interview row is correct", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
    ]);
    const row = r.conversionRows.find((c) => c.key === "interviews")!;
    expect(row.pctOfApplied).toBe(25);
  });

  it("pctOfStage for offer row is correct (% of interviewed)", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.interviews }),
      makeApplication({ status: STATUS.interviews }),
    ]);
    const offerRow = r.conversionRows.find((c) => c.key === "offer")!;
    expect(offerRow.pctOfStage).toBe(25); // 1/4 interviewed
  });

  it("pctOfStage is 0 when no interviews", () => {
    const r = computeAnalytics([makeApplication({ status: STATUS.applied })]);
    const offerRow = r.conversionRows.find((c) => c.key === "offer")!;
    expect(offerRow.pctOfStage).toBe(0);
  });

  // ── Status counts ──────────────────────────────────────────────────────────

  it("groups apps by current status", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.rejected }),
    ]);
    expect(r.statusCounts.find((s) => s.status === STATUS.applied)?.count).toBe(2);
    expect(r.statusCounts.find((s) => s.status === STATUS.rejected)?.count).toBe(1);
  });

  it("sorts status counts descending by count", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.rejected }),
      makeApplication({ status: STATUS.applied }),
      makeApplication({ status: STATUS.applied }),
    ]);
    expect(r.statusCounts[0].status).toBe(STATUS.applied);
  });

  it("does not include wishlist in status counts", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.wishlist }),
      makeApplication({ status: STATUS.applied }),
    ]);
    expect(r.statusCounts.find((s) => s.status === STATUS.wishlist)).toBeUndefined();
  });

  // ── Monthly trend ──────────────────────────────────────────────────────────

  it("groups applications by applied_on month", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied, applied_on: "2026-01-10" }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-01-20" }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-02-05" }),
    ]);
    expect(r.monthlyTrend).toHaveLength(2);
    expect(r.monthlyTrend[0].applications).toBe(2);
    expect(r.monthlyTrend[1].applications).toBe(1);
  });

  it("sorts monthly trend chronologically", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied, applied_on: "2026-03-01" }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-01-01" }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-02-01" }),
    ]);
    expect(r.monthlyTrend[0].month).toBe("2026-01");
    expect(r.monthlyTrend[2].month).toBe("2026-03");
  });

  it("counts interviews and offers in monthly trend based on final status", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.interviews, applied_on: "2026-01-01" }),
      makeApplication({ status: STATUS.offer, applied_on: "2026-01-15" }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-01-20" }),
    ]);
    const jan = r.monthlyTrend.find((m) => m.month === "2026-01")!;
    expect(jan.interviews).toBe(2);
    expect(jan.offers).toBe(1);
  });

  it("skips apps without applied_on in monthly trend", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied, applied_on: null }),
      makeApplication({ status: STATUS.applied, applied_on: "2026-01-01" }),
    ]);
    expect(r.monthlyTrend).toHaveLength(1);
  });

  // ── Source stats ───────────────────────────────────────────────────────────

  it("groups applications by source", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.applied, source: "LinkedIn" }),
      makeApplication({ status: STATUS.applied, source: "LinkedIn" }),
      makeApplication({ status: STATUS.applied, source: "Indeed" }),
    ]);
    const li = r.sourceStats.find((s) => s.source === "LinkedIn")!;
    expect(li.total).toBe(2);
    const ind = r.sourceStats.find((s) => s.source === "Indeed")!;
    expect(ind.total).toBe(1);
  });

  it("uses 'Unknown' for null/empty source", () => {
    const r = computeAnalytics([makeApplication({ source: null })]);
    expect(r.sourceStats[0].source).toBe("Unknown");
  });

  it("calculates interview and offer rates per source", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.interviews, source: "LinkedIn" }),
      makeApplication({ status: STATUS.offer, source: "LinkedIn" }),
      makeApplication({ status: STATUS.applied, source: "LinkedIn" }),
      makeApplication({ status: STATUS.applied, source: "LinkedIn" }),
    ]);
    const li = r.sourceStats.find((s) => s.source === "LinkedIn")!;
    expect(li.interviewRate).toBe(50); // 2/4
    expect(li.offerRate).toBe(25);     // 1/4
  });

  it("sorts source stats by total descending", () => {
    const r = computeAnalytics([
      makeApplication({ source: "Indeed" }),
      makeApplication({ source: "LinkedIn" }),
      makeApplication({ source: "LinkedIn" }),
    ]);
    expect(r.sourceStats[0].source).toBe("LinkedIn");
  });
});
