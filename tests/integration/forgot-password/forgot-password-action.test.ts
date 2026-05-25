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

import { forgotPasswordAction } from "@/app/forgot-password/actions";
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

describe("forgotPasswordAction", () => {
  it("returns error for invalid email", async () => {
    const fd = makeFormData({ email: "not-an-email" });
    const result = await forgotPasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("calls resetPasswordForEmail with redirectTo pointing to the callback route handler", async () => {
    const fd = makeFormData({ email: "user@example.com" });
    await forgotPasswordAction(null, fd);
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/api/auth/reset-password") })
    );
  });

  it("always returns generic success message even on Supabase error (anti-enumeration)", async () => {
    const errorSupabase = buildSupabaseMock({ resetPasswordForEmailError: { message: "rate limit" } });
    createClientMock.mockResolvedValue(errorSupabase as never);
    const fd = makeFormData({ email: "user@example.com" });
    const result = await forgotPasswordAction(null, fd);
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it("always returns generic success message on Supabase success", async () => {
    const fd = makeFormData({ email: "user@example.com" });
    const result = await forgotPasswordAction(null, fd);
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });
});
