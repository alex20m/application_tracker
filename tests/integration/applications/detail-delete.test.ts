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

import { deleteApplicationAction } from "@/app/applications/[id]/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000020";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("deleteApplicationAction", () => {
  it("deletes only the named row, and only if the signed-in user owns it", async () => {
    await expect(deleteApplicationAction(APP_ID)).rejects.toMatchObject({ type: "redirect" });

    const del = mockSupabase.onlyQuery("delete");
    expect(del.table).toBe("applications");
    expectScopedToUserRow(del, { userId: mockUser.id, applicationId: APP_ID });
  });

  it("returns to the applications list by default", async () => {
    await expect(deleteApplicationAction(APP_ID)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications",
    });
  });

  it("returns to an allowed filtered list when one is requested", async () => {
    await expect(
      deleteApplicationAction(APP_ID, "/applications?filter=closed")
    ).rejects.toMatchObject({ type: "redirect", url: "/applications?filter=closed" });
  });

  it.each([
    ["an off-site URL", "https://evil.example.com/phish"],
    ["a protocol-relative URL", "//evil.example.com"],
    ["a path that merely starts like an allowed one", "/applications-evil"],
    ["an unrelated in-app path", "/settings"],
  ])("ignores %s as a return path", async (_label, returnPath) => {
    await expect(deleteApplicationAction(APP_ID, returnPath)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications",
    });
  });

  it("deletes nothing when the application id is not a UUID", async () => {
    const result = await deleteApplicationAction("not-a-uuid");

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("reports a failed delete without leaking the database error", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      deleteError: { message: "permission denied for table applications" },
    });
    requireUserMock.mockResolvedValue({
      supabase: errorSupabase as never,
      user: mockUser as never,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteApplicationAction(APP_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("permission denied");
  });
});
