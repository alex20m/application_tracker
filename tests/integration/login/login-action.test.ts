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
    dashboard: "/dashboard",
    applications: "/applications",
    authCallback: "/api/auth/callback",
    signOut: "/auth/signout",
    forgotPassword: "/forgot-password",
    resetPassword: "/auth/reset-password",
    resetPasswordCallback: "/api/auth/reset-password",
  },
}));

import { loginAction, verifyOtpAction } from "@/app/login/actions";
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

  describe("OTP mode", () => {
    it("calls signInWithOtp and flags that a code was sent", async () => {
      const fd = makeFormData({ email: "user@example.com", authMode: "otp", authIntent: "" });
      const result = await loginAction(null, fd);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
      expect(result.otpSent).toBe(true);
      expect(result.message).toBeTruthy();
    });

    it("does not use a magic-link redirect when sending the code", async () => {
      const fd = makeFormData({ email: "user@example.com", authMode: "otp", authIntent: "" });
      await loginAction(null, fd);
      const options = mockSupabase.auth.signInWithOtp.mock.calls[0][0].options;
      expect(options.emailRedirectTo).toBeUndefined();
    });

    it("returns generic error when signInWithOtp fails", async () => {
      const errorSupabase = buildSupabaseMock({ signInWithOtpError: { message: "rate limit" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({ email: "user@example.com", authMode: "otp", authIntent: "" });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.otpSent).toBeFalsy();
    });
  });

  describe("verifyOtpAction", () => {
    it("verifies a valid 6-digit code and redirects to /dashboard", async () => {
      const fd = makeFormData({ email: "user@example.com", token: "123456" });
      await expect(verifyOtpAction(null, fd)).rejects.toMatchObject({
        type: "redirect",
        url: "/dashboard",
      });
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        token: "123456",
        type: "email",
      });
    });

    it("rejects a non-6-digit code without calling verifyOtp", async () => {
      const fd = makeFormData({ email: "user@example.com", token: "12ab" });
      const result = await verifyOtpAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/6-digit/i);
      expect(mockSupabase.auth.verifyOtp).not.toHaveBeenCalled();
    });

    it("returns error when email is missing", async () => {
      const fd = makeFormData({ token: "123456" });
      const result = await verifyOtpAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/email/i);
    });

    it("returns error when verifyOtp fails", async () => {
      const errorSupabase = buildSupabaseMock({ verifyOtpError: { message: "invalid otp" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({ email: "user@example.com", token: "123456" });
      const result = await verifyOtpAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid or has expired/i);
    });
  });

  describe("password sign-in", () => {
    it("redirects to /dashboard on successful sign-in", async () => {
      const fd = makeFormData({
        email: "user@example.com",
        password: "secret",
        authMode: "password",
        authIntent: "signin",
      });
      await expect(loginAction(null, fd)).rejects.toMatchObject({
        type: "redirect",
        url: "/dashboard",
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
    it("calls signUp and returns neutral confirmation message", async () => {
      const fd = makeFormData({
        email: "newuser@example.com",
        password: "newpass1",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
      // Must not claim a new account was created (would mislead on duplicate emails)
      expect(result.message).not.toMatch(/account created/i);
      expect(result.message).toMatch(/check your inbox/i);
    });

    it("rejects a password that is too short", async () => {
      const fd = makeFormData({
        email: "newuser@example.com",
        password: "pass1",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/at least 8 characters/i);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("rejects a password with no number", async () => {
      const fd = makeFormData({
        email: "newuser@example.com",
        password: "password",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/number/i);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("rejects a password with no letter", async () => {
      const fd = makeFormData({
        email: "newuser@example.com",
        password: "12345678",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/letter/i);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("returns error when signUp fails", async () => {
      const errorSupabase = buildSupabaseMock({ signUpError: { message: "already registered" } });
      createClientMock.mockResolvedValue(errorSupabase as never);
      const fd = makeFormData({
        email: "user@example.com",
        password: "validpass1",
        authMode: "password",
        authIntent: "signup",
      });
      const result = await loginAction(null, fd);
      expect(result.success).toBe(false);
    });
  });
});
