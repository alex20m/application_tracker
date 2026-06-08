import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { BTN_GHOST, BTN_PRIMARY_LINK, CARD, SECTION_STACK, TEXT_H3, TEXT_LABEL, TEXT_META } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { WishlistForm } from "@/components/wishlist-form";
import { WishlistDeleteButton } from "@/components/wishlist-delete-button";
import { updateWishlistAction } from "@/app/wishlist/actions";
import { redirect } from "next/navigation";

function getCompanyInitials(company: string): string {
  const words = company.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return company.slice(0, 2).toUpperCase();
}

type WishlistDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function WishlistDetailPage({ params, searchParams }: WishlistDetailPageProps) {
  const { id } = await params;
  const { mode } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "wishlist")
    .single();

  if (!application) {
    redirect(ROUTES.wishlist);
  }

  const viewPath = `/wishlist/${id}`;
  const isEdit = mode === "edit";

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-3xl mx-auto ${SECTION_STACK}`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-3 whitespace-nowrap min-w-0">
          <Link href={ROUTES.wishlist} className="transition hover:text-ink-2 flex-shrink-0">
            Wishlist
          </Link>
          <span className="text-border-strong">/</span>
          {isEdit ? (
            <>
              <Link href={viewPath} className="transition hover:text-ink-2 truncate max-w-[160px]">
                {application.company}
              </Link>
              <span className="text-border-strong">/</span>
              <span className="font-medium text-ink-2">Edit</span>
            </>
          ) : (
            <span className="truncate max-w-[160px] font-medium text-ink-2">{application.company}</span>
          )}
        </div>

        {/* Header: monogram + company/role */}
        <div className="flex items-center gap-4 mobile:gap-3">
          <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-2xl border border-border-base bg-surface-2 text-[17px] font-bold tracking-tight text-ink-2 shadow-sm mobile:h-12 mobile:w-12 mobile:text-[14px]">
            {getCompanyInitials(application.company)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-bold tracking-[-0.02em] text-ink truncate whitespace-nowrap leading-tight">
              {application.company}
            </h1>
            <p className="mt-0.5 text-sm text-ink-2 truncate">{application.role}</p>
          </div>
        </div>

        {isEdit ? (
          /* ── Edit mode ── */
          <>
            <div className={CARD}>
              <WishlistForm action={updateWishlistAction} application={application} returnPath={viewPath} />
            </div>

            <div
              className="rounded-2xl border p-5 mobile:p-4"
              style={{
                borderColor: "color-mix(in oklch, var(--st-rejected) 28%, transparent)",
                background: "color-mix(in oklch, var(--st-rejected) 6%, var(--surface))",
              }}
            >
              <div className="flex items-center justify-between gap-4 mobile:flex-col mobile:items-stretch mobile:gap-3">
                <div>
                  <p className={TEXT_H3}>Danger zone</p>
                  <p className={`mt-0.5 ${TEXT_META}`}>
                    Remove this role from your wishlist. Cannot be undone.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <WishlistDeleteButton applicationId={id} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── View mode ── */
          <>
            <div className={CARD}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mobile:grid-cols-1">
                <div>
                  <p className={TEXT_LABEL}>Company</p>
                  <p className="mt-1 text-sm text-ink">{application.company}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Role</p>
                  <p className="mt-1 text-sm text-ink">{application.role}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Location</p>
                  <p className="mt-1 text-sm text-ink">{application.location || "—"}</p>
                </div>
                <div>
                  <p className={TEXT_LABEL}>Source</p>
                  <p className="mt-1 text-sm text-ink">{application.source || "—"}</p>
                </div>
                {application.notes && (
                  <div className="col-span-2 mobile:col-span-1">
                    <p className={TEXT_LABEL}>Notes</p>
                    <p className="mt-1 text-sm text-ink whitespace-pre-wrap">{application.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Link href={ROUTES.wishlist} className={BTN_GHOST}>← Go Back</Link>
              <Link href={`/wishlist/${id}?mode=edit`} className={BTN_PRIMARY_LINK}>Edit</Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
