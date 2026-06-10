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
        className="cursor-pointer rounded-[10px] border border-border-strong bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink-2 shadow-sm transition hover:border-red-200 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Deleting…" : "Delete all"}
      </button>
    </div>
  );
}
