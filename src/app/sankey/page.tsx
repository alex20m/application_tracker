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
          <h1 className="text-xl font-bold text-gray-900">Application Flow</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Visualize how your applications move through different stages
          </p>
        </div>

        <SankeyChart data={sankeyData} />
      </div>
    </AppShell>
  );
}
