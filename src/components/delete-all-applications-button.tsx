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
        "Are you sure you want to delete all applications? This cannot be undone."
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
      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {isPending ? "Deleting..." : "Delete all"}
    </button>
  );
}
