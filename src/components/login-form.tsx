"use client";

import { useActionState, useState } from "react";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL, SUCCESS_BANNER } from "@/lib/ui";

type LoginAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{
  success?: boolean;
  error?: string;
  message?: string;
}>;

type LoginFormProps = {
  action: LoginAction;
};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [authMode, setAuthMode] = useState<"password" | "magic">("password");
  const [authIntent, setAuthIntent] = useState<"signin" | "signup">("signin");

  const primaryLabel =
    authMode === "magic"
      ? "Send Sign-In Link"
      : authIntent === "signup"
        ? "Create Account"
        : "Sign In";

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className={ERROR_BANNER}>{state.error}</div>
      )}

      {state.message && (
        <div className={SUCCESS_BANNER}>{state.message}</div>
      )}

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

      {authMode === "password" && (
        <div>
          <label htmlFor="password" className={LABEL}>Password</label>
          <input
            id="password"
            type="password"
            name="password"
            required
            className={INPUT_ON_GRAY}
            placeholder="••••••••"
          />
        </div>
      )}

      <input type="hidden" name="authMode" value={authMode} />
      <input type="hidden" name="authIntent" value={authIntent} />

      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-2.5 ${BTN_PRIMARY}`}
      >
        {isPending ? "Loading…" : primaryLabel}
      </button>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAuthMode(authMode === "password" ? "magic" : "password")}
          className="cursor-pointer text-xs text-gray-400 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
        >
          Use {authMode === "password" ? "email sign-in link" : "password"}
        </button>
        <button
          type="button"
          onClick={() => setAuthIntent(authIntent === "signin" ? "signup" : "signin")}
          className="cursor-pointer text-xs text-gray-400 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
        >
          {authIntent === "signin" ? "Create account" : "Sign in instead"}
        </button>
      </div>
    </form>
  );
}
