"use client";

import { useState, useMemo } from "react";
import {
  STATUS,
  STATUS_NAMES,
  type ApplicationStatus,
} from "@/lib/statuses";
import {
  getReachableStatuses,
  computeAvgDaysBetweenStatuses,
} from "@/lib/analytics";
import { CARD, TEXT_H2, TEXT_META, TEXT_MUTED, INPUT, LABEL } from "@/lib/ui";
import type { ApplicationRecord } from "@/lib/types";

// Statuses that can meaningfully serve as the start of a duration measurement.
// Ghosted is excluded: it is a terminal-ish state with no meaningful forward journey to measure.
const START_STATUSES: ApplicationStatus[] = [
  STATUS.wishlist,
  STATUS.applied,
  STATUS.interviews,
  STATUS.offer,
];

type Props = {
  applications: ApplicationRecord[];
};

export function AvgStageTime({ applications }: Props) {
  const [startStatus, setStartStatus] = useState<ApplicationStatus>(STATUS.applied);
  const [endStatus, setEndStatus] = useState<ApplicationStatus>(STATUS.interviews);

  const reachable = useMemo(() => getReachableStatuses(startStatus), [startStatus]);

  // If the currently selected end is no longer reachable, fall back to first option.
  const effectiveEnd: ApplicationStatus | null =
    reachable.includes(endStatus) ? endStatus : (reachable[0] ?? null);

  const result = useMemo(
    () =>
      effectiveEnd
        ? computeAvgDaysBetweenStatuses(applications, startStatus, effectiveEnd)
        : { avg: null, count: 0, min: null, max: null },
    [applications, startStatus, effectiveEnd]
  );

  function handleStartChange(next: ApplicationStatus) {
    setStartStatus(next);
    const nextReachable = getReachableStatuses(next);
    if (!nextReachable.includes(endStatus)) {
      setEndStatus(nextReachable[0] ?? endStatus);
    }
  }

  return (
    <div className={CARD}>
      <h2 className={`${TEXT_H2} mb-5`}>Stage Duration</h2>

      {/* Selectors + visual path */}
      <div className="flex flex-col gap-5">
        {/* Status selectors row */}
        <div className="flex items-end gap-3 flex-wrap mobile:flex-col mobile:items-stretch">
          {/* From */}
          <div className="flex-1 min-w-32">
            <label className={`${LABEL} mb-1.5`}>From</label>
            <select
              value={startStatus}
              onChange={(e) => handleStartChange(e.target.value as ApplicationStatus)}
              className={INPUT}
            >
              {START_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_NAMES[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow — decorative */}
          <div className="pb-2 text-ink-3 text-lg select-none mobile:hidden">
            →
          </div>

          {/* To */}
          <div className="flex-1 min-w-32">
            <label className={`${LABEL} mb-1.5`}>To</label>
            <select
              value={effectiveEnd ?? ""}
              onChange={(e) => setEndStatus(e.target.value as ApplicationStatus)}
              disabled={reachable.length === 0}
              className={INPUT}
            >
              {reachable.map((s) => (
                <option key={s} value={s}>
                  {STATUS_NAMES[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result display */}
        <div className="rounded-xl bg-surface-2/50 border border-border-base/60 px-6 py-5 flex flex-col items-center gap-1">
          {result.avg !== null ? (
            <>
              {/* Main number */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-ink tabular-nums mobile:text-3xl">
                  {result.avg}
                </span>
                <span className="text-base text-ink-3 font-normal">
                  {result.avg === 1 ? "day" : "days"}
                </span>
              </div>

              {/* Sub-label */}
              <p className={`${TEXT_META} mt-0.5`}>
                average across {result.count} application{result.count !== 1 ? "s" : ""}
              </p>

              {/* Range — only show when min ≠ max */}
              {result.min !== null &&
                result.max !== null &&
                result.min !== result.max && (
                  <p className={`${TEXT_MUTED} mt-1`}>
                    fastest&nbsp;{result.min}d &nbsp;·&nbsp; slowest&nbsp;{result.max}d
                  </p>
                )}
            </>
          ) : (
            <p className={`${TEXT_MUTED} py-2`}>
              No data for this combination yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
