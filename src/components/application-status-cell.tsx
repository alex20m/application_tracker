"use client";

import { useState, useOptimistic, useTransition, useEffect, useRef } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { StatusBadge } from "@/components/status-badge";
import { FINAL_STATUSES, STATUS_NEXT, STATUS_NAMES, type ApplicationStatus } from "@/lib/statuses";

type ApplicationStatusCellProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

export function ApplicationStatusCell({
  applicationId,
  currentStatus,
}: ApplicationStatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const popoverRef = useRef<HTMLDivElement>(null);

  const nextStatuses = STATUS_NEXT[optimisticStatus] ?? [];
  const isFinal = FINAL_STATUSES.includes(optimisticStatus);

  const handleChangeStatus = (nextStatus: ApplicationStatus) => {
    setIsOpen(false);
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("next_status", nextStatus);

    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      await transitionApplicationStatusAction(formData);
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex flex-row items-center gap-2" ref={popoverRef}>
      <StatusBadge status={optimisticStatus} />

      {!isFinal && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-border-base bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Move →
        </button>
      )}

      {/* Popover */}
      {isOpen && nextStatuses.length > 0 && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 z-20 min-w-[160px] rounded-2xl border border-border-base bg-surface shadow-xl py-2"
        >
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              role="menuitem"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChangeStatus(status); }}
              disabled={isPending}
              className="w-full px-5 py-3 text-left text-[15px] text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:opacity-50"
            >
              {STATUS_NAMES[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
