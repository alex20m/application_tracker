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
      <div className={SECTION_STACK}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href={ROUTES.wishlist} className="transition hover:text-gray-700 dark:hover:text-gray-300">
            Wishlist
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">New</span>
        </div>

        <div>
          <h1 className={TEXT_H1}>Add to Wishlist</h1>
          <p className={`mt-0.5 ${TEXT_MUTED}`}>Save a role you want to apply for later</p>
        </div>

        <div className={`max-w-2xl ${CARD}`}>
          <WishlistForm action={createWishlistAction} />
        </div>
      </div>
    </AppShell>
  );
}
