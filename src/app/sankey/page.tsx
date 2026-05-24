import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SankeyChart } from "@/components/sankey-chart";
import { buildSankeyData } from "@/lib/sankey-builder";
import { SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";

export default async function SankeyPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const sankeyData = buildSankeyData(applications || []);

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div>
          <h1 className={TEXT_H1}>Application Flow</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>
            Visualize how your applications move through different stages
          </p>
        </div>

        <SankeyChart data={sankeyData} />
      </div>
    </AppShell>
  );
}
