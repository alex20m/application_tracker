import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sync your job applications across devices
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <LoginForm action={loginAction} />
        </div>

        <p className="text-center text-xs text-slate-700">
          Sign up or sign in with email/password or magic link.
        </p>
      </div>
    </div>
  );
}
