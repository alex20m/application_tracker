"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/statuses";
import { randomUUID } from "crypto";

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
  const source = formData.get("source") as string | null;
  const appliedOn = formData.get("applied_on") as string | null;
  const status = (formData.get("status") as ApplicationStatus) || "no_answer";
  const notes = formData.get("notes") as string | null;

  if (!company || !role) {
    return { success: false, error: "Company and role are required" };
  }

  const appId = randomUUID();

  const { error: appError } = await supabase.from("applications").insert([
    {
      id: appId,
      user_id: user.id,
      company,
      role,
      source: source || null,
      applied_on: appliedOn || null,
      status,
      notes: notes || null,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
  ]);

  if (appError) {
    console.error("Application creation error:", appError);
    return { success: false, error: appError.message };
  }

  const { error: eventError } = await supabase
    .from("application_status_events")
    .insert([
      {
        id: randomUUID(),
        application_id: appId,
        user_id: user.id,
        from_status: null,
        to_status: status,
        changed_at: new Date().toISOString(),
      },
    ]);

  if (eventError) {
    console.error("Status event creation error:", eventError);
    return { success: false, error: eventError.message };
  }

  revalidatePath("/sankey");
  redirect("/applications");
}
