import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";

export default async function SankeyPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const sankeyData = buildSankeyData(applications || []);

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
      </div>
    </AppShell>
  );
}
