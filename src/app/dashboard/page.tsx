import Link from "next/link";
import { type ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { computeAnalytics } from "@/lib/analytics";
import { ApplicationList } from "@/components/application-list";
import { ROUTES } from "@/lib/env";
import { BTN_PRIMARY_LINK, SECTION_STACK } from "@/lib/ui";
import type { ApplicationRecord } from "@/lib/types";
import { STATUS, ACTIVE_STATUSES } from "@/lib/statuses";
import { DashboardGreeting } from "@/components/dashboard-greeting";

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

    // Interview rounds: show within 7 days (with date) or unscheduled pending rounds (generic)
    for (const round of app.interview_rounds ?? []) {
      if (round.outcome !== "pending") continue;
      if (!round.scheduled_at) {
        items.push({
          id: app.id,
          company: app.company,
          role: app.role,
          reason: `${round.type} — date not set`,
          reasonColor: "var(--st-interviews)",
          actionLabel: "Prep notes",
        });
        continue;
      }
      const scheduledDate = new Date(round.scheduled_at);
      const diffMs = scheduledDate.getTime() - today.getTime();
      if (diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000) {
        const dateStr = scheduledDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        items.push({
          id: app.id,
          company: app.company,
          role: app.role,
          reason: `${round.type} · ${dateStr}`,
          reasonColor: "var(--st-interviews)",
          actionLabel: "Prep notes",
        });
      }
    }

    // In interviews but no rounds logged yet
    if (app.status === STATUS.interviews && (app.interview_rounds ?? []).length === 0) {
      items.push({
        id: app.id,
        company: app.company,
        role: app.role,
        reason: "Interview in progress — add round details",
        reasonColor: "var(--st-interviews)",
        actionLabel: "Add round",
      });
    }
  }

  // Sort: offers first, then upcoming interviews, then stalled
  const priority = (item: AttentionItem) => {
    if (item.reasonColor === "var(--st-offer)") return 0;
    if (item.reasonColor === "var(--st-interviews)") return 1;
    return 2;
  };

  return items.sort((a, b) => priority(a) - priority(b)).slice(0, 6);
}

// ── Sub-components ───────────────────────────────────────────────────────────

type KpiVariant = "good" | "warn" | "info" | "neutral";

function KpiCard({
  icon,
  title,
  body,
  variant = "neutral",
}: {
  icon: ReactNode;
  title: string;
  body: ReactNode;
  variant?: KpiVariant;
}) {
  const c: Record<KpiVariant, { bg: string; border: string; iconColor: string }> = {
    good: {
      bg: "color-mix(in oklch, var(--st-offer) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--st-offer) 35%, transparent)",
      iconColor: "color-mix(in oklch, var(--st-offer) 90%, white 10%)",
    },
    warn: {
      bg: "color-mix(in oklch, var(--st-ghosted) 10%, var(--surface))",
      border: "color-mix(in oklch, var(--st-ghosted) 40%, transparent)",
      iconColor: "color-mix(in oklch, var(--st-ghosted) 90%, black 5%)",
    },
    info: {
      bg: "color-mix(in oklch, var(--accent) 8%, var(--surface))",
      border: "color-mix(in oklch, var(--accent) 30%, transparent)",
      iconColor: "var(--accent)",
    },
    neutral: {
      bg: "var(--surface-2)",
      border: "var(--border)",
      iconColor: "var(--ink-2)",
    },
  };
  const colors = c[variant];
  return (
    <div
      className="rounded-xl border p-4 mobile:p-3 flex items-center gap-3"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mobile:hidden"
        style={{ background: colors.border, color: colors.iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[13.5px] font-semibold text-ink leading-snug mobile:text-[12.5px]">{title}</p>
        <p className="text-[12.5px] text-ink-2 mt-0.5 mobile:text-[12px]">{body}</p>
      </div>
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
    { label: "Applied", count: analytics.totalApplications, color: "color-mix(in oklch, var(--st-applied) 30%, var(--surface-2))" },
    { label: "Interviews", count: analytics.interviewedCount, color: "color-mix(in oklch, var(--st-interviews) 30%, var(--surface-2))" },
    { label: "Offers", count: analytics.offeredCount, color: "color-mix(in oklch, var(--st-offer) 35%, var(--surface-2))" },
    { label: "Accepted", count: analytics.acceptedCount, color: "color-mix(in oklch, var(--st-accepted) 35%, var(--surface-2))" },
  ];

  const max = analytics.totalApplications || 1;

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
          <DashboardGreeting activeCount={activeCount} attentionCount={attentionCount} />
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
            variant="neutral"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            }
            title="Active applications"
            body={<><strong className="font-semibold text-ink">{analytics.activeCount}</strong> in progress</>}
          />
          <KpiCard
            variant="info"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 7L8 3.5L14 7L8 10.5L2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M2 10.5L8 14L14 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="In interviews"
            body={
              <>
                <strong className="font-semibold text-ink">{analytics.currentlyInterviewingCount}</strong>
                {interviewSub ? ` — ${interviewSub}` : " currently interviewing"}
              </>
            }
          />
          <KpiCard
            variant="good"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 13V9M7 13V5M11 13V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M1 13h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            }
            title="Response rate"
            body={<><strong className="font-semibold text-ink">{pct(analytics.responseRate)}</strong> of applications got a reply</>}
          />
          <KpiCard
            variant="neutral"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Average first reply"
            body={
              analytics.totalApplications > 0
                ? <><strong className="font-semibold text-ink">{days(analytics.avgDaysToFirstResponse)}</strong> across {analytics.totalApplications} applications</>
                : <strong className="font-semibold text-ink">{days(analytics.avgDaysToFirstResponse)}</strong>
            }
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
