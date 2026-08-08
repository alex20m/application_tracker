import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock, expectScopedToUserRow } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";
import type { StatusEvent } from "@/lib/types";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import {
  createWishlistAction,
  applyWishlistAction,
  updateWishlistAction,
  deleteWishlistAction,
  deleteAllWishlistAction,
} from "@/app/wishlist/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000001";

function makeCreateFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("company", overrides.company ?? "Acme");
  fd.set("role", overrides.role ?? "Engineer");
  fd.set("location", overrides.location ?? "Remote");
  for (const key of ["source", "notes", "application_id", "return_path"]) {
    if (overrides[key] !== undefined) fd.set(key, overrides[key]);
  }
  return fd;
}

/** Points the actions at a client whose select returns `stored`, and returns that client. */
function givenStoredApplication(stored: unknown) {
  mockSupabase = buildSupabaseMock({ user: mockUser, selectData: stored });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
  return mockSupabase;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("createWishlistAction", () => {
  it("stores an unapplied wishlist row against the signed-in user", async () => {
    const fd = makeCreateFormData({ source: "Careers page", notes: "Dream job" });

    await expect(createWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/wishlist",
    });

    const insert = mockSupabase.onlyQuery("insert");
    expect(insert.table).toBe("applications");
    const rows = insert.payload as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: mockUser.id,
      company: "Acme",
      role: "Engineer",
      location: "Remote",
      source: "Careers page",
      notes: "Dream job",
      status: STATUS.wishlist,
    });
    // A wishlist entry has not been applied to, so it carries no applied date —
    // otherwise it would show up in the analytics trend as a real application.
    expect(rows[0].applied_on).toBeNull();
  });

  it("seeds the status history with a single wishlist event", async () => {
    await expect(createWishlistAction(null, makeCreateFormData())).rejects.toMatchObject({
      type: "redirect",
    });

    const rows = mockSupabase.onlyQuery("insert").payload as Array<Record<string, unknown>>;
    const events = rows[0].events as StatusEvent[];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from_status: null, to_status: STATUS.wishlist });
  });

  it("stores blank source and notes as null rather than empty strings", async () => {
    const fd = makeCreateFormData({ source: "", notes: "" });

    await expect(createWishlistAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    const rows = mockSupabase.onlyQuery("insert").payload as Array<Record<string, unknown>>;
    expect(rows[0].source).toBeNull();
    expect(rows[0].notes).toBeNull();
  });

  it.each([
    ["company", { company: "" }],
    ["role", { role: "" }],
    ["location", { location: "" }],
  ])("writes nothing when %s is empty", async (_label, overrides) => {
    const result = await createWishlistAction(null, makeCreateFormData(overrides));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please check your input and try again.");
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("reports a failed insert without leaking the database error", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      insertError: { message: "duplicate key value violates unique constraint" },
    });
    requireUserMock.mockResolvedValue({ supabase: errorSupabase as never, user: mockUser as never });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createWishlistAction(null, makeCreateFormData());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("constraint");
  });
});

describe("applyWishlistAction", () => {
  it("moves the entry to applied with the chosen date and a fresh status history", async () => {
    givenStoredApplication({ status: STATUS.wishlist });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);

    expect(result.success).toBe(true);
    const update = mockSupabase.onlyQuery("update");
    expect(update.payload).toMatchObject({
      status: STATUS.applied,
      applied_on: "2026-05-20",
    });
    // The wishlist event is replaced, not appended to: analytics counts the
    // application as starting the day it was applied to.
    const events = (update.payload as { events: StatusEvent[] }).events;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from_status: null, to_status: STATUS.applied });
    expectScopedToUserRow(update, { userId: mockUser.id, applicationId: VALID_APP_ID });
  });

  it("reads the current row scoped to the signed-in user before writing", async () => {
    givenStoredApplication({ status: STATUS.wishlist });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");
    await applyWishlistAction(null, fd);

    expectScopedToUserRow(mockSupabase.onlyQuery("select"), {
      userId: mockUser.id,
      applicationId: VALID_APP_ID,
    });
  });

  it("stores a null applied date when none was chosen", async () => {
    givenStoredApplication({ status: STATUS.wishlist });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "");

    await applyWishlistAction(null, fd);

    expect(mockSupabase.onlyQuery("update").payload).toMatchObject({ applied_on: null });
  });

  it("refuses to re-apply an entry that has already left the wishlist", async () => {
    // Otherwise a stale tab could reset a live application's history back to
    // "just applied", wiping its interview and offer events.
    givenStoredApplication({ status: STATUS.interviews });

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Application is not in wishlist.");
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("refuses when the row is not found (another user's entry)", async () => {
    givenStoredApplication(null);

    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it.each([
    ["not a UUID", "not-a-uuid"],
    ["missing", ""],
  ])("reads and writes nothing when the application id is %s", async (_label, id) => {
    const fd = new FormData();
    if (id) fd.set("application_id", id);
    fd.set("applied_on", "2026-05-20");

    const result = await applyWishlistAction(null, fd);

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });
});

describe("updateWishlistAction", () => {
  it("saves the edited fields on the user's own wishlist row only", async () => {
    const fd = makeCreateFormData({
      application_id: VALID_APP_ID,
      company: "New Corp",
      role: "Lead Engineer",
      location: "Stockholm",
    });

    await expect(updateWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/wishlist",
    });

    const update = mockSupabase.onlyQuery("update");
    expect(update.payload).toMatchObject({
      company: "New Corp",
      role: "Lead Engineer",
      location: "Stockholm",
    });
    expectScopedToUserRow(update, { userId: mockUser.id, applicationId: VALID_APP_ID });
    // The status filter keeps this edit form from rewriting a real application.
    expect(update.eqValue("status")).toBe(STATUS.wishlist);
  });

  it("never writes a status, so editing cannot move the row out of the wishlist", async () => {
    const fd = makeCreateFormData({ application_id: VALID_APP_ID });

    await expect(updateWishlistAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    expect(mockSupabase.onlyQuery("update").payload).not.toHaveProperty("status");
  });

  it("returns to the entry's own detail page when asked", async () => {
    const returnPath = `/wishlist/${VALID_APP_ID}`;
    const fd = makeCreateFormData({ application_id: VALID_APP_ID, return_path: returnPath });

    await expect(updateWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: returnPath,
    });
  });

  it.each([
    ["an off-site URL", "https://evil.example.com/phish"],
    ["a protocol-relative URL", "//evil.example.com"],
    ["an unrelated in-app path", "/settings"],
  ])("ignores %s as a return path", async (_label, returnPath) => {
    const fd = makeCreateFormData({ application_id: VALID_APP_ID, return_path: returnPath });

    await expect(updateWishlistAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/wishlist",
    });
  });

  it("writes nothing when company is empty", async () => {
    const fd = makeCreateFormData({ application_id: VALID_APP_ID, company: "" });

    const result = await updateWishlistAction(null, fd);

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("writes nothing when the application id is not a UUID", async () => {
    const fd = makeCreateFormData({ application_id: "bad-id" });

    const result = await updateWishlistAction(null, fd);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid application.");
    expect(mockSupabase.queries).toHaveLength(0);
  });
});

describe("deleteWishlistAction", () => {
  it("deletes only the user's own wishlist row", async () => {
    const fd = new FormData();
    fd.set("application_id", VALID_APP_ID);

    await deleteWishlistAction(fd);

    const del = mockSupabase.onlyQuery("delete");
    expectScopedToUserRow(del, { userId: mockUser.id, applicationId: VALID_APP_ID });
    // Without the status filter this "remove from wishlist" button could delete
    // a real application that had since been applied to.
    expect(del.eqValue("status")).toBe(STATUS.wishlist);
  });

  it.each([
    ["not a UUID", "bad-id"],
    ["missing", ""],
  ])("deletes nothing when the application id is %s", async (_label, id) => {
    const fd = new FormData();
    if (id) fd.set("application_id", id);

    await deleteWishlistAction(fd);

    expect(mockSupabase.queries).toHaveLength(0);
  });
});

describe("deleteAllWishlistAction", () => {
  it("deletes only wishlist rows, and only the signed-in user's", async () => {
    const result = await deleteAllWishlistAction();

    expect(result.success).toBe(true);
    const del = mockSupabase.onlyQuery("delete");
    expect(del.table).toBe("applications");
    expect(del.eqValue("user_id")).toBe(mockUser.id);
    expect(del.eqValue("status")).toBe(STATUS.wishlist);
    // Exactly these two filters — anything less would reach beyond the wishlist
    // or beyond this user.
    expect(del.filterKeys()).toEqual([
      ["eq", "user_id"],
      ["eq", "status"],
    ]);
  });

  it("reports a failed delete without leaking the database error", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      deleteError: { message: "permission denied for table applications" },
    });
    requireUserMock.mockResolvedValue({ supabase: errorSupabase as never, user: mockUser as never });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAllWishlistAction();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("permission denied");
  });
});
