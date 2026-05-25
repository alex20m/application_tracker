"use client";

import { useTransition } from "react";
import { deleteWishlistAction } from "@/app/wishlist/actions";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/env";

type WishlistDeleteButtonProps = {
  applicationId: string;
};

export function WishlistDeleteButton({ applicationId }: WishlistDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (window.confirm("Remove from wishlist? This cannot be undone.")) {
      startTransition(async () => {
        const formData = new FormData();
        formData.set("application_id", applicationId);
        await deleteWishlistAction(formData);
        router.push(ROUTES.wishlist);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="w-full cursor-pointer rounded-lg border border-red-200 dark:border-red-500/40 bg-white dark:bg-transparent px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-600 dark:hover:bg-red-500/20 hover:text-white dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 mobile:min-h-11"
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}
