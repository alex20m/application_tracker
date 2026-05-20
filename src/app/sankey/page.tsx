import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";

export default async function SankeyPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const { data: statusEvents } = await supabase
    .from("application_status_events")
    .select("*")
    .eq("user_id", user.id)
    .order("changed_at", { ascending: true });

  const sankeyData = buildSankeyData(applications || [], statusEvents || []);

  return (
    <AppShell email={user.email || ""}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Application Flow</h2>
          <p className="mt-1 text-sm text-slate-600">
            Visualize how your applications flow through different statuses
          </p>
        </div>

        <SankeyChart data={sankeyData} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Applications</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {applications?.length || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Status Transitions</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statusEvents?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
