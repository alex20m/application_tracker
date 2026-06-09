import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { BTN_PRIMARY_LINK, PAGE_HEADER, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { WishlistSearch } from "@/components/wishlist-search";
import { DeleteAllWishlistButton } from "@/components/delete-all-wishlist-button";

export default async function WishlistPage() {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "wishlist")
    .order("updated_at", { ascending: false });

  return (
    <AppShell email={user.email || ""}>
      <div className={SECTION_STACK}>
        <div className={PAGE_HEADER}>
          <div>
            <h1 className={TEXT_H1}>Wishlist</h1>
            <p className={`mt-0.5 ${TEXT_MUTED}`}>
              {applications?.length || 0} role{applications?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.newWishlist} className={BTN_PRIMARY_LINK}>
              + Add<span className="mobile:hidden"> to wishlist</span>
            </Link>
            <DeleteAllWishlistButton hasWishlist={Boolean(applications?.length)} />
          </div>
        </div>

        <WishlistSearch applications={applications || []} />
      </div>
    </AppShell>
  );
}
