"use client";

import { useState, useTransition } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { STATUS_NEXT, STATUS_NAMES, type ApplicationStatus } from "@/lib/statuses";

type ApplicationStatusQuickActionsProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

export function ApplicationStatusQuickActions({
  applicationId,
  currentStatus,
}: ApplicationStatusQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextStatuses = STATUS_NEXT[currentStatus] ?? [];

  const handleChangeStatus = (nextStatus: ApplicationStatus) => {
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("next_status", nextStatus);

    startTransition(() => {
      transitionApplicationStatusAction(formData);
      setIsOpen(false);
    });
  };

  if (nextStatuses.length === 0) {
    return <span className="text-xs text-gray-300 mobile:text-sm">Final status</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 mobile:text-sm mobile:min-h-9 mobile:px-3"
        >
          {isPending ? "Saving..." : "Move to →"}
        </button>
      ) : (
        <div className="flex flex-wrap justify-end gap-1">
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChangeStatus(status)}
              disabled={isPending}
              className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 mobile:text-sm mobile:min-h-9 mobile:px-3"
            >
              {STATUS_NAMES[status]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 mobile:text-sm mobile:min-h-9 mobile:px-3"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
