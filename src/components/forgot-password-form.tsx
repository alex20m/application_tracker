"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL, SUCCESS_BANNER } from "@/lib/ui";

type ForgotPasswordAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; error?: string; message?: string }>;

type ForgotPasswordFormProps = {
  action: ForgotPasswordAction;
};

export function ForgotPasswordForm({ action }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <div className={ERROR_BANNER}>{state.error}</div>}
      {state.message && <div className={SUCCESS_BANNER}>{state.message}</div>}

      <div>
        <label htmlFor="email" className={LABEL}>Email</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className={INPUT_ON_GRAY}
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !!state.message}
        className={`w-full py-2.5 ${BTN_PRIMARY}`}
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>

      <div className="pt-1 text-center">
        <Link
          href="/login"
          className="text-xs text-gray-500 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
