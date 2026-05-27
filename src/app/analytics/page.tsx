import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AnalyticsView } from "@/components/analytics-view";
import { SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div>
          <h1 className={TEXT_H1}>Analytics</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>Your job search performance at a glance</p>
        </div>
        <AnalyticsView applications={applications || []} />
      </div>
    </AppShell>
  );
}
