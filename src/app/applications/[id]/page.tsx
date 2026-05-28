import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { isClosedStatus, type ApplicationStatus } from "@/lib/statuses";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_H3, TEXT_META, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { updateApplicationAction } from "./actions";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const returnPath = application && isClosedStatus(application.status as ApplicationStatus)
    ? ROUTES.closedApplications
    : ROUTES.applications;

  if (!application) {
    return (
      <AppShell email={user.email || ""}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center shadow-sm mobile:p-8">
          <p className="text-sm text-red-600 dark:text-red-400">Application not found.</p>
          <Link
            href={ROUTES.applications}
            className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-800 dark:hover:text-indigo-300"
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
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href={returnPath} className="transition hover:text-gray-700 dark:hover:text-gray-300">
            Applications
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="truncate max-w-[160px] font-medium text-gray-700 dark:text-gray-300">{application.company}</span>
        </div>

        <div>
          <h1 className={TEXT_H1}>{application.company}</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>{application.role}</p>
        </div>

        <div className={`max-w-2xl ${CARD}`}>
          <ApplicationForm action={boundAction} application={application} returnPath={returnPath} />
        </div>

        <div className="max-w-2xl rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-5 mobile:p-4">
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
