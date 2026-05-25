import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/env";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { resetPasswordAction } from "./actions";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { code } = await searchParams;

  if (!code) {
    redirect(`${ROUTES.login}?error=auth`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`${ROUTES.login}?error=auth`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 mobile:items-start mobile:pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900 mobile:h-14 mobile:w-14">
            <span className="text-xl font-bold text-white mobile:text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mobile:text-3xl">Set new password</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 mobile:text-base">
            Choose a strong password for your account
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm mobile:p-5">
          <ResetPasswordForm action={resetPasswordAction} />
        </div>
      </div>
    </div>
  );
}
