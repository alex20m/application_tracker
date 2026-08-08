import { describe, it, expect } from "vitest";
import {
  STATUS,
  STATUS_NAMES,
  STATUS_NEXT,
  STATUS_THEME,
  FINAL_STATUSES,
  CLOSED_STATUSES,
  ACTIVE_STATUSES,
  isClosedStatus,
  isActiveStatus,
  getStatusRank,
  statusStageIndex,
  type ApplicationStatus,
} from "@/lib/statuses";

const ALL_STATUSES = Object.values(STATUS) as ApplicationStatus[];

describe("STATUS_NEXT", () => {
  // The pipeline's rulebook, written out literally rather than derived from the
  // source. Every other assertion about transitions is structural (no
  // self-loops, no duplicates, terminal statuses are empty) and stays true if
  // an illegal edge is added — e.g. letting an application jump from applied
  // straight to offer, skipping interviews. Only an explicit table catches that.
  const EXPECTED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    wishlist: ["applied"],
    applied: ["cancelled", "rejected", "interviews", "ghosted"],
    ghosted: ["cancelled", "rejected", "interviews"],
    cancelled: [],
    withdrew: [],
    rejected: [],
    interviews: ["withdrew", "no_offer", "offer"],
    no_offer: [],
    offer: ["accepted", "declined"],
    accepted: [],
    declined: [],
  };

  it.each(Object.keys(EXPECTED_TRANSITIONS) as ApplicationStatus[])(
    "allows exactly the documented moves out of %s",
    (status) => {
      expect(STATUS_NEXT[status]).toEqual(EXPECTED_TRANSITIONS[status]);
    }
  );

  it("cannot reach an offer without going through interviews", () => {
    // The single most consequential rule in the graph: an offer that skipped
    // interviews would corrupt every interview-to-offer conversion metric.
    for (const [from, targets] of Object.entries(STATUS_NEXT) as [
      ApplicationStatus,
      ApplicationStatus[],
    ][]) {
      if (from === STATUS.interviews) continue;
      expect(targets, `${from} must not lead straight to an offer`).not.toContain(STATUS.offer);
    }
  });

  it("declares a transition list for every status", () => {
    // A missing key means the app crashes when a user reaches that status and
    // the UI asks what it can move to next.
    expect(Object.keys(STATUS_NEXT).sort()).toEqual([...ALL_STATUSES].sort());
  });

  it("never offers a transition into the wishlist", () => {
    // The wishlist is where an application starts, not somewhere it returns to.
    for (const [from, targets] of Object.entries(STATUS_NEXT)) {
      expect(targets, `${from} must not lead back to the wishlist`).not.toContain(STATUS.wishlist);
    }
  });

  it("never offers a status as its own next step", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_NEXT[status], `${status} must not lead to itself`).not.toContain(status);
    }
  });

  it("lists no status twice within one transition list", () => {
    for (const status of ALL_STATUSES) {
      const targets = STATUS_NEXT[status];
      expect(new Set(targets).size, `${status} has duplicate targets`).toBe(targets.length);
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

  it("classifies every status as active, closed, or wishlist — none unaccounted for", () => {
    // An unclassified status would vanish from both the Open and Closed tabs,
    // leaving the application unreachable in the UI.
    const unclassified = ALL_STATUSES.filter(
      (s) => !isActiveStatus(s) && !isClosedStatus(s) && s !== STATUS.wishlist
    );
    expect(unclassified).toEqual([]);
  });

  it("treats a status with onward transitions as open, and one without as closed", () => {
    for (const status of ALL_STATUSES) {
      if (status === STATUS.wishlist) continue;
      const hasOnwardMoves = STATUS_NEXT[status].length > 0;
      expect(isActiveStatus(status), `${status} is open iff it can still move on`).toBe(
        hasOnwardMoves && status !== STATUS.ghosted
      );
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

  it("gives every status a distinct rank so ordering is never ambiguous", () => {
    const ranks = ALL_STATUSES.map(getStatusRank);
    expect(new Set(ranks).size).toBe(ALL_STATUSES.length);
  });

  it("ranks the wishlist ahead of every status in the pipeline", () => {
    for (const status of ALL_STATUSES) {
      if (status === STATUS.wishlist) continue;
      expect(getStatusRank(STATUS.wishlist)).toBeLessThan(getStatusRank(status));
    }
  });
});

// ─── statusStageIndex ────────────────────────────────────────────────────────

describe("statusStageIndex", () => {
  it.each([
    [STATUS.applied, 0],
    [STATUS.interviews, 1],
    [STATUS.offer, 2],
    [STATUS.accepted, 3],
    [STATUS.declined, 3],
  ])("puts %s at stepper stage %i", (status, expected) => {
    expect(statusStageIndex(status)).toBe(expected);
  });

  it.each([
    [STATUS.wishlist],
    [STATUS.ghosted],
    [STATUS.cancelled],
    [STATUS.withdrew],
    [STATUS.rejected],
    [STATUS.no_offer],
  ])("highlights no stage for %s", (status) => {
    // These are exits from the pipeline, not positions in it — highlighting a
    // stage would tell the user they are still progressing through it.
    expect(statusStageIndex(status)).toBe(-1);
  });

  it("advances the stage as an application progresses through the pipeline", () => {
    expect(statusStageIndex(STATUS.applied)).toBeLessThan(statusStageIndex(STATUS.interviews));
    expect(statusStageIndex(STATUS.interviews)).toBeLessThan(statusStageIndex(STATUS.offer));
    expect(statusStageIndex(STATUS.offer)).toBeLessThan(statusStageIndex(STATUS.accepted));
  });

  it("returns a stage index for every status without throwing", () => {
    for (const status of ALL_STATUSES) {
      const index = statusStageIndex(status);
      expect(Number.isInteger(index), `${status} produced ${index}`).toBe(true);
      expect(index).toBeGreaterThanOrEqual(-1);
      expect(index).toBeLessThanOrEqual(3);
    }
  });
});

// ─── Presentation tables ─────────────────────────────────────────────────────

describe("STATUS_NAMES and STATUS_THEME", () => {
  it("names every status", () => {
    // A missing name renders as blank text in the badge and the analytics legend.
    for (const status of ALL_STATUSES) {
      expect(STATUS_NAMES[status], `${status} has no display name`).toBeTruthy();
    }
  });

  it("gives every status its own sankey colour", () => {
    const colours = ALL_STATUSES.map((s) => STATUS_THEME[s].sankey);
    expect(colours.every(Boolean)).toBe(true);
    // Two statuses sharing a colour makes the flow chart unreadable.
    expect(new Set(colours).size).toBe(ALL_STATUSES.length);
  });
});
