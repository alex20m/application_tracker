"use client";

import { useActionState } from "react";
import Link from "next/link";

import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";
import { BTN_GHOST, BTN_PRIMARY, ERROR_BANNER, FORM_STACK, INPUT, LABEL } from "@/lib/ui";
import { DatePicker } from "@/components/date-picker";
import { ROUTES } from "@/lib/env";
import type { ApplicationRecord } from "@/lib/types";

type ApplicationFormProps = {
  application?: ApplicationRecord;
  action: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  returnPath?: string;
  existingSources?: string[];
  existingLocations?: string[];
};

export function ApplicationForm({ application, action, returnPath = ROUTES.applications, existingSources = [], existingLocations = [] }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <form action={formAction} className={FORM_STACK}>
      <input type="hidden" name="return_path" value={returnPath} />
      {state.error && (
        <div className={ERROR_BANNER}>{state.error}</div>
      )}

      <div className="grid gap-5 mobile:gap-4 grid-cols-2 mobile:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="company" className={LABEL}>Company <span className="text-[var(--st-rejected)]">*</span></label>
          <input
            id="company"
            type="text"
            name="company"
            required
            defaultValue={application?.company || ""}
            className={INPUT}
            placeholder="Example Corporation"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className={LABEL}>Role <span className="text-[var(--st-rejected)]">*</span></label>
          <input
            id="role"
            type="text"
            name="role"
            required
            defaultValue={application?.role || ""}
            className={INPUT}
            placeholder="Senior Engineer"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={LABEL}>Location <span className="text-[var(--st-rejected)]">*</span></label>
          <input
            id="location"
            type="text"
            name="location"
            required
            defaultValue={application?.location || ""}
            className={INPUT}
            placeholder="Stockholm / Remote"
            list={existingLocations.length > 0 ? "location-suggestions" : undefined}
            autoComplete="off"
          />
          {existingLocations.length > 0 && (
            <datalist id="location-suggestions">
              {existingLocations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="source" className={LABEL}>Source</label>
          <input
            id="source"
            type="text"
            name="source"
            defaultValue={application?.source || ""}
            className={INPUT}
            placeholder="LinkedIn, Referral…"
            list={existingSources.length > 0 ? "source-suggestions" : undefined}
            autoComplete="off"
          />
          {existingSources.length > 0 && (
            <datalist id="source-suggestions">
              {existingSources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="applied-on" className={LABEL}>Applied On <span className="text-[var(--st-rejected)]">*</span></label>
          <DatePicker
            id="applied-on"
            name="applied_on"
            required
            defaultValue={application?.applied_on?.split("T")[0] || today}
          />
        </div>

        {application ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className={LABEL}>Status <span className="text-[var(--st-rejected)]">*</span></label>
            <select
              id="status"
              name="status"
              required
              defaultValue={application.status}
              className={INPUT}
            >
              <option value={application.status}>
                {STATUS_NAMES[application.status]}
              </option>
              {(STATUS_NEXT[application.status] ?? []).map((status) => (
                <option key={status} value={status}>
                  {STATUS_NAMES[status]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="status" value={STATUS.applied} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL}>Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={application?.notes || ""}
          className={INPUT}
          rows={4}
          placeholder="Add any notes, contacts, or interview details…"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link href={returnPath} className={BTN_GHOST}>Cancel</Link>
        <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} whitespace-nowrap`}>
          {isPending ? (application ? "Saving…" : "Adding…") : (application ? "Save" : "Add")}
        </button>
      </div>
    </form>
  );
}
