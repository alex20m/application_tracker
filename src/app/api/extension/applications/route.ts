import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/statuses";
import { revalidateApplicationViews } from "@/lib/applications";
import { ExtensionApplicationSchema } from "@/lib/schemas";

// Called by the browser extension's background service worker using the
// user's existing Supabase session cookies, so unauthenticated requests get
// a JSON 401 instead of the login redirect used by server actions.
async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Supabase ilike treats % and _ as wildcards; unescaped they could make the
// dedupe check match unrelated rows and silently drop a new application.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET() {
  const { user } = await getSessionUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, email: user.email ?? null });
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ExtensionApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the application data and try again." },
      { status: 400 }
    );
  }

  const { company, role, location, source, notes } = parsed.data;
  const appliedOn = parsed.data.applied_on ?? new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("applied_on", appliedOn)
    .ilike("company", escapeLikePattern(company))
    .ilike("role", escapeLikePattern(role))
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: true, duplicate: true, id: existing[0].id });
  }

  const now = new Date().toISOString();
  const appId = randomUUID();

  const { error } = await supabase.from("applications").insert([
    {
      id: appId,
      user_id: user.id,
      company,
      role,
      location: location || "Unknown",
      source: source || null,
      applied_on: appliedOn,
      status: STATUS.applied,
      notes: notes || null,
      events: [{ from_status: null, to_status: STATUS.applied, changed_at: now }],
      created_at: now,
      updated_at: now,
    },
  ]);

  if (error) {
    console.error("[extension:create]", error);
    return NextResponse.json({ error: "Could not save the application." }, { status: 500 });
  }

  revalidateApplicationViews();
  return NextResponse.json({ success: true, duplicate: false, id: appId }, { status: 201 });
}
