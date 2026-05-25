"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/env";
import { ResetPasswordSchema } from "@/lib/schemas";

export async function resetPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error("[reset-password] updateUser error:", error);
    return { success: false, error: "Failed to update password. The link may have expired." };
  }

  redirect(`${ROUTES.login}?reset=ok`);
}
