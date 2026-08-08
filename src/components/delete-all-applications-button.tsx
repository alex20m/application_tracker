"use client";

import { useState, useTransition } from "react";
import { deleteAllApplicationsAction } from "@/app/applications/actions";
import { ERROR_BANNER, BTN_DANGER } from "@/lib/ui";

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
        className={BTN_DANGER}
      >
        {isPending ? "Deleting…" : "Delete all"}
      </button>
    </div>
  );
}
