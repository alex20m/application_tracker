"use server";

import { requireUser } from "@/lib/auth";
import { ChangePasswordSchema } from "@/lib/schemas";

export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  const { supabase, user } = await requireUser();

  if (!user.email) {
    return { success: false, error: "Password change is not available for this account." };
  }

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    console.error("[change-password] updateUser error:", updateError);
    return { success: false, error: "Failed to update password. Please try again." };
  }

  return { success: true, message: "Password updated." };
}
