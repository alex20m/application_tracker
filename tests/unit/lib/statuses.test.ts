import { describe, it, expect } from "vitest";
import {
  STATUS,
  STATUS_NEXT,
  getStatusRank,
  type ApplicationStatus,
} from "@/lib/statuses";

describe("STATUS_NEXT", () => {
  it("every key is a valid STATUS value", () => {
    const validValues = new Set(Object.values(STATUS));
    for (const key of Object.keys(STATUS_NEXT)) {
      expect(validValues.has(key as ApplicationStatus)).toBe(true);
    }
  });

  it("every transition target is a valid STATUS value", () => {
    const validValues = new Set(Object.values(STATUS));
    for (const targets of Object.values(STATUS_NEXT)) {
      for (const target of targets) {
        expect(validValues.has(target)).toBe(true);
      }
    }
  });

  it("terminal statuses have no transitions", () => {
    const terminals: ApplicationStatus[] = [
      STATUS.cancelled,
      STATUS.withdrew,
      STATUS.rejected,
      STATUS.no_offer,
      STATUS.accepted,
      STATUS.declined,
    ];
    for (const t of terminals) {
      expect(STATUS_NEXT[t]).toEqual([]);
    }
  });

  it("wishlist transitions only to no_answer", () => {
    expect(STATUS_NEXT[STATUS.wishlist]).toEqual([STATUS.no_answer]);
  });

  it("interviews can transition to withdrew, no_offer, or offer", () => {
    expect(STATUS_NEXT[STATUS.interviews]).toEqual(
      expect.arrayContaining([STATUS.withdrew, STATUS.no_offer, STATUS.offer])
    );
  });
});

describe("getStatusRank", () => {
  it("level-1 statuses rank before level-2 which rank before level-3", () => {
    expect(getStatusRank(STATUS.interviews)).toBeLessThan(getStatusRank(STATUS.offer));
    expect(getStatusRank(STATUS.offer)).toBeLessThan(getStatusRank(STATUS.accepted));
  });

  it("preserves within-level ordering", () => {
    // level 1: [interviews, cancelled, no_answer, rejected]
    expect(getStatusRank(STATUS.interviews)).toBeLessThan(getStatusRank(STATUS.cancelled));
    expect(getStatusRank(STATUS.cancelled)).toBeLessThan(getStatusRank(STATUS.no_answer));
    expect(getStatusRank(STATUS.no_answer)).toBeLessThan(getStatusRank(STATUS.rejected));
    // level 2: [offer, withdrew, no_offer]
    expect(getStatusRank(STATUS.offer)).toBeLessThan(getStatusRank(STATUS.withdrew));
    expect(getStatusRank(STATUS.withdrew)).toBeLessThan(getStatusRank(STATUS.no_offer));
    // level 3: [accepted, declined]
    expect(getStatusRank(STATUS.accepted)).toBeLessThan(getStatusRank(STATUS.declined));
  });

  it("returns a value independent of d3-sankey depth (no depth argument)", () => {
    const rank = getStatusRank(STATUS.rejected);
    expect(typeof rank).toBe("number");
    expect(rank).toBeLessThan(9999);
  });
});
