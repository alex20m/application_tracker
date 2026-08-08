import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock, expectScopedToUserRow } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import {
  deleteApplicationFromListAction,
  deleteAllApplicationsAction,
} from "@/app/applications/actions";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES, STATUS } from "@/lib/statuses";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000003";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("deleteApplicationFromListAction", () => {
  it("deletes only the named row, and only if the signed-in user owns it", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);

    await deleteApplicationFromListAction(fd);

    const del = mockSupabase.onlyQuery("delete");
    expect(del.table).toBe("applications");
    expectScopedToUserRow(del, { userId: mockUser.id, applicationId: VALID_APP_ID });
  });

  it.each([
    ["not a UUID", "not-a-uuid"],
    ["a SQL-ish string", "' OR 1=1 --"],
    ["empty", ""],
  ])("deletes nothing when the application id is %s", async (_label, id) => {
    const fd = new FormData();
    fd.set("application_id", id);

    await deleteApplicationFromListAction(fd);

    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("deletes nothing when the application id is missing", async () => {
    await deleteApplicationFromListAction(new FormData());
    expect(mockSupabase.queries).toHaveLength(0);
  });
});

describe("deleteAllApplicationsAction", () => {
  it("deletes exactly the open statuses for the signed-in user", async () => {
    const result = await deleteAllApplicationsAction("open");

    expect(result.success).toBe(true);
    const del = mockSupabase.onlyQuery("delete");
    expect(del.table).toBe("applications");
    expect(del.eqValue("user_id")).toBe(mockUser.id);
    // Exact set: a superset would delete rows the user did not ask to clear —
    // e.g. leaking wishlist entries or closed applications into "Delete all open".
    expect(del.inValue("status")).toEqual([...ACTIVE_STATUSES]);
  });

  it("deletes exactly the closed statuses for the signed-in user", async () => {
    const result = await deleteAllApplicationsAction("closed");

    expect(result.success).toBe(true);
    const del = mockSupabase.onlyQuery("delete");
    expect(del.eqValue("user_id")).toBe(mockUser.id);
    expect(del.inValue("status")).toEqual([...CLOSED_STATUSES]);
  });

  it("never sweeps wishlist rows into an open or closed bulk delete", async () => {
    for (const scope of ["open", "closed"] as const) {
      const supabase = buildSupabaseMock({ user: mockUser });
      requireUserMock.mockResolvedValue({ supabase: supabase as never, user: mockUser as never });

      await deleteAllApplicationsAction(scope);

      const statuses = supabase.onlyQuery("delete").inValue("status") as string[];
      expect(statuses, `scope=${scope}`).not.toContain(STATUS.wishlist);
    }
  });

  it("deletes every row of the signed-in user, unfiltered, for the all scope", async () => {
    const result = await deleteAllApplicationsAction("all");

    expect(result.success).toBe(true);
    const del = mockSupabase.onlyQuery("delete");
    expect(del.eqValue("user_id")).toBe(mockUser.id);
    // "All" is the only scope with no status filter — and it must still be
    // scoped to the user, so user_id is the sole filter.
    expect(del.filterKeys()).toEqual([["eq", "user_id"]]);
  });

  it("reports a failed delete without leaking the database error", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      deleteError: { message: "violates foreign key constraint \"events_fk\"" },
    });
    requireUserMock.mockResolvedValue({
      supabase: errorSupabase as never,
      user: mockUser as never,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAllApplicationsAction("open");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("events_fk");
  });
});
