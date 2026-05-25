import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
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
import { STATUS } from "@/lib/statuses";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000003";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("deleteApplicationFromListAction", () => {
  it("calls supabase delete for a valid UUID", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    await deleteApplicationFromListAction(fd);
    expect(mockSupabase.from).toHaveBeenCalledWith("applications");
  });

  it("does nothing when applicationId is not a UUID", async () => {
    const fd = new FormData();
    fd.set("application_id", "not-a-uuid");
    await deleteApplicationFromListAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("does nothing when applicationId is missing", async () => {
    await deleteApplicationFromListAction(new FormData());
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

describe("deleteAllApplicationsAction", () => {
  it("returns { success: true } on success", async () => {
    const result = await deleteAllApplicationsAction();
    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("applications");
  });

  it("returns { success: false, error } when Supabase delete fails", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      deleteError: { message: "constraint violation" },
    });
    requireUserMock.mockResolvedValue({
      supabase: errorSupabase as never,
      user: mockUser as never,
    });

    const result = await deleteAllApplicationsAction();
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("should exclude wishlisted roles", async () => {
    await deleteAllApplicationsAction();
    const deleteBuilder = mockSupabase.from.mock.results[0].value.delete.mock.results[0].value;
    const eqCalls = deleteBuilder.eq.mock.calls;
    const neqCalls = deleteBuilder.neq.mock.calls;
    expect(eqCalls.some((call: any) => call[0] === "status")).toBe(false);
    expect(neqCalls.some((call: any) => call[0] === "status" && call[1] === STATUS.wishlist)).toBe(true);
  });
});
