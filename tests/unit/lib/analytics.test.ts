import { describe, it, expect } from "vitest";
import { computeAnalytics, daysBetween, formatDayLabel, getReachableStatuses, computeAvgDaysBetweenStatuses } from "@/lib/analytics";
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
    expect(daysBetween("2026-01-15", "2026-01-01T00:00:00.000Z")).toBe(-14);
  });

  it("counts whole elapsed days, not calendar boundaries crossed", () => {
    // 23:59 on the following day is still less than one full day elapsed.
    expect(daysBetween("2026-01-01", "2026-01-01T23:59:59.000Z")).toBe(0);
    expect(daysBetween("2026-01-01", "2026-01-02T00:00:00.000Z")).toBe(1);
  });

  it("spans month and year boundaries", () => {
    expect(daysBetween("2026-01-31", "2026-02-01T00:00:00.000Z")).toBe(1);
    expect(daysBetween("2025-12-31", "2026-01-01T00:00:00.000Z")).toBe(1);
  });

  it("counts the leap day in a leap year February", () => {
    expect(daysBetween("2028-02-28", "2028-03-01T00:00:00.000Z")).toBe(2);
  });
});

// ─── formatDayLabel ──────────────────────────────────────────────────────────

describe("formatDayLabel", () => {
  // The source pins the locale to "en", so these labels are exact, not
  // machine-dependent.
  it("formats YYYY-MM-DD into a human-readable label", () => {
    expect(formatDayLabel("2026-01-15")).toBe("Jan 15");
  });

  it("handles december", () => {
    expect(formatDayLabel("2025-12-31")).toBe("Dec 31");
  });

  it("labels the first of the month without a leading zero", () => {
    expect(formatDayLabel("2026-03-01")).toBe("Mar 1");
  });

  it("labels a leap day", () => {
    expect(formatDayLabel("2028-02-29")).toBe("Feb 29");
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
    expect(r.dailyTrend).toEqual([]);
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

  it("lists the conversion rows in funnel order", () => {
    // The analytics table renders these in array order, so the order is part of
    // the contract, not an accident of construction.
    expect(computeAnalytics([]).conversionRows.map((r) => r.key)).toEqual([
      "waiting",
      "ghosted",
      "cancelled",
      "rejected_before",
      "interviews",
      "withdrew",
      "no_offer",
      "offer",
    ]);
  });

  it("gives every conversion row a label and a colour to render with", () => {
    for (const row of computeAnalytics([]).conversionRows) {
      expect(row.label, `${row.key} has no label`).toBeTruthy();
      expect(row.color, `${row.key} has no colour`).toBeTruthy();
    }
  });

  it("rows with pctOfStage are the post-interview rows", () => {
    const r = computeAnalytics([
      makeApplication({ status: STATUS.withdrew }),
      makeApplication({ status: STATUS.no_offer }),
      makeApplication({ status: STATUS.offer }),
      makeApplication({ status: STATUS.applied }),
    ]);
    const postInterview = r.conversionRows.filter((row) => row.pctOfStage !== null);
    // Exactly these three: a pre-interview row showing "% of interviewed" would
    // be a nonsense denominator.
    expect(postInterview.map((r) => r.key)).toEqual(["withdrew", "no_offer", "offer"]);
    expect(postInterview.every((r) => r.stageLabel === "of interviewed")).toBe(true);
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

  // ── Daily trend ────────────────────────────────────────────────────────────

  it("accumulates applied milestones cumulatively by day", () => {
    const r = computeAnalytics([
      makeApplication({ applied_on: "2026-01-10" }),
      makeApplication({ applied_on: "2026-01-10" }),
      makeApplication({ applied_on: "2026-02-05" }),
    ]);
    const jan10 = r.dailyTrend.find(d => d.date === "2026-01-10")!;
    const feb05 = r.dailyTrend.find(d => d.date === "2026-02-05")!;
    expect(jan10.applied).toBe(2);
    expect(feb05.applied).toBe(3); // cumulative: 2 + 1
  });

  it("sorts daily trend chronologically and covers the full date range", () => {
    const r = computeAnalytics([
      makeApplication({ applied_on: "2026-03-01" }),
      makeApplication({ applied_on: "2026-01-01" }),
      makeApplication({ applied_on: "2026-02-01" }),
    ]);
    expect(r.dailyTrend[0].date).toBe("2025-12-31"); // synthetic zero anchor day prepended
    expect(r.dailyTrend.at(-1)!.date).toBe("2026-03-01");
    expect(r.dailyTrend.length).toBeGreaterThan(3); // continuous daily range
  });

  it("tracks interview and rejection milestones from event dates", () => {
    const r = computeAnalytics([
      makeApplication({
        applied_on: "2026-01-01",
        events: [
          makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-15T12:00:00.000Z" }),
        ],
      }),
      makeApplication({
        applied_on: "2026-01-01",
        events: [
          makeStatusEvent({ from_status: null, to_status: STATUS.rejected, changed_at: "2026-01-20T12:00:00.000Z" }),
        ],
      }),
    ]);
    const jan01 = r.dailyTrend.find(d => d.date === "2026-01-01")!;
    expect(jan01.applied).toBe(2);
    // Leading-zero days are nulled out — only the day before the first event stays at 0
    expect(jan01.interviews).toBeNull();
    const jan14 = r.dailyTrend.find(d => d.date === "2026-01-14")!;
    expect(jan14.interviews).toBe(0); // anchor: visible at 0 the day before first interview
    const jan15 = r.dailyTrend.find(d => d.date === "2026-01-15")!;
    expect(jan15.interviews).toBe(1);
    // rejectedByCompany: Jan 19 is the anchor (0), Jan 20 is the first non-zero
    const jan19 = r.dailyTrend.find(d => d.date === "2026-01-19")!;
    expect(jan19.rejectedByCompany).toBe(0);
    const jan20 = r.dailyTrend.find(d => d.date === "2026-01-20")!;
    expect(jan20.rejectedByCompany).toBe(1);
  });

  it("skips apps without applied_on in daily trend", () => {
    const r = computeAnalytics([
      makeApplication({ applied_on: null }),
      makeApplication({ applied_on: "2026-01-01" }),
    ]);
    expect(r.dailyTrend).toHaveLength(2); // zero anchor day + the one real day
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

// ─── getReachableStatuses ─────────────────────────────────────────────────────

describe("getReachableStatuses", () => {
  it("returns direct and transitive successors from applied", () => {
    const reachable = getReachableStatuses(STATUS.applied);
    // Direct successors
    expect(reachable).toContain(STATUS.interviews);
    expect(reachable).toContain(STATUS.rejected);
    expect(reachable).toContain(STATUS.ghosted);
    expect(reachable).toContain(STATUS.cancelled);
    // Transitive successors via interviews
    expect(reachable).toContain(STATUS.offer);
    expect(reachable).toContain(STATUS.accepted);
    // Does not include itself
    expect(reachable).not.toContain(STATUS.applied);
  });

  it("returns only direct successors from offer", () => {
    const reachable = getReachableStatuses(STATUS.offer);
    expect(reachable).toEqual(expect.arrayContaining([STATUS.accepted, STATUS.declined]));
    expect(reachable).toHaveLength(2);
  });

  it("returns empty array for terminal statuses", () => {
    expect(getReachableStatuses(STATUS.rejected)).toHaveLength(0);
    expect(getReachableStatuses(STATUS.accepted)).toHaveLength(0);
  });
});

// ─── computeAvgDaysBetweenStatuses ───────────────────────────────────────────

describe("computeAvgDaysBetweenStatuses", () => {
  it("returns null avg when no applications match", () => {
    const r = computeAvgDaysBetweenStatuses([], STATUS.applied, STATUS.interviews);
    expect(r.avg).toBeNull();
    expect(r.count).toBe(0);
  });

  it("computes average from applied_on to an event timestamp", () => {
    const app = makeApplication({
      applied_on: "2026-01-01",
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-11T00:00:00.000Z" }),
      ],
    });
    const r = computeAvgDaysBetweenStatuses([app], STATUS.applied, STATUS.interviews);
    expect(r.avg).toBe(10);
    expect(r.count).toBe(1);
    expect(r.min).toBe(10);
    expect(r.max).toBe(10);
  });

  it("averages correctly across multiple applications", () => {
    const app1 = makeApplication({
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ to_status: STATUS.interviews, changed_at: "2026-01-11T00:00:00.000Z" })],
    });
    const app2 = makeApplication({
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ to_status: STATUS.interviews, changed_at: "2026-01-21T00:00:00.000Z" })],
    });
    const r = computeAvgDaysBetweenStatuses([app1, app2], STATUS.applied, STATUS.interviews);
    expect(r.avg).toBe(15);
    expect(r.count).toBe(2);
    expect(r.min).toBe(10);
    expect(r.max).toBe(20);
  });

  it("skips applications missing the end event", () => {
    const app = makeApplication({
      applied_on: "2026-01-01",
      events: [makeStatusEvent({ to_status: STATUS.rejected, changed_at: "2026-01-11T00:00:00.000Z" })],
    });
    const r = computeAvgDaysBetweenStatuses([app], STATUS.applied, STATUS.interviews);
    expect(r.avg).toBeNull();
    expect(r.count).toBe(0);
  });

  it("uses created_at for wishlist start status", () => {
    const app = makeApplication({
      status: STATUS.applied,
      created_at: "2026-01-01T00:00:00.000Z",
      events: [makeStatusEvent({ to_status: STATUS.applied, changed_at: "2026-01-06T00:00:00.000Z" })],
    });
    const r = computeAvgDaysBetweenStatuses([app], STATUS.wishlist, STATUS.applied);
    expect(r.avg).toBe(5);
    expect(r.count).toBe(1);
  });

  it("uses event timestamp for non-applied start status", () => {
    const app = makeApplication({
      events: [
        makeStatusEvent({ from_status: null, to_status: STATUS.interviews, changed_at: "2026-01-10T00:00:00.000Z" }),
        makeStatusEvent({ from_status: STATUS.interviews, to_status: STATUS.offer, changed_at: "2026-01-20T00:00:00.000Z" }),
      ],
    });
    const r = computeAvgDaysBetweenStatuses([app], STATUS.interviews, STATUS.offer);
    expect(r.avg).toBe(10);
    expect(r.count).toBe(1);
  });
});
