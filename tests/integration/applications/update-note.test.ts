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
  it("calls supabase update for a valid note", async () => {
    const fd = makeFormData(VALID_APP_ID, "Great company");
    await updateApplicationNoteAction(fd);
    expect(mockSupabase.from).toHaveBeenCalledWith("applications");
  });

  it("does nothing when applicationId is not a UUID", async () => {
    const fd = makeFormData("bad-id", "Some note");
    await updateApplicationNoteAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("does nothing when notes exceed 5000 chars", async () => {
    const fd = makeFormData(VALID_APP_ID, "a".repeat(5001));
    await updateApplicationNoteAction(fd);
    // Schema validation fails → no DB call
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("does nothing when applicationId is missing", async () => {
    const fd = new FormData();
    fd.set("notes", "hello");
    await updateApplicationNoteAction(fd);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
