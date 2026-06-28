import { createClient } from "@supabase/supabase-js";

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

  // Read-only query — touches no user data, just keeps the db active
  const { error } = await supabase.from("applications").select("id").limit(1);

  if (error) {
    console.error("[cron:keep-alive] error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  console.log("[cron:keep-alive] ok");
  return Response.json({ success: true });
}
