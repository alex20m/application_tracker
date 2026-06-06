import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CARD, SECTION_STACK, TEXT_H3, TEXT_META } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { StatusBadge } from "@/components/status-badge";
import { updateApplicationAction } from "./actions";

function returnPathFromParam(from: string | undefined): string {
  if (from === "closed") return "/applications?filter=closed";
  if (from === "all") return "/applications?filter=all";
  return "/applications";
}

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

function Monogram({ company }: { company: string }) {
  const initials = company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="h-[50px] w-[50px] flex-shrink-0 flex items-center justify-center rounded-xl border border-border-base bg-surface-2 text-[15px] font-bold text-ink-2 select-none">
      {initials}
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: application }, { data: sourcesData }, { data: locationsData }] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
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

  const returnPath = returnPathFromParam(from);

  if (!application) {
    return (
      <AppShell email={user.email || ""}>
        <div className="rounded-2xl border border-border-base bg-surface p-12 text-center shadow-sm mobile:p-8">
          <p className="text-sm text-[var(--st-rejected)]">Application not found.</p>
          <Link
            href="/applications"
            className="mt-4 inline-block text-sm text-accent transition hover:text-accent-strong"
          >
            Back to Applications
          </Link>
        </div>
      </AppShell>
    );
  }

  const boundAction = updateApplicationAction.bind(null, id);

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-3 whitespace-nowrap">
          <Link href={returnPath} className="transition hover:text-ink-2">
            Applications
          </Link>
          <span className="text-border-strong">/</span>
          <span className="truncate max-w-[200px] font-medium text-ink-2">{application.company}</span>
        </div>

        {/* Header: monogram + company/role + badge */}
        <div className="flex items-center gap-4 mobile:gap-3">
          <Monogram company={application.company} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-bold tracking-[-0.02em] text-ink truncate whitespace-nowrap leading-tight">
              {application.company}
            </h1>
            <p className="mt-0.5 text-sm text-ink-2 truncate">{application.role}</p>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={application.status} />
          </div>
        </div>

        {/* Pipeline stepper */}
        <div className="max-w-2xl">
          <PipelineStepper applicationId={application.id} status={application.status} />
        </div>

        {/* Form */}
        <div className={`max-w-2xl ${CARD}`}>
          <ApplicationForm
            action={boundAction}
            application={application}
            returnPath={returnPath}
            existingSources={existingSources}
            existingLocations={existingLocations}
          />
        </div>

        {/* Danger zone */}
        <div
          className="max-w-2xl rounded-2xl border p-5 mobile:p-4"
          style={{
            borderColor: "color-mix(in oklch, var(--st-rejected) 28%, transparent)",
            background: "color-mix(in oklch, var(--st-rejected) 6%, var(--surface))",
          }}
        >
          <div className="flex items-center justify-between gap-4 mobile:flex-col mobile:items-stretch mobile:gap-3">
            <div>
              <p className={TEXT_H3}>Danger zone</p>
              <p className={`mt-0.5 ${TEXT_META}`}>
                Permanently delete this application. Cannot be undone.
              </p>
            </div>
            <div className="flex-shrink-0">
              <DeleteApplicationButton applicationId={id} returnPath={returnPath} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
