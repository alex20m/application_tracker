"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/statuses";
import type { StatusEvent } from "@/lib/types";

export async function updateApplicationAction(
  applicationId: string,
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  const company = (formData.get("company") as string | null)?.trim() || "";
  const role = (formData.get("role") as string | null)?.trim() || "";
  const location = (formData.get("location") as string | null)?.trim() || "";
  const source = (formData.get("source") as string | null)?.trim() || "";
  const appliedOn = (formData.get("applied_on") as string | null) || null;
  const newStatus = (formData.get("status") as ApplicationStatus) || "no_answer";
  const notes = formData.get("notes") as string | null;

  if (!company || !role || !location) {
    return { success: false, error: "Company, role, and location are required" };
  }

  const { data: currentApp } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!currentApp) {
    return { success: false, error: "Application not found" };
  }

  let events: StatusEvent[] = currentApp.events || [];

  if (currentApp.status !== newStatus) {
    if (currentApp.status === "no_answer") {
      // Remove the null→no_answer entry, replace with null→newStatus
      events = events.filter((e) => !(e.from_status === null && e.to_status === "no_answer"));
      events.push({ from_status: null, to_status: newStatus, changed_at: new Date().toISOString() });
    } else {
      events.push({ from_status: currentApp.status, to_status: newStatus, changed_at: new Date().toISOString() });
    }
  }

  const { error: appError } = await supabase
    .from("applications")
    .update({
      company,
      role,
      location,
      source: source || null,
      applied_on: appliedOn || null,
      status: newStatus,
      notes: notes || null,
      events,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (appError) {
    console.error("Application update error:", appError);
    return { success: false, error: appError.message };
  }

  revalidatePath("/sankey");
  redirect("/applications");
}

export async function deleteApplicationAction(
  applicationId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/sankey");
  redirect("/applications");
}
