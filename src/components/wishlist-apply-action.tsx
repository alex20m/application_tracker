"use client";

import { useRef, useState, useTransition } from "react";
import { applyWishlistAction } from "@/app/wishlist/actions";
import { FormattedDate } from "@/lib/date";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, ERROR_BANNER, INPUT, LABEL, TEXT_H3 } from "@/lib/ui";

type WishlistApplyActionProps = {
  applicationId: string;
};

const BTN_APPLY = `${BTN_SMALL} border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25`;

export function WishlistApplyAction({ applicationId }: WishlistApplyActionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`applied-on-${applicationId}`} className={LABEL}>Applied On</label>
            {/* Button triggers showPicker() on the hidden input — avoids auto-focus
                opening the picker when the dialog first appears on mobile Chrome */}
            <button
              id={`applied-on-${applicationId}`}
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className={`${INPUT} date-picker-btn text-left cursor-pointer`}
            >
              <FormattedDate dateString={selectedDate} />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              name="applied_on"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              aria-hidden="true"
              tabIndex={-1}
              className="sr-only"
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
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
