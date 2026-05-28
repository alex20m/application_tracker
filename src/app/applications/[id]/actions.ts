"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STATUS, type ApplicationStatus } from "@/lib/statuses";
import { appendStatusEvent } from "@/lib/applications";
import { GENERIC_ACTION_ERROR, sanitizeActionError } from "@/lib/ui";
import { ApplicationUpdateSchema } from "@/lib/schemas";
import { z } from "zod";
import type { StatusEvent } from "@/lib/types";

export async function updateApplicationAction(
  applicationId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const parsed = ApplicationUpdateSchema.safeParse({
    company: (formData.get("company") as string | null)?.trim() ?? "",
    role: (formData.get("role") as string | null)?.trim() ?? "",
    location: (formData.get("location") as string | null)?.trim() ?? "",
    source: (formData.get("source") as string | null)?.trim() ?? "",
    notes: formData.get("notes") ?? "",
    status: (formData.get("status") as string) || STATUS.applied,
    applied_on: formData.get("applied_on"),
  });

  if (!parsed.success) {
    return { success: false, error: "Please check your input and try again." };
  }

  const { company, role, location, source, notes, status: newStatus, applied_on: appliedOn } = parsed.data;

  const { data: currentApp } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) {
    return { success: false, error: "Application not found" };
  }

  let events: StatusEvent[] = (currentApp.events as StatusEvent[]) || [];

  if (currentApp.status !== newStatus) {
    events = appendStatusEvent(
      currentApp.status as ApplicationStatus,
      newStatus,
      events
    );
  }

  const { error: appError } = await supabase
    .from("applications")
    .update({
      company,
      role,
      location,
      source: source || null,
      applied_on: appliedOn,
      status: newStatus,
      notes: notes || null,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (appError) {
    return { success: false, error: sanitizeActionError(appError, "application:update") };
  }

  revalidatePath("/analytics");
  redirect("/applications/open");
}

export async function deleteApplicationAction(
  applicationId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "application:delete") };
  }

  revalidatePath("/analytics");
  redirect("/applications/open");
}
