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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Applications</h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {applications?.length || 0} application{applications?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/applications/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              + Add
            </Link>
            <DeleteAllApplicationsButton hasApplications={Boolean(applications?.length)} />
          </div>
        </div>

        <ApplicationList applications={applications || []} />
      </div>
    </AppShell>
  );
}
