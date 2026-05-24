import { describe, it, expect } from "vitest";
import {
  STATUS,
  STATUS_NEXT,
  getStatusRankForDepth,
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

describe("getStatusRankForDepth", () => {
  it("returns the index within the depth array for a known status", () => {
    // depth 1: [interviews, cancelled, no_answer, rejected]
    expect(getStatusRankForDepth(STATUS.interviews, 1)).toBe(0);
    expect(getStatusRankForDepth(STATUS.cancelled, 1)).toBe(1);
    expect(getStatusRankForDepth(STATUS.no_answer, 1)).toBe(2);
    expect(getStatusRankForDepth(STATUS.rejected, 1)).toBe(3);
  });

  it("returns 999 for a status not in the given depth", () => {
    expect(getStatusRankForDepth(STATUS.accepted, 1)).toBe(999);
  });

  it("returns 999 for an unknown depth", () => {
    expect(getStatusRankForDepth(STATUS.no_answer, 99)).toBe(999);
  });
});
