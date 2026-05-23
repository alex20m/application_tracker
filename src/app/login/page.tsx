import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 mobile:items-start mobile:pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mobile:h-14 mobile:w-14">
            <span className="text-xl font-bold text-white mobile:text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mobile:text-3xl">AppTrack</h1>
          <p className="mt-1.5 text-sm text-gray-500 mobile:text-base">
            Track your job applications in one place
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mobile:p-5">
          <LoginForm action={loginAction} />
        </div>
      </div>
    </div>
  );
}
