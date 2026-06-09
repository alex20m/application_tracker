"use client";

import { useActionState, useTransition, useState, useEffect, useMemo } from "react";
import { DatePicker } from "@/components/date-picker";
import {
  addInterviewRoundAction,
  updateInterviewRoundAction,
  deleteInterviewRoundAction,
} from "@/app/applications/[id]/actions";
import type { ApplicationRecord, InterviewRound, InterviewRoundOutcome } from "@/lib/types";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, CARD, ERROR_BANNER, INPUT, LABEL, TEXT_H3 } from "@/lib/ui";

const OUTCOMES: { value: InterviewRoundOutcome; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

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
          <label htmlFor="round-date" className={LABEL}>Date</label>
          <DatePicker
            id="round-date"
            name="scheduled_at"
            defaultValue={round?.scheduled_at ?? undefined}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="round-outcome" className={LABEL}>Outcome</label>
          <select
            id="round-outcome"
            name="outcome"
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
    startTransition(() => { void boundDelete(roundId); });
  };

  const rounds = application.interview_rounds;

  return (
    <div className={CARD}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className={TEXT_H3}>Interview rounds</p>
        {!isAdding && (
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

      <div className="space-y-3">
        {rounds.length === 0 && !isAdding && (
          <p className="text-sm text-ink-3">No rounds yet. Add your first interview round.</p>
        )}

        {rounds.map((round) => (
          <div key={round.id}>
            {editingId === round.id ? (
              <RoundForm
                round={round}
                existingRoundTypes={existingRoundTypes}
                action={boundUpdate}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border-base px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{round.type}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${outcomeStyle(round.outcome)}`}
                    >
                      {OUTCOMES.find((o) => o.value === round.outcome)?.label ?? round.outcome}
                    </span>
                    {round.scheduled_at && (
                      <span className="text-xs text-ink-3">{formatDate(round.scheduled_at)}</span>
                    )}
                  </div>
                  {round.notes && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-2">{round.notes}</p>
                  )}
                </div>
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
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <RoundForm
            existingRoundTypes={existingRoundTypes}
            action={boundAdd}
            onCancel={() => setIsAdding(false)}
            onSuccess={() => setIsAdding(false)}
          />
        )}
      </div>
    </div>
  );
}
