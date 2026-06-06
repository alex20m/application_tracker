"use client";

import { useOptimistic, useTransition } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { STATUS_NEXT, STATUS_NAMES, statusStageIndex, FINAL_STATUSES, type ApplicationStatus } from "@/lib/statuses";

const STAGES = [
  { label: "Applied", stageIdx: 0 },
  { label: "Interviews", stageIdx: 1 },
  { label: "Offer", stageIdx: 2 },
  { label: "Decision", stageIdx: 3 },
];

type Props = {
  applicationId: string;
  status: ApplicationStatus;
};

export function PipelineStepper({ applicationId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  const currentIdx = statusStageIndex(optimisticStatus);
  const nextStatuses = STATUS_NEXT[optimisticStatus] ?? [];
  const isFinal = FINAL_STATUSES.includes(optimisticStatus);

  const handleMove = (nextStatus: ApplicationStatus) => {
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("next_status", nextStatus);
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      await transitionApplicationStatusAction(formData);
    });
  };

  return (
    <div className="rounded-2xl border border-border-base bg-surface p-[22px] shadow-sm mobile:p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-4">Pipeline</p>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isDone = currentIdx > stage.stageIdx;
          const isCurrent = currentIdx === stage.stageIdx;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.stageIdx} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center min-w-0 flex-1">
                {/* Circle */}
                <div className={[
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all",
                  isDone
                    ? "text-white"
                    : isCurrent
                      ? "bg-accent text-accent-ink ring-2 ring-accent/30"
                      : "bg-surface-2 border border-border-base text-ink-3",
                ].join(" ")}
                  style={isDone ? { background: "var(--st-offer)" } : undefined}
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span className={[
                  "mt-1.5 text-[11.5px] font-medium whitespace-nowrap",
                  isCurrent ? "text-accent-strong font-semibold" : isDone ? "text-ink-2" : "text-ink-3",
                ].join(" ")}>
                  {stage.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 h-[2px] mx-1 rounded-full transition-all"
                  style={{ background: isDone ? "var(--st-offer)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Move to row */}
      {!isFinal && nextStatuses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-base">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-2">Move to:</p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onClick={() => handleMove(nextStatus)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-border-base bg-surface-2 px-3 py-1.5 text-[12.5px] font-medium text-ink-2 transition hover:bg-surface-3 hover:text-ink disabled:opacity-50"
              >
                <span className="status-dot h-2 w-2 rounded-full" data-status={nextStatus} />
                {STATUS_NAMES[nextStatus]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
