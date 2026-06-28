export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return Response.json(
      { success: false, error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  // Hits the PostgREST root — no table access, equivalent to SELECT 1
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: anonKey },
  });

  if (!res.ok) {
    console.error("[cron:keep-alive] error:", res.status);
    return Response.json({ success: false, error: res.status }, { status: 500 });
  }

  console.log("[cron:keep-alive] ok");
  return Response.json({ success: true });
}
