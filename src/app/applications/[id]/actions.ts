"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STATUS, type ApplicationStatus } from "@/lib/statuses";
import { appendStatusEvent } from "@/lib/applications";

const DEFAULT_PATH = "/applications";

function isAllowedReturnPath(path: string): boolean {
  if (path === "/applications") return true;
  if (path === "/applications?filter=closed") return true;
  if (path === "/applications?filter=all") return true;
  if (/^\/applications\/[0-9a-f-]{36}(\?from=(closed|all))?$/.test(path)) return true;
  return false;
}
import { GENERIC_ACTION_ERROR, sanitizeActionError } from "@/lib/ui";
import { ApplicationUpdateSchema, InterviewRoundCreateSchema, InterviewRoundUpdateSchema } from "@/lib/schemas";
import { z } from "zod";
import type { InterviewRound, StatusEvent } from "@/lib/types";
import { addInterviewRound, removeInterviewRound, revalidateApplicationViews, updateInterviewRound } from "@/lib/applications";

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
  const returnPath = formData.get("return_path") as string | null;
  redirect(isAllowedReturnPath(returnPath ?? "") ? returnPath! : DEFAULT_PATH);
}

export async function addInterviewRoundAction(
  applicationId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const parsed = InterviewRoundCreateSchema.safeParse({
    type: formData.get("type") ?? "",
    scheduled_at: (formData.get("scheduled_at") as string) || null,
    outcome: (formData.get("outcome") as string) || "pending",
    notes: (formData.get("notes") as string) || null,
  });

  if (!parsed.success) {
    return { success: false, error: "Please check your input and try again." };
  }

  const { data: currentApp } = await supabase
    .from("applications")
    .select("interview_rounds")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) {
    return { success: false, error: "Application not found" };
  }

  const newRounds = addInterviewRound(
    (currentApp.interview_rounds as InterviewRound[]) ?? [],
    {
      type: parsed.data.type,
      scheduled_at: parsed.data.scheduled_at ?? null,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes ?? null,
    }
  );

  const { error } = await supabase
    .from("applications")
    .update({ interview_rounds: newRounds, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "interview_round:add") };
  }

  revalidateApplicationViews();
  return { success: true };
}

export async function updateInterviewRoundAction(
  applicationId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!z.string().uuid().safeParse(applicationId).success) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const parsed = InterviewRoundUpdateSchema.safeParse({
    id: formData.get("id") ?? "",
    type: formData.get("type") ?? "",
    scheduled_at: (formData.get("scheduled_at") as string) || null,
    outcome: (formData.get("outcome") as string) || "pending",
    notes: (formData.get("notes") as string) || null,
  });

  if (!parsed.success) {
    return { success: false, error: "Please check your input and try again." };
  }

  const { data: currentApp } = await supabase
    .from("applications")
    .select("interview_rounds")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) {
    return { success: false, error: "Application not found" };
  }

  const newRounds = updateInterviewRound(
    (currentApp.interview_rounds as InterviewRound[]) ?? [],
    parsed.data.id,
    {
      type: parsed.data.type,
      scheduled_at: parsed.data.scheduled_at ?? null,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes ?? null,
    }
  );

  const { error } = await supabase
    .from("applications")
    .update({ interview_rounds: newRounds, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "interview_round:update") };
  }

  revalidateApplicationViews();
  return { success: true };
}

export async function deleteInterviewRoundAction(
  applicationId: string,
  roundId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (
    !z.string().uuid().safeParse(applicationId).success ||
    !z.string().uuid().safeParse(roundId).success
  ) {
    return { success: false, error: GENERIC_ACTION_ERROR };
  }

  const { data: currentApp } = await supabase
    .from("applications")
    .select("interview_rounds")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) {
    return { success: false, error: "Application not found" };
  }

  const newRounds = removeInterviewRound(
    (currentApp.interview_rounds as InterviewRound[]) ?? [],
    roundId
  );

  const { error } = await supabase
    .from("applications")
    .update({ interview_rounds: newRounds, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: sanitizeActionError(error, "interview_round:delete") };
  }

  revalidateApplicationViews();
  return { success: true };
}

export async function deleteApplicationAction(
  applicationId: string,
  returnPath: string = DEFAULT_PATH
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
  redirect(isAllowedReturnPath(returnPath) ? returnPath : DEFAULT_PATH);
}
