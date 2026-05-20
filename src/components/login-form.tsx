"use client";

import { useActionState, useState } from "react";

type LoginAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{
  success?: boolean;
  error?: string;
}>;

type LoginFormProps = {
  action: LoginAction;
};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [authMode, setAuthMode] = useState<"password" | "magic">("password");

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-rose-500 bg-rose-50 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </div>

      {authMode === "password" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="••••••"
          />
        </div>
      )}

      <input type="hidden" name="authMode" value={authMode} />

      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 w-full">
        {isPending
          ? "Loading..."
          : authMode === "password"
            ? "Sign In"
            : "Send Magic Link"}
      </button>

      <button
        type="button"
        onClick={() =>
          setAuthMode(authMode === "password" ? "magic" : "password")
        }
        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 w-full"
      >
        Use {authMode === "password" ? "Magic Link" : "Password"}
      </button>
    </form>
  );
}
