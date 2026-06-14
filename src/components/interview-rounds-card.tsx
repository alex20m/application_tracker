"use client";

import { useActionState, useTransition, useState, useEffect, useMemo } from "react";
import { DatePicker } from "@/components/date-picker";
import {
  addInterviewRoundAction,
  updateInterviewRoundAction,
  deleteInterviewRoundAction,
} from "@/app/applications/[id]/actions";
import type { ApplicationRecord, InterviewRound, InterviewRoundOutcome } from "@/lib/types";
import { STATUS } from "@/lib/statuses";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, CARD, ERROR_BANNER, INPUT, LABEL, TEXT_H3 } from "@/lib/ui";

const OUTCOMES: { value: InterviewRoundOutcome; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

function pillProps(outcome: InterviewRoundOutcome): {
  style: Record<string, string>;
  className: string;
} {
  const base =
    "flex-shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all max-w-[130px] truncate";
  switch (outcome) {
    case "passed":
      return {
        className: `${base} text-[var(--st-offer)]`,
        style: {
          background: "color-mix(in oklch, var(--st-offer) 14%, var(--surface))",
          boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-offer) 28%, transparent)",
        },
      };
    case "failed":
      return {
        className: `${base} text-[var(--st-rejected)]`,
        style: {
          background: "color-mix(in oklch, var(--st-rejected) 14%, var(--surface))",
          boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--st-rejected) 28%, transparent)",
        },
      };
    case "pending":
      return {
        className: `${base} text-white`,
        style: { background: "var(--accent)" },
      };
    case "cancelled":
    default:
      return {
        className: `${base} text-ink-3 border border-border-base`,
        style: { background: "var(--surface-2)" },
      };
  }
}

function outcomeStyle(outcome: InterviewRoundOutcome): string {
  switch (outcome) {
    case "passed":
      return "text-[var(--st-offer)] bg-[color-mix(in_oklch,var(--st-offer)_10%,transparent)]";
    case "failed":
      return "text-[var(--st-rejected)] bg-[color-mix(in_oklch,var(--st-rejected)_10%,transparent)]";
    case "cancelled":
      return "text-ink-3 bg-surface-2";
    default:
      return "text-ink-3 bg-surface-2";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type RoundFormProps = {
  round?: InterviewRound;
  existingRoundTypes: string[];
  onCancel: () => void;
  onSuccess: () => void;
  action: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
};

function RoundForm({ round, existingRoundTypes, onCancel, onSuccess, action }: RoundFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border-base bg-surface-2 p-4">
      {state.error && <div className={ERROR_BANNER}>{state.error}</div>}
      {round && <input type="hidden" name="id" value={round.id} />}

      <div className="grid grid-cols-2 gap-4 mobile:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="round-type" className={LABEL}>
            Type <span className="text-[var(--st-rejected)]">*</span>
          </label>
          <input
            id="round-type"
            type="text"
            name="type"
            required
            defaultValue={round?.type ?? ""}
            className={INPUT}
            placeholder="e.g. Phone screen"
            list={existingRoundTypes.length > 0 ? "round-type-suggestions" : undefined}
            autoComplete="off"
          />
          {existingRoundTypes.length > 0 && (
            <datalist id="round-type-suggestions">
              {existingRoundTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="round-date" className={LABEL}>
            Date <span className="text-[var(--st-rejected)]">*</span>
          </label>
          <DatePicker
            id="round-date"
            name="scheduled_at"
            required
            defaultValue={round?.scheduled_at ?? undefined}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="round-outcome" className={LABEL}>
            Outcome <span className="text-[var(--st-rejected)]">*</span>
          </label>
          <select
            id="round-outcome"
            name="outcome"
            required
            defaultValue={round?.outcome ?? "pending"}
            className={INPUT}
          >
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="round-notes" className={LABEL}>Notes</label>
          <textarea
            id="round-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={round?.notes ?? ""}
            className={`${INPUT} resize-none`}
            placeholder="Optional notes..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className={BTN_GHOST} disabled={isPending}>
          Cancel
        </button>
        <button type="submit" className={BTN_PRIMARY} disabled={isPending}>
          {isPending ? "Saving…" : round ? "Update" : "Add round"}
        </button>
      </div>
    </form>
  );
}

type Props = {
  application: ApplicationRecord;
  existingRoundTypes: string[];
};

export function InterviewRoundsCard({ application, existingRoundTypes }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canEdit = application.status === STATUS.interviews;
  const rounds = application.interview_rounds;
  const latestRoundId = rounds[rounds.length - 1]?.id;
  const reversedRounds = [...rounds].reverse();

  const boundAdd = useMemo(
    () => addInterviewRoundAction.bind(null, application.id),
    [application.id]
  );
  const boundUpdate = useMemo(
    () => updateInterviewRoundAction.bind(null, application.id),
    [application.id]
  );
  const boundDelete = useMemo(
    () => deleteInterviewRoundAction.bind(null, application.id),
    [application.id]
  );

  const handleDelete = (roundId: string) => {
    startTransition(() => {
      void boundDelete(roundId);
    });
  };

  return (
    <div className={CARD}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className={TEXT_H3}>Interview rounds</p>
        {canEdit && !isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
            }}
            className={`${BTN_SMALL} border-border-base text-ink-2 hover:bg-surface-2`}
          >
            + Add round
          </button>
        )}
      </div>

      <div>
        {/* Add form — floats above existing rounds (newest-first order) */}
        {isAdding && (
          <div className="mb-4">
            <RoundForm
              existingRoundTypes={existingRoundTypes}
              action={boundAdd}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => setIsAdding(false)}
            />
          </div>
        )}

        {rounds.length === 0 && !isAdding && (
          <p className="text-sm text-ink-3">
            {canEdit
              ? "No rounds yet. Add your first interview round."
              : "No interview rounds recorded."}
          </p>
        )}

        {/* Vertical timeline: newest at top, oldest at bottom */}
        {reversedRounds.map((round, displayIdx) => {
          const isLastInDisplay = displayIdx === reversedRounds.length - 1; // oldest round
          const roundBelow = reversedRounds[displayIdx + 1]; // the older round below
          const connectorDone = roundBelow?.outcome === "passed";
          const isLatest = round.id === latestRoundId;
          const isEditing = editingId === round.id;
          const { className: pillClass, style: pillStyle } = pillProps(round.outcome);

          return (
            <div key={round.id} className="flex items-stretch gap-3">
              {/* Left: node column (pill + vertical connector) */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={pillClass} style={pillStyle} title={round.type}>
                  {round.type}
                </div>
                {!isLastInDisplay && (
                  <div
                    className="w-[2px] flex-1 min-h-[20px] rounded-full mt-1.5"
                    style={{
                      background: connectorDone ? "var(--st-offer)" : "var(--border)",
                    }}
                  />
                )}
              </div>

              {/* Right: content */}
              <div className={`flex-1 ${!isLastInDisplay ? "pb-4" : ""}`}>
                {isEditing ? (
                  <RoundForm
                    round={round}
                    existingRoundTypes={existingRoundTypes}
                    action={boundUpdate}
                    onCancel={() => setEditingId(null)}
                    onSuccess={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0 flex-1">
                      {/* Outcome badge */}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${outcomeStyle(round.outcome)}`}
                      >
                        {OUTCOMES.find((o) => o.value === round.outcome)?.label ?? round.outcome}
                      </span>
                      {/* Notes first — swapped above date per user request */}
                      {round.notes && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-2">{round.notes}</p>
                      )}
                      {/* Date below notes */}
                      {round.scheduled_at && (
                        <p className="mt-0.5 text-xs text-ink-3">{formatDate(round.scheduled_at)}</p>
                      )}
                    </div>

                    {/* Edit/Delete: only on the latest round while status is interviews */}
                    {canEdit && isLatest && (
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(round.id);
                            setIsAdding(false);
                          }}
                          className={`${BTN_SMALL} border-border-base text-ink-3 hover:bg-surface-2`}
                          disabled={isPending}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(round.id)}
                          className={`${BTN_SMALL} border-[color-mix(in_oklch,var(--st-rejected)_30%,transparent)] text-[var(--st-rejected)] hover:bg-[color-mix(in_oklch,var(--st-rejected)_8%,var(--surface))]`}
                          disabled={isPending}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
