"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const authMode = formData.get("authMode") as string;

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  const supabase = await createSupabaseServerClient();

  try {
    if (authMode === "magic") {
      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Password login
      if (!password) {
        return { success: false, error: "Password is required" };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      redirect("/dashboard");
    }
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "An error occurred. Please try again." };
  }
}
