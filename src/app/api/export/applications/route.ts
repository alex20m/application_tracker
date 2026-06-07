import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/statuses";

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  const filter = request.nextUrl.searchParams.get("filter") ?? "all";

  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (filter === "open") {
    query = query.in("status", [...ACTIVE_STATUSES]);
  } else if (filter === "closed") {
    query = query.in("status", [...CLOSED_STATUSES]);
  }

  const { data: apps } = await query;
  if (!apps) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers = ["company", "role", "location", "status", "source", "applied_on", "notes", "created_at", "updated_at"];
  const rows = apps.map((a) =>
    headers.map((h) => {
      const val = (a as Record<string, unknown>)[h];
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${filter}.csv"`,
    },
  });
}
