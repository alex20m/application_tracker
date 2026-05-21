"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { NEXT_STATUSES, type ApplicationStatus } from "@/lib/statuses";
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
  const status = (formData.get("status") as ApplicationStatus) || "no_answer";
  const notes = formData.get("notes") as string | null;

  if (!company || !role || !location) {
    return { success: false, error: "Company, role, and location are required" };
  }

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
      events: [{ from_status: null, to_status: status, changed_at: new Date().toISOString() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  const allowedNext = NEXT_STATUSES[currentApp.status as ApplicationStatus] ?? [];
  if (!allowedNext.includes(nextStatus)) return;

  let events: StatusEvent[] = currentApp.events || [];
  if (currentApp.status === "no_answer") {
    events = events.filter((e) => !(e.from_status === null && e.to_status === "no_answer"));
    events.push({ from_status: null, to_status: nextStatus, changed_at: new Date().toISOString() });
  } else {
    events.push({ from_status: currentApp.status, to_status: nextStatus, changed_at: new Date().toISOString() });
  }

  await supabase
    .from("applications")
    .update({
      status: nextStatus,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  revalidatePath("/applications");
  revalidatePath("/sankey");
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

  revalidatePath("/applications");
  revalidatePath("/sankey");
}

export async function deleteAllApplicationsAction(): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id);

  revalidatePath("/applications");
  revalidatePath("/sankey");
}
