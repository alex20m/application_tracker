import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock, expectScopedToUserRow } from "../../helpers/supabase-mock";
import { makeUser, makeApplication, makeStatusEvent } from "../../helpers/factories";
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
  for (const key of ["notes", "source", "return_path"]) {
    if (overrides[key] !== undefined) fd.set(key, overrides[key]);
  }
  return fd;
}

/** Points the action at a client whose select returns `stored`, and returns that client. */
function givenStoredApplication(stored: unknown) {
  mockSupabase = buildSupabaseMock({ user: mockUser, selectData: stored });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
  return mockSupabase;
}

/** The events array the action wrote back. */
function writtenEvents(): StatusEvent[] {
  return (mockSupabase.onlyQuery("update").payload as { events: StatusEvent[] }).events;
}

const SEED_EVENT = makeStatusEvent({
  from_status: null,
  to_status: STATUS.applied,
  changed_at: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  givenStoredApplication(
    makeApplication({
      id: VALID_APP_ID,
      user_id: mockUser.id,
      status: STATUS.applied,
      events: [SEED_EVENT],
    })
  );
});

describe("updateApplicationAction", () => {
  it("saves the edited fields on the signed-in user's own row", async () => {
    const fd = makeFormData({ company: "New Corp", role: "Staff Engineer", source: "Referral" });

    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });

    const update = mockSupabase.onlyQuery("update");
    expect(update.payload).toMatchObject({
      company: "New Corp",
      role: "Staff Engineer",
      location: "Remote",
      source: "Referral",
      applied_on: "2026-05-01",
      status: STATUS.applied,
    });
    expectScopedToUserRow(update, { userId: mockUser.id, applicationId: VALID_APP_ID });
  });

  it("reads the current row scoped to the signed-in user before writing", async () => {
    await expect(
      updateApplicationAction(VALID_APP_ID, null, makeFormData())
    ).rejects.toMatchObject({ type: "redirect" });

    expectScopedToUserRow(mockSupabase.onlyQuery("select"), {
      userId: mockUser.id,
      applicationId: VALID_APP_ID,
    });
  });

  it("appends a status event when the status changes", async () => {
    const fd = makeFormData({ status: STATUS.interviews });

    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });

    // applied is a "no response yet" status, so its null-seeded event is
    // rewritten to point at the new status rather than a second one appended.
    const events = writtenEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from_status: null, to_status: STATUS.interviews });
  });

  it("records the previous status when moving on from a status that had a response", async () => {
    givenStoredApplication(
      makeApplication({
        id: VALID_APP_ID,
        user_id: mockUser.id,
        status: STATUS.interviews,
        events: [SEED_EVENT],
      })
    );

    const fd = makeFormData({ status: STATUS.offer });
    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });

    const events = writtenEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(SEED_EVENT);
    expect(events[1]).toMatchObject({
      from_status: STATUS.interviews,
      to_status: STATUS.offer,
    });
  });

  it("leaves the status history untouched when the status is unchanged", async () => {
    const fd = makeFormData({ status: STATUS.applied, company: "Renamed Co" });

    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });

    // Editing the company must not manufacture a status event — that would
    // corrupt every time-to-response metric on the analytics page.
    expect(writtenEvents()).toEqual([SEED_EVENT]);
  });

  it("stores blank source and notes as null rather than empty strings", async () => {
    const fd = makeFormData({ source: "", notes: "" });

    await expect(updateApplicationAction(VALID_APP_ID, null, fd)).rejects.toMatchObject({
      type: "redirect",
    });

    const payload = mockSupabase.onlyQuery("update").payload as Record<string, unknown>;
    expect(payload.source).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it("redirects to the applications list on success", async () => {
    await expect(
      updateApplicationAction(VALID_APP_ID, null, makeFormData())
    ).rejects.toMatchObject({ type: "redirect", url: "/applications" });
  });

  it("returns to the application's own detail page when asked", async () => {
    const returnPath = `/applications/${VALID_APP_ID}?from=closed`;

    await expect(
      updateApplicationAction(VALID_APP_ID, null, makeFormData({ return_path: returnPath }))
    ).rejects.toMatchObject({ type: "redirect", url: returnPath });
  });

  it.each([
    ["an off-site URL", "https://evil.example.com/phish"],
    ["a protocol-relative URL", "//evil.example.com"],
    ["an unrelated in-app path", "/settings"],
  ])("ignores %s as a return path", async (_label, returnPath) => {
    // return_path arrives from the submitted form, so an unchecked value is an
    // open redirect out of a signed-in session.
    await expect(
      updateApplicationAction(VALID_APP_ID, null, makeFormData({ return_path: returnPath }))
    ).rejects.toMatchObject({ type: "redirect", url: "/applications" });
  });

  it("writes nothing and reports failure for a non-UUID application id", async () => {
    const result = await updateApplicationAction("not-a-uuid", null, makeFormData());

    expect(result.success).toBe(false);
    expect(mockSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["company", { company: "" }],
    ["role", { role: "" }],
    ["location", { location: "" }],
  ])("writes nothing when %s is empty", async (_label, overrides) => {
    const result = await updateApplicationAction(VALID_APP_ID, null, makeFormData(overrides));

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("rejects a status that is not a known status", async () => {
    const result = await updateApplicationAction(
      VALID_APP_ID,
      null,
      makeFormData({ status: "president" })
    );

    expect(result.success).toBe(false);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("writes nothing when the row is not found (another user's application)", async () => {
    givenStoredApplication(null);

    const result = await updateApplicationAction(VALID_APP_ID, null, makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
    expect(mockSupabase.queriesOf("update")).toHaveLength(0);
  });

  it("reports a failed update without leaking the database error", async () => {
    mockSupabase = buildSupabaseMock({
      user: mockUser,
      selectData: makeApplication({ id: VALID_APP_ID, user_id: mockUser.id }),
      updateError: { message: "column \"applied_on\" violates not-null constraint" },
    });
    requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateApplicationAction(VALID_APP_ID, null, makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("not-null");
  });
});
