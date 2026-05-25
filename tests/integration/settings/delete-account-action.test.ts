import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";
import { makeUser } from "../../helpers/factories";

const mockUser = makeUser();
let mockSupabase = buildSupabaseMock({ user: mockUser });

const mockAdminDeleteUser = vi.fn().mockResolvedValue({ error: null });
const mockAdminClient = {
  auth: {
    admin: {
      deleteUser: mockAdminDeleteUser,
    },
  },
};

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
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

import { deleteAccountAction } from "@/app/settings/actions";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const requireUserMock = vi.mocked(requireUser);
const createAdminClientMock = vi.mocked(createSupabaseAdminClient);

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = buildSupabaseMock({ user: mockUser });
  requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: mockUser as never });
  createAdminClientMock.mockReturnValue(mockAdminClient as never);
  mockAdminDeleteUser.mockResolvedValue({ error: null });
});

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("deleteAccountAction", () => {
  it("returns error when password field is empty", async () => {
    const fd = makeFormData({ password: "" });
    const result = await deleteAccountAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it("returns error and does not delete when password is wrong", async () => {
    const wrongPwSupabase = buildSupabaseMock({
      user: mockUser,
      signInError: { message: "invalid credentials" },
    });
    requireUserMock.mockResolvedValue({ supabase: wrongPwSupabase as never, user: mockUser as never });
    const fd = makeFormData({ password: "wrongpassword" });
    const result = await deleteAccountAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/incorrect password/i);
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it("calls admin.deleteUser and redirects to login on happy path", async () => {
    const fd = makeFormData({ password: "correctpassword" });
    await expect(deleteAccountAction(null, fd)).rejects.toMatchObject({
      type: "redirect",
      url: "/login",
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockUser.email,
      password: "correctpassword",
    });
    expect(mockAdminDeleteUser).toHaveBeenCalledWith(mockUser.id);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("returns error when admin.deleteUser fails", async () => {
    mockAdminDeleteUser.mockResolvedValue({ error: { message: "delete failed" } });
    const fd = makeFormData({ password: "correctpassword" });
    const result = await deleteAccountAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/failed to delete/i);
    expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("returns error when user has no email", async () => {
    const noEmailUser = { id: "no-email-id", email: "" };
    requireUserMock.mockResolvedValue({ supabase: mockSupabase as never, user: noEmailUser as never });
    const fd = makeFormData({ password: "somepassword" });
    const result = await deleteAccountAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not available/i);
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });
});
