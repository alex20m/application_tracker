"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STATUS, STATUS_NEXT, type ApplicationStatus } from "@/lib/statuses";
import { appendStatusEvent, revalidateApplicationViews } from "@/lib/applications";
import { randomUUID } from "crypto";
import type { StatusEvent } from "@/lib/types";

export async function createApplicationAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const location = (formData.get("location") as string | null)?.trim() || "";
  const source = formData.get("source") as string | null;
  const appliedOn = formData.get("applied_on") as string | null;
  const status = (formData.get("status") as ApplicationStatus) || STATUS.no_answer;
  const notes = formData.get("notes") as string | null;

  if (!company || !role || !location) {
    return { success: false, error: "Company, role, and location are required" };
  }

  const now = new Date().toISOString();
  const appId = randomUUID();

  const { error: appError } = await supabase.from("applications").insert([
    {
      id: appId,
      user_id: user.id,
      company,
      role,
      location,
      source: source || null,
      applied_on: appliedOn || null,
      status,
      notes: notes || null,
      events: [{ from_status: null, to_status: status, changed_at: now }],
      created_at: now,
      updated_at: now,
    },
  ]);

  if (appError) {
    console.error("Application creation error:", appError);
    return { success: false, error: appError.message };
  }

  revalidatePath("/sankey");
  redirect("/applications");
}

export async function transitionApplicationStatusAction(
  formData: FormData
): Promise<void> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  const nextStatus = formData.get("next_status") as ApplicationStatus;

  if (!applicationId || !nextStatus) return;

  const { data: currentApp } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) return;

  const allowedNext = STATUS_NEXT[currentApp.status as ApplicationStatus] ?? [];
  if (!allowedNext.includes(nextStatus)) return;

  const events = appendStatusEvent(
    currentApp.status as ApplicationStatus,
    nextStatus,
    (currentApp.events as StatusEvent[]) ?? []
  );

  await supabase
    .from("applications")
    .update({
      status: nextStatus,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  revalidateApplicationViews();
}

export async function updateApplicationNoteAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  const notes = (formData.get("notes") as string | null) || null;
  if (!applicationId) return;

  await supabase
    .from("applications")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  revalidatePath("/applications");
}

export async function deleteApplicationFromListAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return;

  await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  revalidateApplicationViews();
}

export async function deleteAllApplicationsAction(): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id);

  revalidateApplicationViews();
}
