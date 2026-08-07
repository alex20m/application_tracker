import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 mobile:items-start mobile:pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent shadow-soft mobile:h-14 mobile:w-14">
            <span className="text-xl font-bold text-accent-ink mobile:text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink mobile:text-3xl">Reset password</h1>
          <p className="mt-1.5 text-sm text-ink-3 mobile:text-base">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="rounded-3xl border border-border-base bg-surface p-6 shadow-soft mobile:p-5">
          <ForgotPasswordForm action={forgotPasswordAction} />
        </div>
      </div>
    </div>
  );
}
