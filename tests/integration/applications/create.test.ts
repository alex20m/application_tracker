import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";

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
  if (overrides.source !== undefined) fd.set("source", overrides.source);
  if (overrides.notes !== undefined) fd.set("notes", overrides.notes);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

describe("createApplicationAction", () => {
  it("inserts an application and redirects on success", async () => {
    const fd = makeFormData();

    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications/open",
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("applications");
  });

  it("returns error when company is empty", async () => {
    const fd = makeFormData({ company: "" });
    const result = await createApplicationAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns error when role is empty", async () => {
    const fd = makeFormData({ role: "" });
    const result = await createApplicationAction(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when Supabase insert fails", async () => {
    const errorSupabase = buildSupabaseMock({
      user: mockUser,
      insertError: { message: "db error" },
    });
    requireUserMock.mockResolvedValue({
      supabase: errorSupabase as never,
      user: mockUser as never,
    });

    const fd = makeFormData();
    const result = await createApplicationAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("redirects to /applications (not /applications/new) on success", async () => {
    const fd = makeFormData();
    await expect(createApplicationAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/applications/open",
    });
  });
});
