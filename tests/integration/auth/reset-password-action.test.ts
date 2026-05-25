import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";

let mockSupabase = buildSupabaseMock();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  APP_URL: "http://localhost:3000",
  ROUTES: {
    login: "/login",
    applications: "/applications",
    authCallback: "/api/auth/callback",
    signOut: "/auth/signout",
    forgotPassword: "/forgot-password",
    resetPassword: "/auth/reset-password",
    resetPasswordCallback: "/api/auth/reset-password",
  },
}));

import { resetPasswordAction } from "@/app/auth/reset-password/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createClientMock = vi.mocked(createSupabaseServerClient);

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock();
  createClientMock.mockResolvedValue(mockSupabase as never);
});

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("resetPasswordAction", () => {
  it("returns error when passwords do not match", async () => {
    const fd = makeFormData({ password: "newpassword1", confirmPassword: "newpassword2" });
    const result = await resetPasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/match/i);
  });

  it("returns error when password is too short", async () => {
    const fd = makeFormData({ password: "short", confirmPassword: "short" });
    const result = await resetPasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/8 characters/i);
  });

  it("calls updateUser with new password and redirects to /login?reset=ok on success", async () => {
    const fd = makeFormData({ password: "newpassword1", confirmPassword: "newpassword1" });
    await expect(resetPasswordAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/login?reset=ok",
    });
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword1" });
  });

  it("returns error when updateUser fails", async () => {
    const errorSupabase = buildSupabaseMock({ updateUserError: { message: "session expired" } });
    createClientMock.mockResolvedValue(errorSupabase as never);
    const fd = makeFormData({ password: "newpassword1", confirmPassword: "newpassword1" });
    const result = await resetPasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
