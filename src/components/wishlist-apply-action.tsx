"use client";

import { useRef, useState, useTransition } from "react";
import { applyWishlistAction } from "@/app/wishlist/actions";
import { BTN_GHOST, BTN_PRIMARY, BTN_SMALL, ERROR_BANNER, LABEL, TEXT_H3 } from "@/lib/ui";
import { DatePicker } from "@/components/date-picker";

type WishlistApplyActionProps = {
  applicationId: string;
};

const BTN_APPLY = `${BTN_SMALL} border-accent/30 bg-accent-soft text-accent-strong hover:bg-accent-soft/80`;

export function WishlistApplyAction({ applicationId }: WishlistApplyActionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
        Apply now →
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto rounded-2xl border border-border-base bg-surface p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm"
      >
        <h2 className={`${TEXT_H3} mb-4`}>
          Mark as Applied
        </h2>

        {error && <div className={`${ERROR_BANNER} mb-4`}>{error}</div>}

        <form action={handleConfirm} className="space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`applied-on-${applicationId}`} className={LABEL}>Applied On</label>
            <DatePicker
              id={`applied-on-${applicationId}`}
              name="applied_on"
              defaultValue={today}
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
