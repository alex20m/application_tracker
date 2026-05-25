import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
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
  },
}));

import { changePasswordAction } from "@/app/settings/actions";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
});

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("changePasswordAction", () => {
  it("returns error when new passwords do not match", async () => {
    const fd = makeFormData({
      currentPassword: "current1234",
      newPassword: "newpassword1",
      confirmPassword: "newpassword2",
    });
    const result = await changePasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/match/i);
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns error when new password is same as current", async () => {
    const fd = makeFormData({
      currentPassword: "samepass1",
      newPassword: "samepass1",
      confirmPassword: "samepass1",
    });
    const result = await changePasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/differ/i);
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns error and does not call updateUser when current password is wrong", async () => {
    const wrongCurrentSupabase = buildSupabaseMock({
      user: mockUser,
      signInError: { message: "invalid credentials" },
    });
    requireUserMock.mockResolvedValue({
      supabase: wrongCurrentSupabase as never,
      user: mockUser as never,
    });
    const fd = makeFormData({
      currentPassword: "wrongpassword",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    });
    const result = await changePasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/current password/i);
    expect(wrongCurrentSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with new password and returns success message on happy path", async () => {
    const fd = makeFormData({
      currentPassword: "current1234",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    });
    const result = await changePasswordAction(null, fd);
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockUser.email,
      password: "current1234",
    });
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword1" });
  });

  it("returns error when user has no email (OAuth-only account)", async () => {
    const oauthUser = { id: "oauth-id", email: "" };
    requireUserMock.mockResolvedValue({
      supabase: mockSupabase as never,
      user: oauthUser as never,
    });
    const fd = makeFormData({
      currentPassword: "current1234",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    });
    const result = await changePasswordAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not available/i);
  });
});
