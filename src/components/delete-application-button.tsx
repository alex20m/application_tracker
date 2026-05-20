"use client";

import { useTransition } from "react";
import { deleteApplicationAction } from "@/app/applications/[id]/actions";

type DeleteButtonProps = {
  applicationId: string;
};

export function DeleteApplicationButton({ applicationId }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      startTransition(() => {
        deleteApplicationAction(applicationId);
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
