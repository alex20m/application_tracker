import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { computeAnalytics } from "@/lib/analytics";
import { ApplicationList } from "@/components/application-list";
import { ROUTES } from "@/lib/env";
import { CARD, BTN_PRIMARY_LINK, SECTION_STACK } from "@/lib/ui";
import type { ApplicationRecord } from "@/lib/types";
import { STATUS, ACTIVE_STATUSES } from "@/lib/statuses";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
            reason: `No activity for ${diffDays} days`,
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
        actionLabel: "Prep",
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

function KpiTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface p-5 shadow-sm mobile:p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-2">{label}</p>
      <p
        className="font-mono text-[30px] font-semibold leading-none"
        style={{ fontFeatureSettings: '"tnum"', color: accent ? "var(--accent)" : "var(--text)" }}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-ink-3 mt-1.5">{sub}</p>}
    </div>
  );
}

function NeedsAttentionCard({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className={`${CARD} flex flex-col`}>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-4">Needs Attention</p>
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
    <div className={`${CARD} flex flex-col gap-2`}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-2">Needs Attention</p>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/applications/${item.id}`}
          className="flex items-center gap-3 rounded-xl border border-border-base bg-surface-2 px-3 py-2.5 transition hover:bg-surface-3 hover:border-border-strong group"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: item.reasonColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">
              {item.company} — {item.role}
            </p>
            <p className="text-[12px] text-ink-3 mt-px">{item.reason}</p>
          </div>
          <span
            className="flex-shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition"
            style={{
              color: item.reasonColor,
              borderColor: `color-mix(in oklch, ${item.reasonColor} 30%, transparent)`,
              background: `color-mix(in oklch, ${item.reasonColor} 8%, var(--surface))`,
            }}
          >
            {item.actionLabel} →
          </span>
        </Link>
      ))}
    </div>
  );
}

type FunnelStage = { label: string; count: number; color: string };

function PipelineCard({ analytics }: { analytics: ReturnType<typeof computeAnalytics> }) {
  const stages: FunnelStage[] = [
    { label: "Active", count: analytics.activeCount, color: "var(--st-applied)" },
    { label: "Interviews", count: analytics.interviewedCount, color: "var(--st-interviews)" },
    { label: "Offers", count: analytics.offeredCount, color: "var(--st-offer)" },
    { label: "Accepted", count: analytics.totalApplications > 0 ? (analytics.offeredCount - (analytics.currentlyOfferCount)) : 0, color: "var(--st-accepted)" },
  ];

  const max = stages[0].count || 1;

  return (
    <div className={`${CARD} flex flex-col gap-4`}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Pipeline</p>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12.5px] text-ink-2">{stage.label}</span>
              <span className="font-mono text-[13px] font-semibold text-ink" style={{ fontFeatureSettings: '"tnum"' }}>
                {stage.count}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  background: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {analytics.interviewRate !== null && (
        <p className="text-[12px] text-ink-3 pt-1 border-t border-border-base">
          Interview conversion:{" "}
          <span className="font-mono font-semibold text-ink-2">
            {pct(analytics.interviewRate)}
          </span>
        </p>
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

  // Attention summary line
  const activeCount = analytics.activeCount;
  const attentionCount = attentionItems.length;
  const summaryLine =
    activeCount === 0
      ? "Add your first application to get started."
      : attentionCount > 0
        ? `${activeCount} active application${activeCount !== 1 ? "s" : ""} · ${attentionCount} need${attentionCount === 1 ? "s" : ""} attention`
        : `${activeCount} active application${activeCount !== 1 ? "s" : ""} · everything looks good`;

  // Interviews subtitle
  const interviewingApps = allApps.filter((a) => a.status === STATUS.interviews);
  const interviewSub =
    interviewingApps.length > 0
      ? interviewingApps
          .slice(0, 2)
          .map((a) => a.company)
          .join(", ") + (interviewingApps.length > 2 ? ` +${interviewingApps.length - 2}` : "")
      : undefined;

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        {/* ── Greeting header ─────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 flex-wrap mobile:flex-col mobile:items-stretch mobile:gap-3">
          <div>
            <h1 className="text-[27px] font-bold tracking-[-0.025em] leading-[1.18] text-ink mobile:text-2xl">
              {getGreeting()} 👋
            </h1>
            <p className="text-[13.5px] text-ink-2 mt-1">{summaryLine}</p>
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
          <KpiTile
            label="Active"
            value={String(analytics.activeCount)}
          />
          <KpiTile
            label="Interviewing"
            value={String(analytics.currentlyInterviewingCount)}
            sub={interviewSub}
            accent
          />
          <KpiTile
            label="Response Rate"
            value={pct(analytics.responseRate)}
          />
          <KpiTile
            label="Avg. First Reply"
            value={days(analytics.avgDaysToFirstResponse)}
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
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
                Recent Activity
              </p>
              <Link
                href={ROUTES.applications}
                className="text-[12.5px] font-medium text-ink-3 hover:text-accent transition"
              >
                View all →
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
            <p className="text-[13px] text-ink-3 mb-6">Add your first application and AppTrack will help you see what&apos;s working.</p>
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
