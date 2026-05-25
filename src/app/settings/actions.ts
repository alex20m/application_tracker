"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ChangePasswordSchema, DeleteAccountSchema } from "@/lib/schemas";
import { ROUTES } from "@/lib/env";

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

export async function deleteAccountAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user.email) {
    return { success: false, error: "Account deletion is not available for this account." };
  }

  const parsed = DeleteAccountSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return { success: false, error: "Incorrect password." };
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[delete-account] deleteUser error:", deleteError);
    return { success: false, error: "Failed to delete account. Please try again." };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect(ROUTES.login);
}
