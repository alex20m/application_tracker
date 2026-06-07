"use client";

import { useState, useOptimistic, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const openDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const GAP = 6;
    const EDGE = 8;
    const estimatedHeight = (STATUS_NEXT[optimisticStatus]?.length ?? 1) * 28 + 8;
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    const pos: { top?: number; bottom?: number; right: number } = { right };
    if (spaceBelow >= estimatedHeight) {
      pos.top = rect.bottom + GAP;
    } else {
      pos.bottom = Math.max(EDGE, window.innerHeight - rect.top + GAP);
    }
    setDropdownPos(pos);
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="flex flex-row items-center gap-2">
      <StatusBadge status={optimisticStatus} />

      {!isFinal && (
        <button
          ref={buttonRef}
          type="button"
          onClick={openDropdown}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-border-base bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Move →
        </button>
      )}

      {isOpen && nextStatuses.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={dropdownPos}
          className="fixed z-[9999] rounded-xl border border-border-base bg-surface shadow-lg py-1"
        >
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              role="menuitem"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChangeStatus(status); }}
              disabled={isPending}
              className="block cursor-pointer whitespace-nowrap px-3 py-1.5 text-left text-[12px] text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:opacity-50"
            >
              {STATUS_NAMES[status]}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
