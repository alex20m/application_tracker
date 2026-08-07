"use client";

import { useOptimistic, useTransition, useState } from "react";
import { transitionApplicationStatusAction } from "@/app/applications/actions";
import { STATUS, STATUS_NEXT, STATUS_NAMES, statusStageIndex, FINAL_STATUSES, type ApplicationStatus } from "@/lib/statuses";

const STAGES = [
  { label: "Applied", stageIdx: 0 },
  { label: "Interviews", stageIdx: 1 },
  { label: "Offer", stageIdx: 2 },
  { label: "Decision", stageIdx: 3 },
];

const REVERSED_STAGES = [...STAGES].reverse();

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

function pillClassName(isDone: boolean, isCurrent: boolean, isRed: boolean, isNegativeExit: boolean) {
  const base = "flex-shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all whitespace-nowrap";
  if (isDone || (isNegativeExit && isCurrent)) return `${base} text-[var(--st-offer)]`;
  if (isRed) return `${base} text-[var(--st-rejected)]`;
  if (isCurrent) return `${base} text-white`;
  return `${base} border border-border-base text-ink-3`;
}

function pillStyle(isDone: boolean, isCurrent: boolean, isRed: boolean, isNegativeExit: boolean): React.CSSProperties {
  if (isDone || (isNegativeExit && isCurrent))
    return { background: "color-mix(in oklch, var(--st-offer) 14%, var(--surface))", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-offer) 28%, transparent)" };
  if (isRed)
    return { background: "color-mix(in oklch, var(--st-rejected) 14%, var(--surface))", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-rejected) 28%, transparent)" };
  if (isCurrent) return { background: "var(--accent)" };
  return { background: "var(--surface-2)" };
}

export function PipelineStepper({ applicationId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const currentIdx = statusStageIndex(optimisticStatus);
  const nextStatuses = STATUS_NEXT[optimisticStatus] ?? [];
  const isFinal = FINAL_STATUSES.includes(optimisticStatus);
  const exitLastStage = EXIT_LAST_STAGE[optimisticStatus] ?? -1;
  const isNegativeExit = exitLastStage >= 0;

  const handleMove = (nextStatus: ApplicationStatus) => {
    setTransitionError(null);
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("next_status", nextStatus);
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      const result = await transitionApplicationStatusAction(formData);
      if (result?.error) setTransitionError(result.error);
    });
  };

  return (
    <div className="rounded-3xl border border-border-base bg-surface p-[22px] shadow-soft mobile:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-4">Pipeline Stage</p>

      {/* Desktop: horizontal left-to-right stepper */}
      <div className="flex items-center mobile:hidden">
        {STAGES.map((stage, i) => {
          const isDone = isNegativeExit ? stage.stageIdx < exitLastStage : currentIdx > stage.stageIdx;
          const isCurrent = isNegativeExit ? stage.stageIdx === exitLastStage : currentIdx === stage.stageIdx;
          const isRed = isNegativeExit && stage.stageIdx === exitLastStage + 1;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.stageIdx} className="flex flex-1 items-center min-w-0">
              <div className={pillClassName(isDone, isCurrent, isRed, isNegativeExit)} style={pillStyle(isDone, isCurrent, isRed, isNegativeExit)}>
                {stage.label}
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-[2px] mx-1.5 rounded-full transition-all"
                  style={{ background: isDone ? "var(--st-offer)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical timeline, newest/most-advanced at top, oldest at bottom */}
      <div className="hidden mobile:flex mobile:flex-col mobile:items-start">
        {REVERSED_STAGES.map((stage, i) => {
          const isDone = isNegativeExit ? stage.stageIdx < exitLastStage : currentIdx > stage.stageIdx;
          const isCurrent = isNegativeExit ? stage.stageIdx === exitLastStage : currentIdx === stage.stageIdx;
          const isRed = isNegativeExit && stage.stageIdx === exitLastStage + 1;
          const isLast = i === REVERSED_STAGES.length - 1; // Applied is last
          // Connector below stage X connects to stage X-1 (less advanced); green if stage X-1 is done.
          const connectorDone = isNegativeExit ? stage.stageIdx <= exitLastStage : currentIdx >= stage.stageIdx;

          return (
            <div key={stage.stageIdx} className="flex flex-col items-start">
              <div className={pillClassName(isDone, isCurrent, isRed, isNegativeExit)} style={pillStyle(isDone, isCurrent, isRed, isNegativeExit)}>
                {stage.label}
              </div>
              {!isLast && (
                <div
                  className="w-[2px] h-3 ml-4 my-1 rounded-full transition-all"
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
          {transitionError && (
            <p className="mt-2 text-[13px] text-[var(--st-rejected)]">{transitionError}</p>
          )}
        </div>
      )}
    </div>
  );
}
