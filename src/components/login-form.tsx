"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { BTN_PRIMARY, ERROR_BANNER, INPUT_ON_GRAY, LABEL, SUCCESS_BANNER } from "@/lib/ui";
import { ROUTES } from "@/lib/env";
import { PasswordCriteria } from "./password-criteria";
import { OtpInput } from "./otp-input";

const OTP_LENGTH = 6;

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
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [authIntent, setAuthIntent] = useState<"signin" | "signup">("signin");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState(0);
  const verifyFormRef = useRef<HTMLFormElement>(null);

  // A rejected code gets retyped from the email, not repaired digit by digit,
  // so wipe it on failure and hand focus back. Bumping `attempt` remounts the
  // field, which is what clears the digits it holds internally.
  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const result = await verifyAction(prevState, formData);
      if (result?.error) {
        setCode("");
        setAttempt((n) => n + 1);
      }
      return result;
    },
    { success: false }
  );

  const otpSent = authMode === "otp" && state.otpSent === true;

  // ── Step 2 of OTP flow: enter the 6-digit code ─────────────────────
  if (otpSent) {
    return (
      <form ref={verifyFormRef} action={verifyFormAction} className="space-y-5">
        {verifyState.error && <div className={ERROR_BANNER}>{verifyState.error}</div>}
        {!verifyState.error && state.message && (
          <div className={SUCCESS_BANNER}>{state.message}</div>
        )}

        <input type="hidden" name="email" value={email} />

        <div className="space-y-2.5">
          <label htmlFor="token" className={LABEL}>6-digit code</label>
          <OtpInput
            key={attempt}
            id="token"
            name="token"
            length={OTP_LENGTH}
            autoFocus
            disabled={isVerifying}
            // Red until the first digit of the replacement code lands, so the
            // field stops shouting once the user is acting on the message.
            invalid={Boolean(verifyState.error) && code === ""}
            onChange={setCode}
            // The code is the whole form — asking for a second click to submit
            // it is friction, so the last digit sends it.
            onComplete={() => verifyFormRef.current?.requestSubmit()}
          />
          <p className="text-xs text-ink-3">
            Sent to <span className="font-medium text-ink-2">{email}</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={isVerifying || code.length < OTP_LENGTH}
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
              setCode("");
            }}
            className="cursor-pointer text-xs text-ink-3 transition hover:text-ink-2"
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
                className="text-xs text-ink-3 transition hover:text-ink-2"
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
          className="cursor-pointer text-xs text-ink-3 transition hover:text-ink-2"
        >
          Use {authMode === "password" ? "email code" : "password"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthIntent(authIntent === "signin" ? "signup" : "signin");
            setPassword("");
          }}
          className="cursor-pointer text-xs text-ink-3 transition hover:text-ink-2"
        >
          {authIntent === "signin" ? "Create account" : "Sign in instead"}
        </button>
      </div>
    </form>
  );
}
