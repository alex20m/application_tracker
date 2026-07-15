"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL, SUCCESS_BANNER } from "@/lib/ui";
import { ROUTES } from "@/lib/env";
import { PasswordCriteria } from "./password-criteria";

type ActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  otpSent?: boolean;
};

type LoginAction = (
  prevState: unknown,
  formData: FormData
) => Promise<ActionResult>;

type VerifyAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; error?: string }>;

type LoginFormProps = {
  action: LoginAction;
  verifyAction: VerifyAction;
};

export function LoginForm({ action, verifyAction }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });
  const [verifyState, verifyFormAction, isVerifying] = useActionState(verifyAction, {
    success: false,
  });
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [authIntent, setAuthIntent] = useState<"signin" | "signup">("signin");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const otpSent = authMode === "otp" && state.otpSent === true;

  // ── Step 2 of OTP flow: enter the 6-digit code ─────────────────────
  if (otpSent) {
    return (
      <form action={verifyFormAction} className="space-y-4">
        {verifyState.error && <div className={ERROR_BANNER}>{verifyState.error}</div>}
        {!verifyState.error && state.message && (
          <div className={SUCCESS_BANNER}>{state.message}</div>
        )}

        <input type="hidden" name="email" value={email} />

        <div>
          <label htmlFor="token" className={LABEL}>6-digit code</label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className={`${INPUT_ON_GRAY} text-center tracking-[0.5em] font-mono`}
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className={`w-full py-2.5 ${BTN_PRIMARY}`}
        >
          {isVerifying ? "Verifying…" : "Verify code"}
        </button>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setPassword("");
            }}
            className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
          >
            Use a different email or password
          </button>
        </div>
      </form>
    );
  }

  const primaryLabel =
    authMode === "otp"
      ? "Send Code"
      : authIntent === "signup"
        ? "Create Account"
        : "Sign In";

  const showCriteria = authMode === "password" && authIntent === "signup";

  // ── Step 1: email + (password | request code) ─────────────────────
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {authMode === "password" && (
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className={LABEL}>Password</label>
            {authIntent === "signin" && (
              <Link
                href={ROUTES.forgotPassword}
                className="text-xs text-gray-500 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
              >
                Forgot password?
              </Link>
            )}
          </div>
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
          {showCriteria && <PasswordCriteria value={password} />}
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
          onClick={() => {
            setAuthMode(authMode === "password" ? "otp" : "password");
            setPassword("");
          }}
          className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
        >
          Use {authMode === "password" ? "email code" : "password"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthIntent(authIntent === "signin" ? "signup" : "signin");
            setPassword("");
          }}
          className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
        >
          {authIntent === "signin" ? "Create account" : "Sign in instead"}
        </button>
      </div>
    </form>
  );
}
