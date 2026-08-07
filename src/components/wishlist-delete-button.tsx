"use client";

import { BTN_DANGER_BLOCK } from "@/lib/ui";

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
      className={BTN_DANGER_BLOCK}
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}
