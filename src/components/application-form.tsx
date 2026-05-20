"use client";

import { useActionState } from "react";

import { APPLICATION_STATUSES } from "@/lib/statuses";
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

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-rose-500 bg-rose-50 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Company
        </label>
        <input
          type="text"
          name="company"
          required
          defaultValue={application?.company}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g., Acme Corp"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Role
        </label>
        <input
          type="text"
          name="role"
          required
          defaultValue={application?.role}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g., Senior Engineer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Source
        </label>
        <input
          type="text"
          name="source"
          defaultValue={application?.source || ""}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g., LinkedIn, Referral"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Applied On
        </label>
        <input
          type="date"
          name="applied_on"
          defaultValue={
            application?.applied_on?.split("T")[0] || ""
          }
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          name="status"
          required
          defaultValue={application?.status || "applied"}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          name="notes"
          defaultValue={application?.notes || ""}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={3}
          placeholder="Add any additional notes..."
        />
      </div>

      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
        {isPending ? "Saving..." : "Save Application"}
      </button>
    </form>
  );
}
