import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_MUTED } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { WishlistForm } from "@/components/wishlist-form";
import { createWishlistAction } from "@/app/wishlist/actions";

export default async function NewWishlistPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-3xl mx-auto ${SECTION_STACK}`}>
        <div className="flex items-center gap-2 text-sm text-ink-3 whitespace-nowrap min-w-0">
          <Link href={ROUTES.wishlist} className="transition hover:text-ink-2 flex-shrink-0">
            Wishlist
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-medium text-ink-2">New</span>
        </div>

        <div>
          <h1 className={TEXT_H1}>Add to Wishlist</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>Save a role you want to apply for later</p>
        </div>

        <div className={CARD}>
          <WishlistForm action={createWishlistAction} />
        </div>
      </div>
    </AppShell>
  );
}
