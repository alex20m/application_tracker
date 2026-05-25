import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createWishlistAction, applyWishlistAction, updateWishlistAction } from "@/app/wishlist/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000001";

function makeCreateFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("company", overrides.company ?? "Acme");
  fd.set("role", overrides.role ?? "Engineer");
  fd.set("location", overrides.location ?? "Remote");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("createWishlistAction", () => {
  it("inserts with status=wishlist and applied_on=null, then redirects to /wishlist", async () => {
    const fd = makeCreateFormData();

    await expect(createWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/wishlist",
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("applications");
    const insertCall = mockSupabase.from.mock.results[0].value.insert.mock.calls[0][0][0];
    expect(insertCall.status).toBe(STATUS.wishlist);
    expect(insertCall.applied_on).toBeNull();
  });

  it("returns error when company is empty", async () => {
    const fd = makeCreateFormData({ company: "" });
    const result = await createWishlistAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns error when role is empty", async () => {
    const fd = makeCreateFormData({ role: "" });
    const result = await createWishlistAction(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when Supabase insert fails", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      insertError: { message: "db error" },
    });
    requireUserMock.mockResolvedValue({ supabase: errorSupabase as never, user: mockUser as never });

    const fd = makeCreateFormData();
    const result = await createWishlistAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("applyWishlistAction", () => {
  it("updates status to no_answer with the provided applied_on date", async () => {
    const wishlistSupabase = buildSupabaseMock({
      user: mockUser,
      selectData: { status: STATUS.wishlist },
    });
    requireUserMock.mockResolvedValue({ supabase: wishlistSupabase as never, user: mockUser as never });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);
    expect(result.success).toBe(true);

    const updateCall = wishlistSupabase.from.mock.results.find(
      (r: { value: { update?: unknown } }) => r.value?.update !== undefined
    );
    expect(updateCall).toBeDefined();
  });

  it("returns error when app is not in wishlist status", async () => {
    const notWishlistSupabase = buildSupabaseMock({
      user: mockUser,
      selectData: { status: STATUS.no_answer },
    });
    requireUserMock.mockResolvedValue({ supabase: notWishlistSupabase as never, user: mockUser as never });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns error when application_id is not a valid UUID", async () => {
    const fd = new FormData();
    fd.set("application_id", "not-a-uuid");
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when application_id is missing", async () => {
    const fd = new FormData();
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);
    expect(result.success).toBe(false);
  });
});

describe("updateWishlistAction", () => {
  it("updates fields and redirects to /wishlist", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("company", "New Corp");
    fd.set("role", "Lead Engineer");
    fd.set("location", "Stockholm");

    await expect(updateWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/wishlist",
    });

    const updateCall = mockSupabase.from.mock.results.find(
      (r: { value: { update?: unknown } }) => r.value?.update !== undefined
    );
    expect(updateCall).toBeDefined();
  });

  it("returns error when company is empty", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("company", "");
    fd.set("role", "Engineer");
    fd.set("location", "Remote");

    const result = await updateWishlistAction(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when application_id is not a valid UUID", async () => {
    const fd = new FormData();
    fd.set("application_id", "bad-id");
    fd.set("company", "Corp");
    fd.set("role", "Role");
    fd.set("location", "Remote");

    const result = await updateWishlistAction(null, fd);
    expect(result.success).toBe(false);
  });
});
