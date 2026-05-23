"use client";

import { useTransition } from "react";
import { deleteApplicationAction } from "@/app/applications/[id]/actions";

type DeleteButtonProps = {
  applicationId: string;
};

export function DeleteApplicationButton({ applicationId }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Delete this application? This cannot be undone.")) {
      startTransition(() => {
        deleteApplicationAction(applicationId);
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="cursor-pointer rounded-lg border border-red-200 dark:border-red-500/40 bg-white dark:bg-transparent px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-600 dark:hover:bg-red-500/20 hover:text-white dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 mobile:min-h-11 mobile:text-base mobile:px-4"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
