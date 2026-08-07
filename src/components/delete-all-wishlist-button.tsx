"use client";

import { useState, useTransition } from "react";
import { deleteAllWishlistAction } from "@/app/wishlist/actions";
import { ERROR_BANNER, BTN_DANGER } from "@/lib/ui";

type DeleteAllWishlistButtonProps = {
  hasWishlist: boolean;
};

export function DeleteAllWishlistButton({ hasWishlist }: DeleteAllWishlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAll = () => {
    if (window.confirm("Delete ALL wishlisted roles? This cannot be undone.")) {
      setError(null);
      startTransition(async () => {
        const result = await deleteAllWishlistAction();
        if (!result.success && result.error) setError(result.error);
      });
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className={ERROR_BANNER}>{error}</p>}
      <button
        type="button"
        onClick={handleDeleteAll}
        disabled={!hasWishlist || isPending}
        className={BTN_DANGER}
      >
        {isPending ? "Deleting…" : "Delete all"}
      </button>
    </div>
  );
}
