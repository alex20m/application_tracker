import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_H3, TEXT_META, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { WishlistForm } from "@/components/wishlist-form";
import { WishlistDeleteButton } from "@/components/wishlist-delete-button";
import { updateWishlistAction } from "@/app/wishlist/actions";
import { redirect } from "next/navigation";

type WishlistDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WishlistDetailPage({ params }: WishlistDetailPageProps) {
  const { id } = await params;
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

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href={ROUTES.wishlist} className="transition hover:text-gray-700 dark:hover:text-gray-300">
            Wishlist
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="truncate max-w-[160px] font-medium text-gray-700 dark:text-gray-300">{application.company}</span>
        </div>

        <div>
          <h1 className={TEXT_H1}>{application.company}</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>{application.role}</p>
        </div>

        <div className={`max-w-2xl ${CARD}`}>
          <WishlistForm action={updateWishlistAction} application={application} />
        </div>

        <div className="max-w-2xl rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-5 mobile:p-4">
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
      </div>
    </AppShell>
  );
}
