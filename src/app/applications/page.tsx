import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { BTN_PRIMARY_LINK } from "@/lib/ui";
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
            <Link href={ROUTES.newApplication} className={BTN_PRIMARY_LINK}>
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
