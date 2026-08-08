import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES, STATUS } from "@/lib/statuses";
import { BTN_PRIMARY_LINK } from "@/lib/ui";
import { ApplicationsSearch } from "@/components/applications-search";
import { ApplicationsFilterView } from "@/components/applications-filter-view";
import { CsvExportButton } from "@/components/csv-export-button";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";

type Props = {
  filter: "open" | "closed" | "all";
};

export async function ApplicationsResults({ filter }: Props) {
  const { supabase, user } = await requireUser();

  // Fetch all non-wishlist applications (wishlist items live on the wishlist page only)
  const { data: allApps } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", STATUS.wishlist)
    .order("updated_at", { ascending: false });

  const all = allApps ?? [];
  const openApps = all.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const closedApps = all.filter((a) => CLOSED_STATUSES.includes(a.status));

  const counts = {
    open: openApps.length,
    closed: closedApps.length,
    all: all.length,
  };

  const filtered =
    filter === "open" ? openApps : filter === "closed" ? closedApps : all;

  const actions = (
    <>
      <Link
        href={filter === "open" ? "/applications/new" : `/applications/new?from=${filter}`}
        className={BTN_PRIMARY_LINK}
      >
        + Add<span className="mobile:hidden"> Application</span>
      </Link>
      <CsvExportButton filter={filter} />
      <DeleteAllApplicationsButton hasApplications={filtered.length > 0} scope={filter} />
    </>
  );

  return (
    <ApplicationsFilterView active={filter} counts={counts} actions={actions}>
      <ApplicationsSearch applications={filtered} fromFilter={filter} />
    </ApplicationsFilterView>
  );
}
