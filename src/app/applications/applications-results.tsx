import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/statuses";
import { TEXT_MUTED } from "@/lib/ui";
import { ApplicationsSearch } from "@/components/applications-search";
import { DeleteAllApplicationsButton } from "@/components/delete-all-applications-button";

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
  const count = applications?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={TEXT_MUTED}>
          {count} application{count !== 1 ? "s" : ""}
        </p>
        <DeleteAllApplicationsButton hasApplications={count > 0} scope={filter} />
      </div>
      <ApplicationsSearch applications={applications ?? []} fromFilter={filter} />
    </div>
  );
}
