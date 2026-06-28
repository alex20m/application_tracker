import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Asks the DB "how many rows?" — returns just a number, no user data
  const { error } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[cron:keep-alive] error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  console.log("[cron:keep-alive] ok");
  return Response.json({ success: true });
}
