"use client";

import { useTransition } from "react";
import { deleteAllApplicationsAction } from "@/app/applications/actions";

type DeleteAllApplicationsButtonProps = {
  hasApplications: boolean;
};

export function DeleteAllApplicationsButton({
  hasApplications,
}: DeleteAllApplicationsButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDeleteAll = () => {
    if (
      window.confirm(
        "Delete ALL applications? This cannot be undone."
      )
    ) {
      startTransition(() => {
        deleteAllApplicationsAction();
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      disabled={!hasApplications || isPending}
      className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:border-red-200 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 mobile:min-h-11 mobile:text-base mobile:px-4"
    >
      {isPending ? "Deleting…" : "Delete all"}
    </button>
  );
}
