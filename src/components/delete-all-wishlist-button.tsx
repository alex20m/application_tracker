"use client";

import { useState, useTransition } from "react";
import { deleteAllWishlistAction } from "@/app/wishlist/actions";
import { ERROR_BANNER } from "@/lib/ui";

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
        className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:border-red-200 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Deleting…" : "Delete all"}
      </button>
    </div>
  );
}
