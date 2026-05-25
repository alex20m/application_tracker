"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL, SUCCESS_BANNER } from "@/lib/ui";
import { PasswordSchema } from "@/lib/schemas";
import { PasswordCriteria } from "./password-criteria";

type ChangePasswordAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; error?: string; message?: string }>;

type ChangePasswordFormProps = {
  action: ChangePasswordAction;
};

export function ChangePasswordForm({ action }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });
  const [clientError, setClientError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const newPw = fd.get("newPassword") as string;
    const confirmPw = fd.get("confirmPassword") as string;

    const parsed = PasswordSchema.safeParse(newPw);
    if (!parsed.success) {
      e.preventDefault();
      setClientError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }
    if (newPw !== confirmPw) {
      e.preventDefault();
      setClientError("Passwords do not match.");
      return;
    }
    setClientError(null);
  }

  const displayError = clientError ?? state.error;

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} onReset={() => setNewPassword("")} className="space-y-4">
      {displayError && <div className={ERROR_BANNER}>{displayError}</div>}
      {state.message && <div className={SUCCESS_BANNER}>{state.message}</div>}

      <div>
        <label htmlFor="currentPassword" className={LABEL}>Current password</label>
        <input
          id="currentPassword"
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className={LABEL}>New password</label>
        <input
          id="newPassword"
          type="password"
          name="newPassword"
          required
          autoComplete="new-password"
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordCriteria value={newPassword} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={LABEL}>Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          autoComplete="new-password"
          className={INPUT_ON_GRAY}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`py-2 ${BTN_PRIMARY}`}
      >
        {isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
