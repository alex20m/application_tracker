"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/statuses";
import { randomUUID } from "crypto";

export async function updateApplicationAction(
  applicationId: string,
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const source = formData.get("source") as string | null;
  const appliedOn = formData.get("applied_on") as string | null;
  const newStatus = (formData.get("status") as ApplicationStatus) || "applied";
  const notes = formData.get("notes") as string | null;

  if (!company || !role) {
    return { success: false, error: "Company and role are required" };
  }

  try {
    // Get current application to check old status
    const { data: currentApp } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (!currentApp) {
      return { success: false, error: "Application not found" };
    }

    // Update application
    const { error: appError } = await supabase
      .from("applications")
      .update({
        company,
        role,
        source: source || null,
        applied_on: appliedOn || null,
        status: newStatus,
        notes: notes || null,
        version: (currentApp.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (appError) {
      console.error("Application update error:", appError);
      return { success: false, error: appError.message };
    }

    // Create status event if status changed
    if (currentApp.status !== newStatus) {
      const { error: eventError } = await supabase
        .from("application_status_events")
        .insert([
          {
            id: randomUUID(),
            application_id: applicationId,
            user_id: user.id,
            from_status: currentApp.status,
            to_status: newStatus,
            changed_at: new Date().toISOString(),
          },
        ]);

      if (eventError) {
        console.error("Status event creation error:", eventError);
        return { success: false, error: eventError.message };
      }
    }

    redirect("/applications");
  } catch (err) {
    console.error("Update application error:", err);
    return { success: false, error: "An error occurred. Please try again." };
  }
}

export async function deleteApplicationAction(
  applicationId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  try {
    const { error } = await supabase
      .from("applications")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    redirect("/applications");
  } catch (err) {
    console.error("Delete application error:", err);
    return { success: false, error: "An error occurred. Please try again." };
  }
}
