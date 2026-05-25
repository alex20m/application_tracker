import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSupabaseMock } from "../../helpers/supabase-mock";

let mockSupabase = buildSupabaseMock();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// env.ts evaluates env vars at import time; provide stubs
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

import { loginAction } from "@/app/login/actions";
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

describe("loginAction", () => {
  it("returns error when email is missing", async () => {
    const fd = makeFormData({ password: "pass", authMode: "password", authIntent: "signin" });
    const result = await loginAction(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/email/i);
  });

  describe("magic link mode", () => {
    it("calls signInWithOtp and returns success message", async () => {
      const fd = makeFormData({ email: "user@example.com", authMode: "magic", authIntent: "" });
      const result = await loginAction(null, fd);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
    });

    it("returns generic error when signInWithOtp fails", async () => {
      const errorSupabase = buildSupabaseMock({ signInWithOtpError: { message: "rate limit" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({ email: "user@example.com", authMode: "magic", authIntent: "" });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
    });
  });

  describe("password sign-in", () => {
    it("redirects to /applications on successful sign-in", async () => {
      const fd = makeFormData({
        email: "user@example.com",
        password: "secret",
        authMode: "password",
        authIntent: "signin",
      });
      await expect(loginAction(null, fd)).rejects.toMatchObject({
        type: "redirect",
        url: "/applications",
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledOnce();
    });

    it("returns error when password is missing", async () => {
      const fd = makeFormData({ email: "user@example.com", authMode: "password", authIntent: "signin" });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/password/i);
    });

    it("returns generic error when signInWithPassword fails", async () => {
      const errorSupabase = buildSupabaseMock({ signInError: { message: "invalid credentials" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({
        email: "user@example.com",
        password: "wrong",
        authMode: "password",
        authIntent: "signin",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
    });
  });

  describe("signup mode", () => {
    it("calls signUp and returns success message", async () => {
      const fd = makeFormData({
        email: "newuser@example.com",
        password: "newpass",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
    });

    it("returns error when signUp fails", async () => {
      const errorSupabase = buildSupabaseMock({ signUpError: { message: "already registered" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({
        email: "user@example.com",
        password: "pass",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
    });
  });
});
