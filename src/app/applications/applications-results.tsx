import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/statuses";
import { ApplicationsSearch } from "@/components/applications-search";
import { ApplicationsFilterView } from "@/components/applications-filter-view";

type Props = {
  filter: "open" | "closed" | "all";
};

export async function ApplicationsResults({ filter }: Props) {
  const { supabase, user } = await requireUser();

  // Fetch all to compute counts
  const { data: allApps } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
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

  return (
    <ApplicationsFilterView active={filter} counts={counts}>
      <ApplicationsSearch applications={filtered} fromFilter={filter} />
    </ApplicationsFilterView>
  );
}
