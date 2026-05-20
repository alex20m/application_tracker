import Link from "next/link";
import { requireUser } from "@/lib/auth";
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
    .is("deleted_at", null)
    .single();

  if (!application) {
    return (
      <AppShell email={user.email || ""}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-rose-600">No applications yet</p>
          <Link href="/applications" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 mt-4 inline-block">
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
        <div className="flex items-center gap-2">
          <Link href="/applications" className="text-sm text-indigo-600 hover:text-indigo-700">
            Applications
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-600">
            {application.company}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {application.company}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{application.role}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl">
          <ApplicationForm action={boundAction} application={application} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl border-l-4 border-rose-200 bg-rose-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Danger Zone
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Permanently delete this application. This action cannot be undone.
              </p>
            </div>
            <DeleteApplicationButton applicationId={id} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
