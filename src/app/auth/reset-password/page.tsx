import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/env";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${ROUTES.login}?error=auth`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 mobile:items-start mobile:pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent shadow-soft mobile:h-14 mobile:w-14">
            <span className="text-xl font-bold text-accent-ink mobile:text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink mobile:text-3xl">Set new password</h1>
          <p className="mt-1.5 text-sm text-ink-3 mobile:text-base">
            Choose a strong password for your account
          </p>
        </div>

        <div className="rounded-3xl border border-border-base bg-surface p-6 shadow-soft mobile:p-5">
          <ResetPasswordForm action={resetPasswordAction} />
        </div>
      </div>
    </div>
  );
}
