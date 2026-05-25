"use client";

import { useActionState, useState } from "react";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL } from "@/lib/ui";
import { PasswordSchema } from "@/lib/schemas";
import { PasswordCriteria } from "./password-criteria";

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
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const pw = fd.get("password") as string;
    const cpw = fd.get("confirmPassword") as string;

    const parsed = PasswordSchema.safeParse(pw);
    if (!parsed.success) {
      e.preventDefault();
      setClientError(parsed.error.issues[0]?.message ?? "Invalid password.");
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
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordCriteria value={password} />
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
