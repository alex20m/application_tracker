import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";
import { STATUS } from "@/lib/statuses";
import type { StatusEvent } from "@/lib/types";

// Must mock before importing the action
const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// revalidatePath is already mocked in tests/setup.ts
import { createApplicationAction } from "@/app/applications/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("company", overrides.company ?? "Acme");
  fd.set("role", overrides.role ?? "Engineer");
  fd.set("location", overrides.location ?? "Remote");
  fd.set("applied_on", overrides.applied_on ?? "2026-05-01");
  for (const key of ["source", "notes", "status", "return_path"]) {
    if (overrides[key] !== undefined) fd.set(key, overrides[key]);
  }
  return fd;
}

/** The single row handed to `insert`. */
function insertedRow(): Record<string, unknown> {
  const rows = mockSupabase.onlyQuery("insert").payload as Array<Record<string, unknown>>;
  expect(rows).toHaveLength(1);
  return rows[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("createApplicationAction", () => {
  it("stores the submitted fields against the signed-in user", async () => {
    const fd = makeFormData({ source: "LinkedIn", notes: "Referred by Sam" });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    expect(mockSupabase.onlyQuery("insert").table).toBe("applications");
    expect(insertedRow()).toMatchObject({
      user_id: mockUser.id,
      company: "Acme",
      role: "Engineer",
      location: "Remote",
      source: "LinkedIn",
      notes: "Referred by Sam",
      applied_on: "2026-05-01",
      status: STATUS.applied,
    });
  });

  it("seeds the status history with a single applied event", async () => {
    await expect(createApplicationAction(null, makeFormData())).rejects.toMatchObject({
      type: "redirect",
    });

    const events = insertedRow().events as StatusEvent[];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from_status: null, to_status: STATUS.applied });
    // Analytics reads changed_at as an ISO timestamp; a Date object or a bare
    // date string would break every downstream day calculation.
    expect(events[0].changed_at).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });

  it("stores blank source and notes as null rather than empty strings", async () => {
    const fd = makeFormData({ source: "", notes: "" });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    const row = insertedRow();
    expect(row.source).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("trims surrounding whitespace off the submitted text fields", async () => {
    const fd = makeFormData({ company: "  Acme  ", role: "  Engineer  " });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    expect(insertedRow()).toMatchObject({ company: "Acme", role: "Engineer" });
  });

  it("redirects to the applications list on success", async () => {
    await expect(createApplicationAction(null, makeFormData())).rejects.toMatchObject({
      type: "redirect",
      url: "/applications",
    });
  });

  it("returns to an allowed filtered list when one is requested", async () => {
    const fd = makeFormData({ return_path: "/applications?filter=all" });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications?filter=all",
    });
  });

  it("ignores an off-site return_path instead of redirecting to it", async () => {
    // An unchecked return_path is an open redirect: the form posts it, so an
    // attacker-supplied link could bounce a signed-in user to another origin.
    const fd = makeFormData({ return_path: "https://evil.example.com/phish" });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications",
    });
  });

  it.each([
    ["company", { company: "" }],
    ["company is only whitespace", { company: "   " }],
    ["role", { role: "" }],
    ["location", { location: "" }],
  ])("rejects the submission and writes nothing when %s is empty", async (_label, overrides) => {
    const result = await createApplicationAction(null, makeFormData(overrides));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please check your input and try again.");
    expect(mockSupabase.queriesOf("insert")).toHaveLength(0);
  });

  it("rejects an applied_on that is not a YYYY-MM-DD date", async () => {
    const result = await createApplicationAction(null, makeFormData({ applied_on: "01/05/2026" }));

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("insert")).toHaveLength(0);
  });

  it("falls back to applied when the submitted status is not a known status", async () => {
    const fd = makeFormData({ status: "not-a-status" });

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({ type: "redirect" });

    expect(insertedRow().status).toBe(STATUS.applied);
  });

  it("reports a failed insert without leaking the database error", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      insertError: { message: "duplicate key value violates unique constraint" },
    });
    requireUserMock.mockResolvedValue({
      supabase: errorSupabase as never,
      user: mockUser as never,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createApplicationAction(null, makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("constraint");
  });
});
