import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/statuses";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationsSearch } from "@/components/applications-search";
import { ApplicationsTabs } from "@/components/applications-tabs";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";

type ApplicationsPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

function normalizeFilter(raw: string | undefined): "open" | "closed" | "all" {
  if (raw === "closed") return "closed";
  if (raw === "all") return "all";
  return "open";
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const { filter: rawFilter } = await searchParams;
  const filter = normalizeFilter(rawFilter);

  const { supabase, user } = await requireUser();

  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (filter === "open") {
    query = query.in("status", [...ACTIVE_STATUSES]);
  } else if (filter === "closed") {
    query = query.in("status", [...CLOSED_STATUSES]);
  }

  const { data: applications } = await query;

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
            <Link
              href={`/applications/new${filter !== "open" ? `?from=${filter}` : ""}`}
              className={BTN_PRIMARY_LINK}
            >
              + Add
            </Link>
            <DeleteAllApplicationsButton
              hasApplications={Boolean(applications?.length)}
              scope={filter}
            />
          </div>
        </div>

        <ApplicationsTabs active={filter} />
        <ApplicationsSearch applications={applications || []} fromFilter={filter} />
      </div>
    </AppShell>
  );
}
