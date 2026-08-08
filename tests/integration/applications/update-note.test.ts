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

import { updateApplicationNoteAction } from "@/app/applications/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const VALID_APP_ID = "a1b2c3d4-e5f6-4000-a000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

function makeFormData(applicationId: string, notes: string): FormData {
  const fd = new FormData();
  fd.set("application_id", applicationId);
  fd.set("notes", notes);
  return fd;
}

describe("updateApplicationNoteAction", () => {
  it("saves the submitted note on the signed-in user's own row", async () => {
    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, "Great company"));

    const update = mockSupabase.onlyQuery("update");
    expect(update.table).toBe("applications");
    expect(update.payload).toMatchObject({ notes: "Great company" });
    expectScopedToUserRow(update, { userId: mockUser.id, applicationId: VALID_APP_ID });
  });

  it("clears the note to null when submitted empty", async () => {
    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, ""));

    expect(mockSupabase.onlyQuery("update").payload).toMatchObject({ notes: null });
  });

  it("touches updated_at so the row reflects the edit", async () => {
    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, "note"));

    const { updated_at: updatedAt } = mockSupabase.onlyQuery("update").payload as {
      updated_at: string;
    };
    expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });

  it("does not overwrite any field other than the note and its timestamp", async () => {
    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, "note"));

    // A note edit that also wrote status/company/events would silently revert
    // whatever the detail form last saved.
    const payload = mockSupabase.onlyQuery("update").payload as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["notes", "updated_at"]);
  });

  it("keeps a note of exactly the 5000-character limit", async () => {
    const atLimit = "a".repeat(5000);

    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, atLimit));

    expect(mockSupabase.onlyQuery("update").payload).toMatchObject({ notes: atLimit });
  });

  it("writes nothing when the note exceeds the 5000-character limit", async () => {
    await updateApplicationNoteAction(makeFormData(VALID_APP_ID, "a".repeat(5001)));

    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("writes nothing when the application id is not a UUID", async () => {
    await updateApplicationNoteAction(makeFormData("bad-id", "Some note"));

    expect(mockSupabase.queries).toHaveLength(0);
  });

  it("writes nothing when the application id is missing", async () => {
    const fd = new FormData();
    fd.set("notes", "hello");

    await updateApplicationNoteAction(fd);

    expect(mockSupabase.queries).toHaveLength(0);
  });
});
