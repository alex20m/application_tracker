"use client";

import { useActionState } from "react";

import { STATUS, STATUS_NAMES, STATUS_NEXT } from "@/lib/statuses";
import { BTN_PRIMARY, ERROR_BANNER, INPUT, LABEL } from "@/lib/ui";
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
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className={ERROR_BANNER}>{state.error}</div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Company</label>
          <input
            type="text"
            name="company"
            required
            defaultValue={application?.company || ""}
            className={INPUT}
            placeholder="Example Corporation"
          />
        </div>

        <div>
          <label className={LABEL}>Role</label>
          <input
            type="text"
            name="role"
            required
            defaultValue={application?.role || ""}
            className={INPUT}
            placeholder="Senior Engineer"
          />
        </div>

        <div>
          <label className={LABEL}>Location</label>
          <input
            type="text"
            name="location"
            required
            defaultValue={application?.location || ""}
            className={INPUT}
            placeholder="Stockholm / Remote"
          />
        </div>

        <div>
          <label className={LABEL}>Source</label>
          <input
            type="text"
            name="source"
            defaultValue={application?.source || ""}
            className={INPUT}
            placeholder="LinkedIn, Referral…"
          />
        </div>

        <div>
          <label className={LABEL}>Applied On</label>
          <input
            type="date"
            name="applied_on"
            defaultValue={application?.applied_on?.split("T")[0] || today}
            className={INPUT}
          />
        </div>

        {application ? (
          <div>
            <label className={LABEL}>Status</label>
            <select
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

      <div>
        <label className={LABEL}>Notes</label>
        <textarea
          name="notes"
          defaultValue={application?.notes || ""}
          className={INPUT}
          rows={4}
          placeholder="Add any notes, contacts, or interview details…"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? "Saving…" : "Save Application"}
        </button>
      </div>
    </form>
  );
}
