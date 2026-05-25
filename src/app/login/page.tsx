import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";
import { SUCCESS_BANNER, ERROR_BANNER } from "@/lib/ui";

type Props = {
  searchParams: Promise<{ reset?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { reset, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 mobile:items-start mobile:pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900 mobile:h-14 mobile:w-14">
            <span className="text-xl font-bold text-white mobile:text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mobile:text-3xl">AppTrack</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 mobile:text-base">
            Track your job applications in one place
          </p>
        </div>

        {reset === "ok" && (
          <div className={`mb-4 ${SUCCESS_BANNER}`}>
            Password updated. Sign in with your new password.
          </div>
        )}
        {error === "auth" && (
          <div className={`mb-4 ${ERROR_BANNER}`}>
            This link is invalid or has expired. Please try again.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm mobile:p-5">
          <LoginForm action={loginAction} />
        </div>
      </div>
    </div>
  );
}
