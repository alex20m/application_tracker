"use client";

import { useActionState } from "react";
import Link from "next/link";

import { BTN_GHOST, BTN_PRIMARY, ERROR_BANNER, FORM_STACK, INPUT, LABEL } from "@/lib/ui";
import { ROUTES } from "@/lib/env";
import type { ApplicationRecord } from "@/lib/types";

type WishlistFormProps = {
  application?: ApplicationRecord;
  action: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  returnPath?: string;
};

export function WishlistForm({ application, action, returnPath = ROUTES.wishlist }: WishlistFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });

  return (
    <form action={formAction} className={FORM_STACK}>
      {application && (
        <input type="hidden" name="application_id" value={application.id} />
      )}

      {state.error && <div className={ERROR_BANNER}>{state.error}</div>}

      <div className="grid gap-5 mobile:gap-4 grid-cols-2 mobile:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="company" className={LABEL}>Company <span className="text-red-500">*</span></label>
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
          <label htmlFor="role" className={LABEL}>Role <span className="text-red-500">*</span></label>
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
          <label htmlFor="location" className={LABEL}>Location <span className="text-red-500">*</span></label>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL}>Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={application?.notes || ""}
          className={INPUT}
          rows={4}
          placeholder="Why this role? Any notes or contacts…"
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Link href={returnPath} className={BTN_GHOST}>Cancel</Link>
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? "Saving…" : application ? "Save" : "Add to Wishlist"}
        </button>
      </div>
    </form>
  );
}
