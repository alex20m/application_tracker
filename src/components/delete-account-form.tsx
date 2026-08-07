"use client";

import { useActionState } from "react";
import { ERROR_BANNER, INPUT_ON_GRAY, LABEL } from "@/lib/ui";

type DeleteAccountAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; error?: string }>;

type DeleteAccountFormProps = {
  action: DeleteAccountAction;
};

export function DeleteAccountForm({ action }: DeleteAccountFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        "Permanently delete your account and all your applications? This cannot be undone."
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {state.error && <div className={ERROR_BANNER}>{state.error}</div>}

      <div>
        <label htmlFor="deletePassword" className={LABEL}>
          Confirm your password
        </label>
        <input
          id="deletePassword"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-lg border border-border-base bg-surface px-4 py-2 text-sm font-medium text-ink-3 transition hover:border-red-200 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 mobile:min-h-11 mobile:text-base"
      >
        {isPending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
