import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import {
  CARD,
  SECTION_STACK,
  TEXT_H1,
  TEXT_H2,
  TEXT_H3,
  TEXT_META,
  TEXT_MUTED,
} from "@/lib/ui";

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function days(value: number | null): string {
  if (value === null) return "—";
  return `${value}d`;
}

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
};

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={CARD}>
      <p className={`${TEXT_META} mb-1`}>{label}</p>
      <p
        className={`text-3xl font-bold mobile:text-2xl ${
          accent ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className={`${TEXT_META} mt-1`}>{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const analytics = computeAnalytics(applications || []);

  if (analytics.totalApplications === 0) {
    return (
      <AppShell email={user.email || ""}>
        <div className={SECTION_STACK}>
          <div>
            <h1 className={TEXT_H1}>Analytics</h1>
            <p className={`mt-0.5 ${TEXT_MUTED}`}>Your job search performance at a glance</p>
          </div>
          <div className={`${CARD} py-16 text-center`}>
            <p className={`${TEXT_H3} mb-2`}>No data yet</p>
            <p className={TEXT_MUTED}>Start adding applications to see your analytics.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div>
          <h1 className={TEXT_H1}>Analytics</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>Your job search performance at a glance</p>
        </div>

        {/* Overview KPIs */}
        <section>
          <h2 className={`${TEXT_H2} mb-3`}>Overview</h2>
          <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-3">
            <StatCard
              label="Total Applications"
              value={String(analytics.totalApplications)}
              sub={`${analytics.activeCount} active`}
            />
            <StatCard
              label="Interview Rate"
              value={pct(analytics.interviewRate)}
              sub={`${analytics.interviewedCount} reached interviews`}
              accent
            />
            <StatCard
              label="Offer Rate"
              value={pct(analytics.offerFromInterviewRate)}
              sub="of interviews → offer"
              accent
            />
            <StatCard
              label="Acceptance Rate"
              value={pct(analytics.acceptanceRate)}
              sub={`${analytics.offeredCount} offer${analytics.offeredCount !== 1 ? "s" : ""} received`}
              accent
            />
          </div>
        </section>

        {/* Response times */}
        <section>
          <h2 className={`${TEXT_H2} mb-3`}>Response Times</h2>
          <div className="grid grid-cols-3 gap-4 mobile:grid-cols-1 mobile:gap-3">
            <StatCard
              label="Avg. Days to First Response"
              value={days(analytics.avgDaysToFirstResponse)}
              sub="from applied date"
            />
            <StatCard
              label="Avg. Days to Interview"
              value={days(analytics.avgDaysToInterview)}
              sub="from applied date"
            />
            <StatCard
              label="Avg. Days to Offer"
              value={days(analytics.avgDaysToOffer)}
              sub="from applied date"
            />
          </div>
        </section>

        {/* Charts */}
        <section>
          <h2 className={`${TEXT_H2} mb-3`}>Breakdown</h2>
          <AnalyticsCharts
            statusCounts={analytics.statusCounts}
            monthlyTrend={analytics.monthlyTrend}
            funnelStages={analytics.funnelStages}
          />
        </section>
      </div>
    </AppShell>
  );
}
