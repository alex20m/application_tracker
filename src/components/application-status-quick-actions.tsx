"use client";

import { useState, useTransition } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import {
  NEXT_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/statuses";
import { StatusBadge } from "@/components/status-badge";

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
  const nextStatuses = NEXT_STATUSES[currentStatus] ?? [];

  const handleChangeStatus = (nextStatus: ApplicationStatus) => {
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("next_status", nextStatus);

    startTransition(() => {
      transitionApplicationStatusAction(formData);
      setIsOpen(false);
    });
  };

  return (
    <div className="flex h-full flex-col items-end justify-start gap-2 whitespace-nowrap">
      <StatusBadge status={currentStatus} />

      {nextStatuses.length > 0 ? (
        <>
          {!isOpen ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              disabled={isPending}
              className="mt-1 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Change status
            </button>
          ) : (
            <div className="mt-1 flex flex-wrap justify-end gap-1">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleChangeStatus(status)}
                  disabled={isPending}
                  className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Final status</p>
      )}
    </div>
  );
}
