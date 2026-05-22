import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_URL, ROUTES } from "@/lib/env";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(ROUTES.login, APP_URL), { status: 302 });
}
