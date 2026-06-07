"use client";

import { useOptimistic, useTransition } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { STATUS, STATUS_NEXT, STATUS_NAMES, statusStageIndex, FINAL_STATUSES, type ApplicationStatus } from "@/lib/statuses";

const STAGES = [
  { label: "Applied", stageIdx: 0 },
  { label: "Interviews", stageIdx: 1 },
  { label: "Offer", stageIdx: 2 },
  { label: "Decision", stageIdx: 3 },
];

// Maps negative-exit statuses to the last pipeline stage the application was in.
// The stage at lastStage + 1 will render red (the step that was never reached).
const EXIT_LAST_STAGE: Partial<Record<ApplicationStatus, number>> = {
  [STATUS.ghosted]:   0,
  [STATUS.cancelled]: 0,
  [STATUS.rejected]:  0,
  [STATUS.withdrew]:  1,
  [STATUS.no_offer]:  1,
  [STATUS.declined]:  2,
};

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
  const exitLastStage = EXIT_LAST_STAGE[optimisticStatus] ?? -1;
  const isNegativeExit = exitLastStage >= 0;

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
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 mb-4">Pipeline Stage</p>

      {/* Stepper — horizontal on desktop, vertical timeline on mobile */}
      <div className="flex items-center mobile:flex-col mobile:items-start">
        {STAGES.map((stage, i) => {
          const isDone = isNegativeExit
            ? stage.stageIdx < exitLastStage
            : currentIdx > stage.stageIdx;
          const isCurrent = isNegativeExit
            ? stage.stageIdx === exitLastStage
            : currentIdx === stage.stageIdx;
          const isRed = isNegativeExit && stage.stageIdx === exitLastStage + 1;
          const isLast = i === STAGES.length - 1;
          const connectorDone = isDone;

          return (
            <div key={stage.stageIdx} className="flex flex-1 items-center min-w-0 mobile:flex-none mobile:flex-col mobile:items-start">
              {/* Pill */}
              <div
                className={[
                  "flex-shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all whitespace-nowrap",
                  isDone || (isNegativeExit && isCurrent)
                    ? "text-[var(--st-offer)]"
                    : isRed
                      ? "text-[var(--st-rejected)]"
                      : isCurrent
                        ? "text-white"
                        : "border border-border-base text-ink-3",
                ].join(" ")}
                style={
                  isDone || (isNegativeExit && isCurrent)
                    ? { background: "color-mix(in oklch, var(--st-offer) 14%, var(--surface))", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-offer) 28%, transparent)" }
                    : isRed
                      ? { background: "color-mix(in oklch, var(--st-rejected) 14%, var(--surface))", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-rejected) 28%, transparent)" }
                      : isCurrent
                        ? { background: "var(--accent)" }
                        : { background: "var(--surface-2)" }
                }
              >
                {stage.label}
              </div>

              {/* Connector — horizontal bar on desktop, vertical bar on mobile */}
              {!isLast && (
                <div
                  className="flex-1 h-[2px] mx-1.5 rounded-full transition-all mobile:flex-none mobile:w-[2px] mobile:h-3 mobile:mx-0 mobile:ml-4 mobile:my-1"
                  style={{ background: connectorDone ? "var(--st-offer)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Move to row */}
      {!isFinal && nextStatuses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-base">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-ink-2 mr-1">Move to:</span>
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onClick={() => handleMove(nextStatus)}
                disabled={isPending}
                className="cursor-pointer rounded-xl border border-border-base bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {STATUS_NAMES[nextStatus]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
