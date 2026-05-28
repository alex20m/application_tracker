import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { CLOSED_STATUSES } from "@/lib/statuses";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationsSearch } from "@/components/applications-search";
import { ApplicationsTabs } from "@/components/applications-tabs";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";

export default async function ClosedApplicationsPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .in("status", [...CLOSED_STATUSES])
    .order("updated_at", { ascending: false });

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div className={PAGE_HEADER}>
          <div>
            <h1 className={TEXT_H1}>Closed Applications</h1>
            <p className={`mt-0.5 ${TEXT_MUTED}`}>
              {applications?.length || 0} application{applications?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.newApplication} className={BTN_PRIMARY_LINK}>
              + Add
            </Link>
            <DeleteAllApplicationsButton
              hasApplications={Boolean(applications?.length)}
              scope="closed"
            />
          </div>
        </div>

        <ApplicationsTabs active="closed" />
        <ApplicationsSearch applications={applications || []} />
      </div>
    </AppShell>
  );
}
