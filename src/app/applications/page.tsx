import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationsSearch } from "@/components/applications-search";
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
      <div className={SECTION_STACK}>
        <div className={PAGE_HEADER}>
          <div>
            <h1 className={TEXT_H1}>Applications</h1>
            <p className={`mt-0.5 ${TEXT_MUTED}`}>
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

        <ApplicationsSearch applications={applications || []} />
      </div>
    </AppShell>
  );
}
