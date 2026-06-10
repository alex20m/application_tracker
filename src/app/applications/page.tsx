import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES, STATUS } from "@/lib/statuses";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationsResults } from "@/app/applications/applications-results";
import { ApplicationRowsSkeleton } from "@/components/application-rows-skeleton";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";
import { CsvExportButton } from "@/components/csv-export-button";
import { ApplicationsTabs } from "@/components/applications-tabs";

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

  let countQuery = supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", STATUS.wishlist);
  if (filter === "open") countQuery = countQuery.in("status", ACTIVE_STATUSES as unknown as string[]);
  if (filter === "closed") countQuery = countQuery.in("status", CLOSED_STATUSES as unknown as string[]);
  const { count } = await countQuery;
  const total = count ?? 0;

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div className={PAGE_HEADER}>
          <div>
            <h1 className={TEXT_H1}>Applications</h1>
            <p className={`mt-0.5 ${TEXT_MUTED}`}>{total} application{total !== 1 ? "s" : ""}</p>
          </div>
          {/* On mobile: show tabs here so they appear above the action buttons */}
          <div className="hidden mobile:block">
            <ApplicationsTabs active={filter} />
          </div>
          {/* Right column: Add + Delete (top), Export (below) */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={filter === "open" ? "/applications/new" : `/applications/new?from=${filter}`}
                className={BTN_PRIMARY_LINK}
              >
                + Add<span className="mobile:hidden"> Application</span>
              </Link>
              <DeleteAllApplicationsButton hasApplications={total > 0} scope={filter} />
            </div>
            <div className="flex justify-end">
              <CsvExportButton filter={filter} />
            </div>
          </div>
        </div>

        <Suspense fallback={<ApplicationRowsSkeleton />}>
          <ApplicationsResults filter={filter} />
        </Suspense>
      </div>
    </AppShell>
  );
}
