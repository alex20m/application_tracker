"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_URL, ROUTES } from "@/lib/env";
import { ForgotPasswordSchema } from "@/lib/schemas";
import { sanitizeActionError } from "@/lib/ui";

const GENERIC_SUCCESS = "If an account exists for that email, a reset link has been sent.";

export async function forgotPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${APP_URL}${ROUTES.resetPassword}`,
    });
  } catch (err) {
    sanitizeActionError(err, "forgot-password");
  }

  return { success: true, message: GENERIC_SUCCESS };
}
