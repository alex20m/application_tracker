import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { createApplicationAction } from "@/app/applications/actions";

type NewApplicationPageProps = {
  searchParams: Promise<{ from?: string }>;
};

function returnPathFromParam(from: string | undefined): string {
  if (from === "closed") return "/applications?filter=closed";
  if (from === "all") return "/applications?filter=all";
  return "/applications";
}

export default async function NewApplicationPage({ searchParams }: NewApplicationPageProps) {
  const { from } = await searchParams;
  const returnPath = returnPathFromParam(from);
  const { supabase, user } = await requireUser();

  const [{ data: sourcesData }, { data: locationsData }] = await Promise.all([
    supabase
      .from("applications")
      .select("source")
      .eq("user_id", user.id)
      .not("source", "is", null)
      .neq("source", ""),
    supabase
      .from("applications")
      .select("location")
      .eq("user_id", user.id)
      .not("location", "is", null)
      .neq("location", ""),
  ]);

  const existingSources = [...new Set(
    (sourcesData ?? []).map((r: { source: string | null }) => r.source as string)
  )].sort();

  const existingLocations = [...new Set(
    (locationsData ?? []).map((r: { location: string | null }) => r.location as string)
  )].sort();

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-3xl mx-auto ${SECTION_STACK}`}>
        <div className="flex items-center gap-2 text-sm text-ink-3 whitespace-nowrap min-w-0">
          <Link href={returnPath} className="transition hover:text-ink-2 flex-shrink-0">
            Applications
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-medium text-ink-2">New</span>
        </div>

        <div>
          <h1 className={TEXT_H1}>Add Application</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>
            Track a new job application
          </p>
        </div>

        <div className={CARD}>
          <ApplicationForm action={createApplicationAction} returnPath={returnPath} existingSources={existingSources} existingLocations={existingLocations} />
        </div>
      </div>
    </AppShell>
  );
}

