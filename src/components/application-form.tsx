"use client";

import { useActionState } from "react";

import { STATUS_LABELS, NEXT_STATUSES } from "@/lib/statuses";
import type { ApplicationRecord } from "@/lib/types";

type ApplicationFormProps = {
  application?: ApplicationRecord;
  action: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
};

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

export function ApplicationForm({ application, action }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company</label>
          <input
            type="text"
            name="company"
            required
            defaultValue={application?.company || ""}
            className={inputClass}
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <input
            type="text"
            name="role"
            required
            defaultValue={application?.role || ""}
            className={inputClass}
            placeholder="Senior Engineer"
          />
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            type="text"
            name="location"
            required
            defaultValue={application?.location || ""}
            className={inputClass}
            placeholder="Stockholm / Remote"
          />
        </div>

        <div>
          <label className={labelClass}>Source</label>
          <input
            type="text"
            name="source"
            defaultValue={application?.source || ""}
            className={inputClass}
            placeholder="LinkedIn, Referral…"
          />
        </div>

        <div>
          <label className={labelClass}>Applied On</label>
          <input
            type="date"
            name="applied_on"
            defaultValue={application?.applied_on?.split("T")[0] || today}
            className={inputClass}
          />
        </div>

        {application ? (
          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              required
              defaultValue={application.status}
              className={inputClass}
            >
              <option value={application.status}>
                {STATUS_LABELS[application.status]}
              </option>
              {(NEXT_STATUSES[application.status] ?? []).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="status" value="no_answer" />
        )}
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          defaultValue={application?.notes || ""}
          className={inputClass}
          rows={4}
          placeholder="Add any notes, contacts, or interview details…"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Application"}
        </button>
      </div>
    </form>
  );
}
