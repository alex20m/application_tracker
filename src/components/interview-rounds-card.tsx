"use client";

import { useActionState, useOptimistic, useTransition, useState, useEffect, useMemo } from "react";
import { DatePicker } from "@/components/date-picker";
import {
  addInterviewRoundAction,
  updateInterviewRoundAction,
  deleteInterviewRoundAction,
} from "@/app/applications/[id]/actions";
import type { ApplicationRecord, InterviewRound, InterviewRoundOutcome } from "@/lib/types";
import { STATUS } from "@/lib/statuses";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, CARD, ERROR_BANNER, INPUT, LABEL, TEXT_LABEL } from "@/lib/ui";

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
  const latestRound = rounds[rounds.length - 1] ?? null;
  const reversedRounds = useMemo(() => [...rounds].reverse(), [rounds]);

  // Can only add a new round when the previous round is closed (passed/cancelled).
  // Pending = still open; failed = terminal state.
  const canAddNewRound =
    rounds.length === 0 ||
    latestRound?.outcome === "passed" ||
    latestRound?.outcome === "cancelled";

  const [optimisticOutcome, setOptimisticOutcome] = useOptimistic<InterviewRoundOutcome>(
    latestRound?.outcome ?? "pending"
  );

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

  const handleDelete = () => {
    if (!latestRound) return;
    startTransition(() => {
      void boundDelete(latestRound.id);
    });
  };

  const handleSetOutcome = (outcome: InterviewRoundOutcome) => {
    if (!latestRound) return;
    const fd = new FormData();
    fd.set("id", latestRound.id);
    fd.set("type", latestRound.type);
    if (latestRound.scheduled_at) fd.set("scheduled_at", latestRound.scheduled_at);
    if (latestRound.notes) fd.set("notes", latestRound.notes);
    fd.set("outcome", outcome);
    startTransition(async () => {
      setOptimisticOutcome(outcome);
      await boundUpdate(null, fd);
    });
  };

  const effectiveOutcome = (round: InterviewRound): InterviewRoundOutcome =>
    round.id === latestRound?.id ? optimisticOutcome : round.outcome;

  return (
    <div className={CARD}>
      {/* Header — matches pipeline card style */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className={TEXT_LABEL}>Interview Rounds</p>
        {canEdit && canAddNewRound && !isAdding && (
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

      {/* Add form */}
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

      {rounds.length > 0 && (
        <>
          {/* Desktop: horizontal stepper, chronological left-to-right */}
          <div className="flex items-start mobile:hidden">
            {rounds.map((round, i) => {
              const isLast = i === rounds.length - 1;
              const outcome = effectiveOutcome(round);
              const { className: pillClass, style: pStyle } = pillProps(outcome);
              const date = formatDate(round.scheduled_at);
              const connectorDone = outcome === "passed";

              return (
                <div key={round.id} className="flex flex-1 items-start min-w-0">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={pillClass} style={pStyle} title={round.type}>
                      {round.type}
                    </div>
                    {date && (
                      <span className="mt-1 text-[11px] text-ink-3 text-center">{date}</span>
                    )}
                  </div>
                  {canEdit && isLast && editingId !== round.id && (
                    <div className="ml-1.5 flex items-center gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => { setEditingId(round.id); setIsAdding(false); }}
                        className={`${BTN_SMALL} border-border-base text-ink-3 hover:bg-surface-2`}
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className={`${BTN_SMALL} border-[color-mix(in_oklch,var(--st-rejected)_30%,transparent)] text-[var(--st-rejected)] hover:bg-[color-mix(in_oklch,var(--st-rejected)_8%,var(--surface))]`}
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {!isLast && (
                    <div
                      className="flex-1 h-[2px] mx-1.5 mt-[14px] rounded-full transition-all"
                      style={{ background: connectorDone ? "var(--st-offer)" : "var(--border)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: vertical timeline, newest at top */}
          <div className="hidden mobile:flex mobile:flex-col mobile:items-start">
            {reversedRounds.map((round, i) => {
              const isLast = i === reversedRounds.length - 1;
              const outcome = effectiveOutcome(round);
              const { className: pillClass, style: pStyle } = pillProps(outcome);
              const date = formatDate(round.scheduled_at);
              const olderRound = reversedRounds[i + 1];
              const connectorDone = olderRound ? effectiveOutcome(olderRound) === "passed" : false;

              return (
                <div key={round.id} className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5">
                    <div className={pillClass} style={pStyle} title={round.type}>
                      {round.type}
                    </div>
                    {canEdit && round.id === latestRound?.id && editingId !== round.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditingId(round.id); setIsAdding(false); }}
                          className={`${BTN_SMALL} border-border-base text-ink-3 hover:bg-surface-2`}
                          disabled={isPending}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className={`${BTN_SMALL} border-[color-mix(in_oklch,var(--st-rejected)_30%,transparent)] text-[var(--st-rejected)] hover:bg-[color-mix(in_oklch,var(--st-rejected)_8%,var(--surface))]`}
                          disabled={isPending}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  {date && (
                    <span className="mt-0.5 text-[11px] text-ink-3">{date}</span>
                  )}
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

          {/* Bottom section: edit form, notes, and outcome buttons */}
          {latestRound && canEdit && (editingId === latestRound.id || latestRound.notes || optimisticOutcome === "pending") && (
            <div className="mt-4 pt-4 border-t border-border-base">
              {editingId === latestRound.id ? (
                <RoundForm
                  round={latestRound}
                  existingRoundTypes={existingRoundTypes}
                  action={boundUpdate}
                  onCancel={() => setEditingId(null)}
                  onSuccess={() => setEditingId(null)}
                />
              ) : (
                <>
                  {latestRound.notes && (
                    <p className="mb-3 text-sm text-ink-2 line-clamp-3">{latestRound.notes}</p>
                  )}
                  {optimisticOutcome === "pending" && (
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 text-[13px] text-ink-2 whitespace-nowrap">Set outcome:</span>
                      {OUTCOMES.filter((o) => o.value !== "pending").map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => handleSetOutcome(o.value)}
                          disabled={isPending}
                          className="cursor-pointer rounded-xl border border-border-base bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
