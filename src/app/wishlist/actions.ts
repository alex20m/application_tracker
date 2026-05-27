"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { STATUS } from "@/lib/statuses";
import { revalidateApplicationViews } from "@/lib/applications";
import { sanitizeActionError } from "@/lib/ui";
import { WishlistSchema } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { StatusEvent } from "@/lib/types";

export async function createWishlistAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const parsed = WishlistSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    location: formData.get("location"),
    source: formData.get("source") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: "Please check your input and try again." };
  }

  const { company, role, location, source, notes } = parsed.data;
  const now = new Date().toISOString();
  const appId = randomUUID();

  const { error } = await supabase.from("applications").insert([
    {
      id: appId,
      user_id: user.id,
      company,
      role,
      location,
      source: source || null,
      applied_on: null,
      status: STATUS.wishlist,
      notes: notes || null,
      events: [{ from_status: null, to_status: STATUS.wishlist, changed_at: now }] as StatusEvent[],
      created_at: now,
      updated_at: now,
    },
  ]);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "wishlist:create") };
  }

  revalidateApplicationViews();
  redirect("/wishlist");
}

export async function updateWishlistAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  if (!applicationId || !z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: "Invalid application." };
  }

  const parsed = WishlistSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    location: formData.get("location"),
    source: formData.get("source") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: "Please check your input and try again." };
  }

  const { company, role, location, source, notes } = parsed.data;

  const { error } = await supabase
    .from("applications")
    .update({
      company,
      role,
      location,
      source: source || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("status", STATUS.wishlist);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "wishlist:update") };
  }

  revalidateApplicationViews();
  redirect("/wishlist");
}

export async function applyWishlistAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  const appliedOn = formData.get("applied_on") as string | null;

  if (!applicationId || !z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: "Invalid application." };
  }

  const { data: currentApp } = await supabase
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp || currentApp.status !== STATUS.wishlist) {
    return { success: false, error: "Application is not in wishlist." };
  }

  const now = new Date().toISOString();
  const events: StatusEvent[] = [
    { from_status: null, to_status: STATUS.applied, changed_at: now },
  ];

  const { error } = await supabase
    .from("applications")
    .update({
      status: STATUS.applied,
      applied_on: appliedOn || null,
      events,
      updated_at: now,
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "wishlist:apply") };
  }

  revalidateApplicationViews();
  return { success: true };
}

export async function deleteWishlistAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  if (!applicationId || !z.string().uuid().safeParse(applicationId).success) return;

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("status", STATUS.wishlist);

  if (error) console.error("[wishlist:delete]", error);

  revalidateApplicationViews();
}

export async function deleteAllWishlistAction(): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id)
    .eq("status", STATUS.wishlist);

  if (error) return { success: false, error: sanitizeActionError(error, "wishlist:delete-all") };

  revalidateApplicationViews();
  return { success: true };
}
