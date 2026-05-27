import { createClient } from "@supabase/supabase-js";
import { STATUS } from "@/lib/statuses";
import { appendStatusEvent } from "@/lib/applications";
import type { StatusEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { success: false, error: "Missing Supabase service role configuration" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data: apps, error: fetchError } = await supabase
    .from("applications")
    .select("id, events")
    .eq("status", STATUS.applied)
    .lte("applied_on", cutoffDate);

  if (fetchError) {
    console.error("[cron:auto-ghost] fetch error:", fetchError);
    return Response.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  if (!apps || apps.length === 0) {
    return Response.json({ success: true, updated: 0 });
  }

  let updated = 0;
  const now = new Date().toISOString();

  for (const app of apps) {
    const events = appendStatusEvent(
      STATUS.applied,
      STATUS.ghosted,
      (app.events as StatusEvent[]) ?? []
    );

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: STATUS.ghosted, events, updated_at: now })
      .eq("id", app.id);

    if (updateError) {
      console.error(`[cron:auto-ghost] failed to update ${app.id}:`, updateError);
    } else {
      updated++;
    }
  }

  return Response.json({ success: true, updated });
}
