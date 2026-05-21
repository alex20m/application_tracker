import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ApplicationList } from "@/components/application-list";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";

export default async function ApplicationsPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)

    .order("updated_at", { ascending: false });

  return (
    <AppShell email={user.email || ""}>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Applications</h2>
            <p className="mt-1 text-sm text-slate-600">
              {applications?.length || 0} application{applications?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/applications/new" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-indigo-600 text-white hover:bg-indigo-700">
              + Add Application
            </Link>
            <DeleteAllApplicationsButton hasApplications={Boolean(applications?.length)} />
          </div>
        </div>

        <ApplicationList applications={applications || []} />
      </div>
    </AppShell>
  );
}
