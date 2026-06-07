import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { computeAnalytics } from "@/lib/analytics";
import { ApplicationList } from "@/components/application-list";
import { ROUTES } from "@/lib/env";
import { BTN_PRIMARY_LINK, SECTION_STACK } from "@/lib/ui";
import type { ApplicationRecord } from "@/lib/types";
import { STATUS, ACTIVE_STATUSES } from "@/lib/statuses";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateStamp(): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const month = now.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const date = now.getDate();
  const year = now.getFullYear();
  return `${day} · ${month} ${date}, ${year}`;
}

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function days(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "same day";
  return `${value}d`;
}

// ── Needs Attention ──────────────────────────────────────────────────────────

type AttentionItem = {
  id: string;
  company: string;
  role: string;
  reason: string;
  reasonColor: string;
  actionLabel: string;
};

function buildAttentionItems(applications: ApplicationRecord[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const today = new Date();

  for (const app of applications) {
    // Offer pending
    if (app.status === STATUS.offer) {
      items.push({
        id: app.id,
        company: app.company,
        role: app.role,
        reason: "Offer pending — respond when ready",
        reasonColor: "var(--st-offer)",
        actionLabel: "Respond",
      });
      continue;
    }

    // Going cold (21+ days, still applied/ghosted)
    if (app.status === STATUS.applied || app.status === STATUS.ghosted) {
      const ref = app.applied_on ? new Date(app.applied_on) : null;
      if (ref) {
        const diffDays = Math.floor((today.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 21) {
          items.push({
            id: app.id,
            company: app.company,
            role: app.role,
            reason: `No response in ${diffDays} days · auto-marked Ghosted`,
            reasonColor: "var(--st-ghosted)",
            actionLabel: "Follow up",
          });
          continue;
        }
      }
    }

    // Currently interviewing
    if (app.status === STATUS.interviews) {
      items.push({
        id: app.id,
        company: app.company,
        role: app.role,
        reason: "Interview in progress",
        reasonColor: "var(--st-interviews)",
        actionLabel: "Prep notes",
      });
    }
  }

  // Sort: offers first, then stalled, then interviews
  const priority = (item: AttentionItem) => {
    if (item.reasonColor === "var(--st-offer)") return 0;
    if (item.reasonColor === "var(--st-ghosted)") return 1;
    return 2;
  };

  return items.sort((a, b) => priority(a) - priority(b)).slice(0, 6);
}

// ── Sub-components ───────────────────────────────────────────────────────────

type KpiVariant = "good" | "warn" | "info" | "neutral";

function KpiCard({
  label,
  value,
  sub,
  variant = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: KpiVariant;
}) {
  const c: Record<KpiVariant, { bg: string; border: string }> = {
    good: {
      bg: "color-mix(in oklch, var(--st-offer) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--st-offer) 35%, transparent)",
    },
    warn: {
      bg: "color-mix(in oklch, var(--st-ghosted) 10%, var(--surface))",
      border: "color-mix(in oklch, var(--st-ghosted) 40%, transparent)",
    },
    info: {
      bg: "color-mix(in oklch, var(--accent) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--accent) 30%, transparent)",
    },
    neutral: {
      bg: "var(--surface-2)",
      border: "var(--border)",
    },
  };
  const colors = c[variant];
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1.5"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <p className="text-[12.5px] text-ink-2">{label}</p>
      <p className="text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>
      {sub && <p className="text-[12.5px] text-ink-3">{sub}</p>}
    </div>
  );
}

function NeedsAttentionCard({
  items,
}: {
  items: AttentionItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border-base bg-surface p-[22px] shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-semibold text-ink">Needs attention</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v7M10 14.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-ink-3" />
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" className="text-ink-3" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-ink">Everything looks good</p>
          <p className="text-[12px] text-ink-3 mt-0.5">No applications need attention right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-base bg-surface p-[22px] shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">Needs attention</span>
        <Link
          href={ROUTES.applications}
          className="text-[12.5px] font-medium text-accent hover:text-accent-strong transition"
        >
          View all
        </Link>
      </div>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/applications/${item.id}`}
          className="flex items-center gap-3 rounded-xl border border-border-base bg-surface-2 px-4 py-3 transition hover:bg-surface-3 hover:border-border-strong group"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: item.reasonColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-ink truncate">
              {item.company} — {item.role}
            </p>
            <p className="text-[12px] text-ink-3 mt-px">{item.reason}</p>
          </div>
          <span className="flex-shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-border-base bg-surface text-ink-2 transition group-hover:border-border-strong">
            Go to application
          </span>
        </Link>
      ))}
    </div>
  );
}

type FunnelStage = { label: string; count: number; color: string };

function PipelineCard({ analytics }: { analytics: ReturnType<typeof computeAnalytics> }) {
  const stages: FunnelStage[] = [
    { label: "Applied", count: analytics.activeCount, color: "color-mix(in oklch, var(--st-applied) 30%, var(--surface-2))" },
    { label: "Interviews", count: analytics.interviewedCount, color: "color-mix(in oklch, var(--st-interviews) 30%, var(--surface-2))" },
    { label: "Offers", count: analytics.offeredCount, color: "color-mix(in oklch, var(--st-offer) 35%, var(--surface-2))" },
    {
      label: "Accepted",
      count: analytics.totalApplications > 0 ? analytics.offeredCount - analytics.currentlyOfferCount : 0,
      color: "color-mix(in oklch, var(--st-accepted) 35%, var(--surface-2))",
    },
  ];

  const max = stages[0].count || 1;

  return (
    <div className="rounded-2xl border border-border-base bg-surface p-[22px] shadow-sm flex flex-col gap-4">
      <p className="text-[15px] font-semibold text-ink">Pipeline</p>
      <div className="space-y-2.5">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="w-[78px] flex-shrink-0 text-[12.5px] text-ink-2 text-right">{stage.label}</span>
            <div className="flex-1 h-8 rounded-lg bg-surface-2 overflow-hidden flex items-center">
              {stage.count > 0 ? (
                <div
                  className="h-full rounded-lg flex items-center justify-end pr-2.5 transition-all"
                  style={{
                    width: `${Math.max((stage.count / max) * 100, 10)}%`,
                    background: stage.color,
                    minWidth: "2rem",
                  }}
                >
                  <span className="text-[13px] font-bold leading-none text-ink">
                    {stage.count}
                  </span>
                </div>
              ) : (
                <span className="pl-3 text-[13px] font-bold leading-none text-ink-3">0</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {analytics.interviewRate !== null && (
        <div className="flex items-center justify-between pt-2 border-t border-border-base">
          <span className="text-[12.5px] text-ink-2">Interview conversion</span>
          <span className="text-[14px] font-bold text-accent">{pct(analytics.interviewRate)}</span>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const allApps: ApplicationRecord[] = applications || [];
  const analytics = computeAnalytics(allApps);
  const attentionItems = buildAttentionItems(
    allApps.filter((a) => ACTIVE_STATUSES.includes(a.status))
  );

  // Most-recently updated (exclude wishlist), limited to 3
  const recentApps = allApps
    .filter((a) => a.status !== STATUS.wishlist)
    .slice(0, 3);

  const activeCount = analytics.activeCount;
  const attentionCount = attentionItems.length;

  // Interviews subtitle
  const interviewingApps = allApps.filter((a) => a.status === STATUS.interviews);
  const interviewSub =
    interviewingApps.length > 0
      ? interviewingApps
          .slice(0, 2)
          .map((a) => a.company)
          .join(" · ") + (interviewingApps.length > 2 ? ` +${interviewingApps.length - 2}` : "")
      : undefined;

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        {/* ── Greeting header ─────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 flex-wrap mobile:flex-col mobile:items-stretch mobile:gap-3">
          <div>
            <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-1">
              {getDateStamp()}
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.03em] leading-[1.15] text-ink mobile:text-[26px]">
              {getGreeting()} 👋
            </h1>
            {activeCount > 0 ? (
              <p className="text-[13.5px] text-ink-2 mt-1">
                You have{" "}
                <strong className="font-semibold text-ink">
                  {activeCount} active application{activeCount !== 1 ? "s" : ""}
                </strong>
                {attentionCount > 0 ? (
                  <>
                    {" "}moving and{" "}
                    <strong className="font-semibold text-ink">
                      {attentionCount} thing{attentionCount !== 1 ? "s" : ""}
                    </strong>
                    {" "}that need attention.
                  </>
                ) : (
                  <> · everything looks good.</>
                )}
              </p>
            ) : (
              <p className="text-[13.5px] text-ink-2 mt-1">Add your first application to get started.</p>
            )}
          </div>
          <Link href={ROUTES.newApplication} className={BTN_PRIMARY_LINK}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add application
          </Link>
        </div>

        {/* ── KPI tiles ───────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mobile:grid-cols-2">
          <KpiCard
            label="Active"
            value={String(analytics.activeCount)}
            sub="Applications in progress"
            variant="neutral"
          />
          <KpiCard
            label="In interviews"
            value={String(analytics.currentlyInterviewingCount)}
            sub={interviewSub}
            variant="info"
          />
          <KpiCard
            label="Response rate"
            value={pct(analytics.responseRate)}
            sub="Of applications got a reply"
            variant="good"
          />
          <KpiCard
            label="Avg. first reply"
            value={days(analytics.avgDaysToFirstResponse)}
            sub={
              analytics.totalApplications > 0
                ? `across ${analytics.totalApplications} applications`
                : undefined
            }
            variant="neutral"
          />
        </div>

        {/* ── Two-column: Needs Attention + Pipeline ───────── */}
        <div className="grid grid-cols-[1fr_300px] gap-4 mobile:grid-cols-1">
          <NeedsAttentionCard items={attentionItems} />
          <PipelineCard analytics={analytics} />
        </div>

        {/* ── Recent activity ─────────────────────────────── */}
        {recentApps.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-semibold text-ink">Recent activity</p>
              <Link
                href={ROUTES.applications}
                className="text-[13px] font-medium text-accent hover:text-accent-strong transition"
              >
                All applications
              </Link>
            </div>
            <ApplicationList applications={recentApps} />
          </section>
        )}

        {/* ── Empty state (no applications at all) ────────── */}
        {allApps.filter((a) => a.status !== STATUS.wishlist).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-base bg-surface px-8 py-16 text-center mobile:px-4 mobile:py-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
                <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-ink mb-1">Start tracking your job search</p>
            <p className="text-[13px] text-ink-3 mb-6">
              Add your first application and AppTrack will help you see what&apos;s working.
            </p>
            <Link href={ROUTES.newApplication} className={BTN_PRIMARY_LINK + " inline-flex"}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add your first application
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
