"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STATUS, STATUS_NEXT, type ApplicationStatus } from "@/lib/statuses";
import { appendStatusEvent, revalidateApplicationViews } from "@/lib/applications";
import { GENERIC_ACTION_ERROR, sanitizeActionError } from "@/lib/ui";
import { ApplicationCreateSchema, ApplicationNoteSchema } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { StatusEvent } from "@/lib/types";

export async function createApplicationAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  const appliedOn = formData.get("applied_on") as string | null;
  const status = (formData.get("status") as ApplicationStatus) || STATUS.no_answer;

  const parsed = ApplicationCreateSchema.safeParse({
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
    return { success: false, error: sanitizeActionError(appError, "application:create") };
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

  if (!z.string().uuid().safeParse(applicationId).success) return;

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

  const { error } = await supabase
    .from("applications")
    .update({
      status: nextStatus,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) console.error("[application:transition]", error);

  revalidateApplicationViews();
}

export async function updateApplicationNoteAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return;
  if (!z.string().uuid().safeParse(applicationId).success) return;

  const parsed = ApplicationNoteSchema.safeParse({
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return;

  const { error } = await supabase
    .from("applications")
    .update({ notes: parsed.data.notes || null, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) console.error("[application:update-note]", error);

  revalidatePath("/applications");
}

export async function deleteApplicationFromListAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return;
  if (!z.string().uuid().safeParse(applicationId).success) return;

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) console.error("[application:delete-from-list]", error);

  revalidateApplicationViews();
}

export async function deleteAllApplicationsAction(): Promise<void> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("user_id", user.id);

  if (error) console.error("[application:delete-all]", error);

  revalidateApplicationViews();
}
