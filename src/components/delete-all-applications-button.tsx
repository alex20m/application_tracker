"use client";

import { useState, useTransition } from "react";
import { deleteAllApplicationsAction } from "@/app/applications/actions";
import { ERROR_BANNER } from "@/lib/ui";

type DeleteAllApplicationsButtonProps = {
  hasApplications: boolean;
  scope: "open" | "closed" | "all";
};

export function DeleteAllApplicationsButton({
  hasApplications,
  scope,
}: DeleteAllApplicationsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAll = () => {
    const label = scope === "all" ? "" : `${scope} `;
    if (window.confirm(`Delete all ${label}applications? This cannot be undone.`)) {
      setError(null);
      startTransition(async () => {
        const result = await deleteAllApplicationsAction(scope);
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
        disabled={!hasApplications || isPending}
        className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:border-red-200 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 mobile:min-h-11 mobile:text-base mobile:px-4"
      >
        {isPending ? "Deleting…" : "Delete all"}
      </button>
    </div>
  );
}
