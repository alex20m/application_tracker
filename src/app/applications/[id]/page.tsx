import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { CARD } from "@/lib/ui";
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

  if (!application) {
    return (
      <AppShell email={user.email || ""}>
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-red-600">Application not found.</p>
          <Link
            href={ROUTES.applications}
            className="mt-4 inline-block text-sm text-indigo-600 transition hover:text-indigo-800"
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
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href={ROUTES.applications} className="text-gray-400 transition hover:text-gray-700">
            Applications
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700">{application.company}</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">{application.company}</h1>
          <p className="mt-0.5 text-sm text-gray-400">{application.role}</p>
        </div>

        <div className={`max-w-2xl ${CARD}`}>
          <ApplicationForm action={boundAction} application={application} />
        </div>

        <div className="max-w-2xl rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Danger zone</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Permanently delete this application. Cannot be undone.
              </p>
            </div>
            <DeleteApplicationButton applicationId={id} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
