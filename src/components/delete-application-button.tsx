"use client";

import { useState, useTransition } from "react";
import { deleteApplicationAction } from "@/app/applications/[id]/actions";
import { ERROR_BANNER, BTN_DANGER_BLOCK } from "@/lib/ui";

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
        className={BTN_DANGER_BLOCK}
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
