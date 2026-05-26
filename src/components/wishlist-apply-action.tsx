"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { applyWishlistAction } from "@/app/wishlist/actions";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, ERROR_BANNER, INPUT, LABEL, TEXT_H3 } from "@/lib/ui";

type WishlistApplyActionProps = {
  applicationId: string;
};

const BTN_APPLY = `${BTN_SMALL} border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25`;

export function WishlistApplyAction({ applicationId }: WishlistApplyActionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const handleOpen = useCallback(() => {
    setError(null);
    dialogRef.current?.showModal();
    // Move focus to the confirm button so the date picker doesn't auto-open on iOS.
    requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
  };

  const handleConfirm = (formData: FormData) => {
    startTransition(async () => {
      const result = await applyWishlistAction(null, formData);
      if (result.success) {
        handleClose();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <button type="button" onClick={handleOpen} className={BTN_APPLY}>
        Apply
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm"
      >
        <h2 className={`${TEXT_H3} mb-4`}>
          Mark as Applied
        </h2>

        {error && <div className={`${ERROR_BANNER} mb-4`}>{error}</div>}

        <form action={handleConfirm} className="space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />

          <div className="grid grid-cols-1 gap-1.5 min-w-0">
            <label htmlFor={`applied-on-${applicationId}`} className={LABEL}>Applied On</label>
            <input
              id={`applied-on-${applicationId}`}
              type="date"
              name="applied_on"
              defaultValue={today}
              className={`${INPUT} min-w-0`}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className={BTN_GHOST}
            >
              Cancel
            </button>
            <button ref={confirmButtonRef} type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
