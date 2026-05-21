"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  prevState: unknown,
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Magic link sent. Check your email." };
  }

  // Password flow
  if (!password) {
    return { success: false, error: "Password is required" };
  }

  if (authIntent === "signup") {
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Account created. Check your email if confirmation is required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/applications");
}
