"use client";

import { useActionState } from "react";
import Link from "next/link";

import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";
import { BTN_GHOST, BTN_PRIMARY, ERROR_BANNER, FORM_STACK, INPUT, LABEL } from "@/lib/ui";
import { ROUTES } from "@/lib/env";
import type { ApplicationRecord } from "@/lib/types";

type ApplicationFormProps = {
  application?: ApplicationRecord;
  action: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
};

export function ApplicationForm({ application, action }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className={FORM_STACK}>
      {state.error && (
        <div className={ERROR_BANNER}>{state.error}</div>
      )}

      <div className="grid gap-5 mobile:gap-4 grid-cols-2 mobile:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="company" className={LABEL}>Company</label>
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
          <label htmlFor="role" className={LABEL}>Role</label>
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
          <label htmlFor="location" className={LABEL}>Location</label>
          <input
            id="location"
            type="text"
            name="location"
            required
            defaultValue={application?.location || ""}
            className={INPUT}
            placeholder="Stockholm / Remote"
          />
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
          />
        </div>

        <div className="grid grid-cols-1 gap-1.5 min-w-0">
          <label htmlFor="applied-on" className={LABEL}>Applied On</label>
          <input
            id="applied-on"
            type="date"
            name="applied_on"
            defaultValue={application?.applied_on?.split("T")[0] || today}
            className={`${INPUT} min-w-0`}
          />
        </div>

        {application ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className={LABEL}>Status</label>
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
          <input type="hidden" name="status" value={STATUS.no_answer} />
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

      <div className="flex justify-end gap-3 pt-1">
        <Link href={ROUTES.applications} className={BTN_GHOST}>Cancel</Link>
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? "Saving…" : "Save Application"}
        </button>
      </div>
    </form>
  );
}
