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
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isPending ? "Deleting…" : "Delete all"}
    </button>
  );
}
