"use client";

import { useActionState, useState } from "react";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL } from "@/lib/ui";

type ResetPasswordAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; error?: string }>;

type ResetPasswordFormProps = {
  action: ResetPasswordAction;
};

export function ResetPasswordForm({ action }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const pw = fd.get("password") as string;
    const cpw = fd.get("confirmPassword") as string;

    if (pw.length < 8) {
      e.preventDefault();
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== cpw) {
      e.preventDefault();
      setClientError("Passwords do not match.");
      return;
    }
    setClientError(null);
  }

  const displayError = clientError ?? state.error;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {displayError && <div className={ERROR_BANNER}>{displayError}</div>}

      <div>
        <label htmlFor="password" className={LABEL}>New password</label>
        <input
          id="password"
          type="password"
          name="password"
          required
          minLength={8}
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={LABEL}>Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-2.5 ${BTN_PRIMARY}`}
      >
        {isPending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
