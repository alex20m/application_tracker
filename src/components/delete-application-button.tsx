"use client";

import { useState, useTransition } from "react";
import { deleteApplicationAction } from "@/app/applications/[id]/actions";
import { ERROR_BANNER } from "@/lib/ui";

type DeleteButtonProps = {
  applicationId: string;
  returnPath: string;
};

export function DeleteApplicationButton({ applicationId, returnPath }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (window.confirm("Delete this application? This cannot be undone.")) {
      setError(null);
      startTransition(async () => {
        const result = await deleteApplicationAction(applicationId, returnPath);
        if (!result.success && result.error) setError(result.error);
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className={ERROR_BANNER}>{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="w-full cursor-pointer rounded-lg border border-red-200 dark:border-red-500/40 bg-white dark:bg-transparent px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-600 dark:hover:bg-red-500/20 hover:text-white dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 mobile:min-h-11"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
