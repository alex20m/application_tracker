"use client";

import { useActionState, useState } from "react";

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

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [authMode, setAuthMode] = useState<"password" | "magic">("password");
  const [authIntent, setAuthIntent] = useState<"signin" | "signup">("signin");

  const primaryLabel =
    authMode === "magic"
      ? "Send Magic Link"
      : authIntent === "signup"
        ? "Create Account"
        : "Sign In";

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.message && (
        <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      {authMode === "password" && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      )}

      <input type="hidden" name="authMode" value={authMode} />
      <input type="hidden" name="authIntent" value={authIntent} />

      <button
        type="submit"
        disabled={isPending}
        className="w-full cursor-pointer rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Loading…" : primaryLabel}
      </button>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAuthMode(authMode === "password" ? "magic" : "password")}
          className="cursor-pointer text-xs text-gray-400 transition hover:text-gray-700"
        >
          Use {authMode === "password" ? "magic link" : "password"}
        </button>
        <button
          type="button"
          onClick={() => setAuthIntent(authIntent === "signin" ? "signup" : "signin")}
          className="cursor-pointer text-xs text-gray-400 transition hover:text-gray-700"
        >
          {authIntent === "signin" ? "Create account" : "Sign in instead"}
        </button>
      </div>
    </form>
  );
}
