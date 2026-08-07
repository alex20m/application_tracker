import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { BTN_GHOST, BTN_PRIMARY_LINK, CARD, SECTION_STACK, TEXT_H3, TEXT_LABEL, TEXT_META } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { StatusBadge } from "@/components/status-badge";
import { InterviewRoundsCard } from "@/components/interview-rounds-card";
import type { InterviewRound } from "@/lib/types";
import { updateApplicationAction } from "./actions";

function getCompanyInitials(company: string): string {
  const words = company.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return company.slice(0, 2).toUpperCase();
}

function returnPathFromParam(from: string | undefined): string {
  if (from === "closed") return "/applications?filter=closed";
  if (from === "all") return "/applications?filter=all";
  return "/applications";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-SE", { year: "numeric", month: "short", day: "numeric" });
}

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; mode?: string }>;
};

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const { from, mode } = await searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: application }, { data: sourcesData }, { data: locationsData }, { data: roundsData }] = await Promise.all([
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
    supabase
      .from("applications")
      .select("interview_rounds")
      .eq("user_id", user.id),
  ]);

  const existingSources = [...new Set(
    (sourcesData ?? []).map((r: { source: string | null }) => r.source as string)
  )].sort();

  const existingLocations = [...new Set(
    (locationsData ?? []).map((r: { location: string | null }) => r.location as string)
  )].sort();

  const existingRoundTypes = [...new Set(
    (roundsData ?? []).flatMap(
      (r: { interview_rounds: unknown }) =>
        ((r.interview_rounds as InterviewRound[]) ?? []).map((round) => round.type)
    )
  )].filter(Boolean).sort();

  const returnPath = returnPathFromParam(from);
  const viewPath = `/applications/${id}${from ? `?from=${from}` : ""}`;
  const isEdit = mode === "edit";

  if (!application) {
    return (
      <AppShell email={user.email || ""}>
        <div className="rounded-3xl border border-border-base bg-surface p-12 text-center shadow-soft mobile:p-8">
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
      <div className={`max-w-3xl mx-auto ${SECTION_STACK}`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-3 whitespace-nowrap min-w-0">
          <Link href={returnPath} className="transition hover:text-ink-2 flex-shrink-0">
            Applications
          </Link>
          <span className="text-border-strong">/</span>
          {isEdit ? (
            <>
              <Link href={viewPath} className="transition hover:text-ink-2 truncate max-w-[160px]">
                {application.company}
              </Link>
              <span className="text-border-strong">/</span>
              <span className="font-medium text-ink-2">Edit</span>
            </>
          ) : (
            <span className="truncate max-w-[200px] font-medium text-ink-2">{application.company}</span>
          )}
        </div>

        {/* Header: monogram + company/role + badge */}
        <div className="flex items-center gap-4 mobile:gap-3">
          <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-2xl border border-border-base bg-surface-2 text-[17px] font-bold tracking-tight text-ink-2 shadow-soft mobile:h-12 mobile:w-12 mobile:text-[14px]">
            {getCompanyInitials(application.company)}
          </div>
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

        {isEdit ? (
          /* ── Edit mode ── */
          <>
            <div className={CARD}>
              <ApplicationForm
                action={boundAction}
                application={application}
                returnPath={viewPath}
                existingSources={existingSources}
                existingLocations={existingLocations}
              />
            </div>

            <div
              className="rounded-2xl border p-5 mobile:p-4"
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
          </>
        ) : (
          /* ── View mode ── */
          <>
            <PipelineStepper applicationId={application.id} status={application.status} />

            <InterviewRoundsCard
              application={application}
              existingRoundTypes={existingRoundTypes}
            />

            <div className={CARD}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mobile:grid-cols-1">
                <div>
                  <p className={TEXT_LABEL}>Company</p>
                  <p className="mt-1 text-sm text-ink">{application.company}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Role</p>
                  <p className="mt-1 text-sm text-ink">{application.role}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Location</p>
                  <p className="mt-1 text-sm text-ink">{application.location || "—"}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Source</p>
                  <p className="mt-1 text-sm text-ink">{application.source || "—"}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Applied On</p>
                  <p className="mt-1 text-sm text-ink">{formatDate(application.applied_on)}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Status</p>
                  <p className="mt-1 text-sm text-ink capitalize">{application.status.replace(/_/g, " ")}</p>
                </div>
                {application.notes && (
                  <div className="col-span-2 mobile:col-span-1">
                    <p className={TEXT_LABEL}>Notes</p>
                    <p className="mt-1 text-sm text-ink whitespace-pre-wrap">{application.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Link href={returnPath} className={BTN_GHOST}>← Go Back</Link>
              <Link
                href={`/applications/${id}?mode=edit${from ? `&from=${from}` : ""}`}
                className={BTN_PRIMARY_LINK}
              >
                Edit
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
