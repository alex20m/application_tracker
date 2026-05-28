import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appendStatusEvent } from "@/lib/applications";
import { STATUS } from "@/lib/statuses";
import type { StatusEvent } from "@/lib/types";

const FAKE_NOW = "2026-05-24T10:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(FAKE_NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("appendStatusEvent", () => {
  it("appends a new event for a normal (non-applied) transition", () => {
    const existing: StatusEvent[] = [
      { from_status: null, to_status: STATUS.applied, changed_at: "2026-01-01T00:00:00.000Z" },
      { from_status: STATUS.applied, to_status: STATUS.interviews, changed_at: "2026-02-01T00:00:00.000Z" },
    ];

    const result = appendStatusEvent(STATUS.interviews, STATUS.offer, existing);

    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      from_status: STATUS.interviews,
      to_status: STATUS.offer,
      changed_at: FAKE_NOW,
    });
  });

  it("uses the current timestamp", () => {
    const result = appendStatusEvent(STATUS.interviews, STATUS.offer, []);
    expect(result[0].changed_at).toBe(FAKE_NOW);
  });

  it("does not mutate the original events array", () => {
    const events: StatusEvent[] = [
      { from_status: STATUS.applied, to_status: STATUS.interviews, changed_at: "2026-01-01T00:00:00.000Z" },
    ];
    const original = [...events];
    appendStatusEvent(STATUS.interviews, STATUS.offer, events);
    expect(events).toEqual(original);
  });

  describe("applied special case", () => {
    it("replaces the null→applied seed event instead of appending", () => {
      const seedEvent: StatusEvent = {
        from_status: null,
        to_status: STATUS.applied,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.applied, STATUS.interviews, [seedEvent]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        from_status: null,
        to_status: STATUS.interviews,
        changed_at: FAKE_NOW,
      });
    });

    it("keeps other events and only removes the null→applied seed", () => {
      const otherEvent: StatusEvent = {
        from_status: STATUS.wishlist,
        to_status: STATUS.applied,
        changed_at: "2025-12-01T00:00:00.000Z",
      };
      const seedEvent: StatusEvent = {
        from_status: null,
        to_status: STATUS.applied,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.applied, STATUS.interviews, [otherEvent, seedEvent]);

      // otherEvent has from_status=wishlist (not null), so it's kept
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(otherEvent);
      expect(result[1].to_status).toBe(STATUS.interviews);
    });

    it("appends normally when there is no null→applied seed", () => {
      const event: StatusEvent = {
        from_status: STATUS.wishlist,
        to_status: STATUS.applied,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.applied, STATUS.interviews, [event]);
      // no seed to replace, so just appends
      expect(result).toHaveLength(2);
    });
  });

  describe("ghosted special case", () => {
    it("replaces null→ghosted seed when transitioning away from ghosted", () => {
      const seedEvent: StatusEvent = {
        from_status: null,
        to_status: STATUS.ghosted,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.ghosted, STATUS.interviews, [seedEvent]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        from_status: null,
        to_status: STATUS.interviews,
        changed_at: FAKE_NOW,
      });
    });

    it("also clears null→applied seed when transitioning away from ghosted", () => {
      // Edge case: app was applied, auto-ghosted but seed still shows applied
      const seedEvent: StatusEvent = {
        from_status: null,
        to_status: STATUS.applied,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.ghosted, STATUS.interviews, [seedEvent]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        from_status: null,
        to_status: STATUS.interviews,
        changed_at: FAKE_NOW,
      });
    });

    it("keeps non-seed events when transitioning from ghosted", () => {
      const otherEvent: StatusEvent = {
        from_status: STATUS.wishlist,
        to_status: STATUS.applied,
        changed_at: "2025-12-01T00:00:00.000Z",
      };
      const seedEvent: StatusEvent = {
        from_status: null,
        to_status: STATUS.ghosted,
        changed_at: "2026-01-01T00:00:00.000Z",
      };
      const result = appendStatusEvent(STATUS.ghosted, STATUS.rejected, [otherEvent, seedEvent]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(otherEvent);
      expect(result[1]).toEqual({
        from_status: null,
        to_status: STATUS.rejected,
        changed_at: FAKE_NOW,
      });
    });
  });
});
