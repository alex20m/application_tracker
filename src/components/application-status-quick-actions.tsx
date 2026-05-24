"use client";

import { useState, useTransition } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { BTN_SMALL, TEXT_MUTED } from "@/lib/ui";
import { STATUS_NEXT, STATUS_NAMES, type ApplicationStatus } from "@/lib/statuses";

type ApplicationStatusQuickActionsProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

const BTN_MOVE = `${BTN_SMALL} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300`;
const BTN_STATUS = `${BTN_SMALL} border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25`;
const BTN_CANCEL = `${BTN_SMALL} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`;

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
    return <span className={TEXT_MUTED}>Final status</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isPending}
          className={BTN_MOVE}
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
              className={BTN_STATUS}
            >
              {STATUS_NAMES[status]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className={BTN_CANCEL}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
