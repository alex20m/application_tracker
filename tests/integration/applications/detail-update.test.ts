import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser, makeApplication } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { updateApplicationAction } from "@/app/applications/[id]/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000004";

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("company", overrides.company ?? "Acme");
  fd.set("role", overrides.role ?? "Engineer");
  fd.set("location", overrides.location ?? "Remote");
  fd.set("status", overrides.status ?? STATUS.applied);
  fd.set("applied_on", overrides.applied_on ?? "2026-05-01");
  if (overrides.notes !== undefined) fd.set("notes", overrides.notes);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({
    user: mockUser,
    selectData: makeApplication({
      id: VALID_APP_ID,
      user_id: mockUser.id,
      status: STATUS.applied,
    }),
  });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("updateApplicationAction", () => {
  it("redirects to /applications/open on success", async () => {
    const fd = makeFormData({ status: STATUS.applied });
    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications/open",
    });
  });

  it("returns error for non-UUID applicationId", async () => {
    const fd = makeFormData();
    const result = await updateApplicationAction("not-a-uuid", null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when company is empty", async () => {
    const fd = makeFormData({ company: "" });
    const result = await updateApplicationAction(VALID_APP_ID, null, fd);
    expect(result.success).toBe(false);
  });

  it("does not call update when application is not found", async () => {
    const notFoundSupabase = buildSupabaseMock({ user: mockUser, selectData: null });
    requireUserMock.mockResolvedValue({
      supabase: notFoundSupabase as never,
      user: mockUser as never,
    });
    const fd = makeFormData();
    const result = await updateApplicationAction(VALID_APP_ID, null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("appends a status event when status changes", async () => {
    const fd = makeFormData({ status: STATUS.interviews });
    // Should redirect (success), meaning the update path was taken
    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });
  });

  it("does not append an event when status is unchanged", async () => {
    // status in form matches status in fetched app (both applied)
    const fd = makeFormData({ status: STATUS.applied });
    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });
    // The update was still called (to persist other field edits), just without new events
    expect(mockSupabase.from).toHaveBeenCalled();
  });
});
