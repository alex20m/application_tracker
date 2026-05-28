import { describe, it, expect } from "vitest";
import {
  STATUS,
  STATUS_NEXT,
  FINAL_STATUSES,
  CLOSED_STATUSES,
  ACTIVE_STATUSES,
  isClosedStatus,
  isActiveStatus,
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

  it("applied can transition to ghosted", () => {
    expect(STATUS_NEXT[STATUS.applied]).toContain(STATUS.ghosted);
  });

  it("ghosted can transition to cancelled, rejected, and interviews", () => {
    expect(STATUS_NEXT[STATUS.ghosted]).toEqual(
      expect.arrayContaining([STATUS.cancelled, STATUS.rejected, STATUS.interviews])
    );
    expect(STATUS_NEXT[STATUS.ghosted]).not.toContain(STATUS.ghosted);
  });

  it("wishlist transitions only to applied", () => {
    expect(STATUS_NEXT[STATUS.wishlist]).toEqual([STATUS.applied]);
  });

  it("interviews can transition to withdrew, no_offer, or offer", () => {
    expect(STATUS_NEXT[STATUS.interviews]).toEqual(
      expect.arrayContaining([STATUS.withdrew, STATUS.no_offer, STATUS.offer])
    );
  });
});

describe("FINAL_STATUSES", () => {
  it("contains exactly the six terminal statuses", () => {
    const expected: ApplicationStatus[] = [
      STATUS.cancelled, STATUS.withdrew, STATUS.rejected,
      STATUS.no_offer, STATUS.accepted, STATUS.declined,
    ];
    expect([...FINAL_STATUSES].sort()).toEqual(expected.sort());
  });

  it("every member has an empty STATUS_NEXT list", () => {
    for (const s of FINAL_STATUSES) {
      expect(STATUS_NEXT[s]).toEqual([]);
    }
  });
});

describe("CLOSED_STATUSES", () => {
  it("includes ghosted", () => {
    expect(CLOSED_STATUSES).toContain(STATUS.ghosted);
  });

  it("includes all FINAL_STATUSES", () => {
    for (const s of FINAL_STATUSES) {
      expect(CLOSED_STATUSES).toContain(s);
    }
  });

  it("does not include active or wishlist statuses", () => {
    for (const s of ACTIVE_STATUSES) {
      expect(CLOSED_STATUSES).not.toContain(s);
    }
    expect(CLOSED_STATUSES).not.toContain(STATUS.wishlist);
  });
});

describe("ACTIVE_STATUSES", () => {
  it("contains applied, interviews, and offer", () => {
    expect(ACTIVE_STATUSES).toContain(STATUS.applied);
    expect(ACTIVE_STATUSES).toContain(STATUS.interviews);
    expect(ACTIVE_STATUSES).toContain(STATUS.offer);
  });

  it("does not include closed or wishlist statuses", () => {
    for (const s of CLOSED_STATUSES) {
      expect(ACTIVE_STATUSES).not.toContain(s);
    }
    expect(ACTIVE_STATUSES).not.toContain(STATUS.wishlist);
  });
});

describe("isActiveStatus / isClosedStatus", () => {
  it("applied is active, not closed", () => {
    expect(isActiveStatus(STATUS.applied)).toBe(true);
    expect(isClosedStatus(STATUS.applied)).toBe(false);
  });

  it("ghosted is closed, not active", () => {
    expect(isClosedStatus(STATUS.ghosted)).toBe(true);
    expect(isActiveStatus(STATUS.ghosted)).toBe(false);
  });

  it("accepted is closed, not active", () => {
    expect(isClosedStatus(STATUS.accepted)).toBe(true);
    expect(isActiveStatus(STATUS.accepted)).toBe(false);
  });

  it("interviews is active, not closed", () => {
    expect(isActiveStatus(STATUS.interviews)).toBe(true);
    expect(isClosedStatus(STATUS.interviews)).toBe(false);
  });

  it("wishlist is neither active nor closed", () => {
    expect(isActiveStatus(STATUS.wishlist)).toBe(false);
    expect(isClosedStatus(STATUS.wishlist)).toBe(false);
  });

  it("no status is both active and closed", () => {
    for (const s of Object.values(STATUS)) {
      expect(isActiveStatus(s) && isClosedStatus(s)).toBe(false);
    }
  });
});

describe("getStatusRank", () => {
  it("level-1 statuses rank before level-2 which rank before level-3", () => {
    expect(getStatusRank(STATUS.interviews)).toBeLessThan(getStatusRank(STATUS.offer));
    expect(getStatusRank(STATUS.offer)).toBeLessThan(getStatusRank(STATUS.accepted));
  });

  it("preserves within-level ordering", () => {
    // level 1: [interviews, cancelled, applied, ghosted, rejected]
    expect(getStatusRank(STATUS.interviews)).toBeLessThan(getStatusRank(STATUS.cancelled));
    expect(getStatusRank(STATUS.cancelled)).toBeLessThan(getStatusRank(STATUS.applied));
    expect(getStatusRank(STATUS.applied)).toBeLessThan(getStatusRank(STATUS.ghosted));
    expect(getStatusRank(STATUS.ghosted)).toBeLessThan(getStatusRank(STATUS.rejected));
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
