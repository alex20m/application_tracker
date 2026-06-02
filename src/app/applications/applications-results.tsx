import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/statuses";
import { ApplicationsSearch } from "@/components/applications-search";

type Props = {
  filter: "open" | "closed" | "all";
};

export async function ApplicationsResults({ filter }: Props) {
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
    <ApplicationsSearch applications={applications ?? []} fromFilter={filter} />
  );
}
