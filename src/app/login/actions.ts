"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_URL, ROUTES } from "@/lib/env";
import { PasswordSchema } from "@/lib/schemas";

function genericAuthError() {
  return { success: false as const, error: "Invalid credentials or request failed." };
}

export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  otpSent?: boolean;
}> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const authMode = formData.get("authMode") as string;
  const authIntent = formData.get("authIntent") as string;

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  const supabase = await createSupabaseServerClient();

  // One-time passcode (OTP) flow — sends a 6-digit code to the user's email.
  if (authMode === "otp") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("[login] otp-send error:", error);
      return genericAuthError();
    }

    return {
      success: true,
      otpSent: true,
      message: "We sent a 6-digit code to your email. Enter it below to sign in.",
    };
  }

  // Password flow
  if (!password) {
    return { success: false, error: "Password is required" };
  }

  if (authIntent === "signup") {
    const parsed = PasswordSchema.safeParse(password);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${APP_URL}${ROUTES.authCallback}` },
    });

    if (error) {
      console.error("[login] signup error:", error);
      return { success: false, error: error.message };
    }

    // Supabase silently succeeds for duplicate emails (anti-enumeration) by returning
    // a user with an empty identities array instead of an error. Use the same neutral
    // message for both cases to avoid leaking whether an email is registered.
    return { success: true, message: "If this email isn't already registered, check your inbox to confirm your account." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] signin error:", error);
    return genericAuthError();
  }

  redirect(ROUTES.dashboard);
}

export async function verifyOtpAction(
  _prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const email = formData.get("email") as string;
  const token = ((formData.get("token") as string) ?? "").trim();

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  if (!/^\d{6}$/.test(token)) {
    return { success: false, error: "Enter the 6-digit code from your email." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("[login] otp-verify error:", error);
    return { success: false, error: "That code is invalid or has expired. Please try again." };
  }

  redirect(ROUTES.dashboard);
}
