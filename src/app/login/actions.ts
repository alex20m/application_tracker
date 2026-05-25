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
}> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const authMode = formData.get("authMode") as string;
  const authIntent = formData.get("authIntent") as string;

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  const supabase = await createSupabaseServerClient();

  // Magic link flow
  if (authMode === "magic") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${APP_URL}${ROUTES.authCallback}`,
      },
    });

    if (error) {
      console.error("[login] magic-link error:", error);
      return genericAuthError();
    }

    return { success: true, message: "Sign-in link sent. Check your email." };
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

  redirect(ROUTES.applications);
}
