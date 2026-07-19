import { LoginForm } from "@/components/login-form";
import { loginAction, verifyOtpAction } from "./actions";
import { SUCCESS_BANNER, ERROR_BANNER } from "@/lib/ui";

type Props = {
  searchParams: Promise<{ reset?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { reset, error } = await searchParams;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Left aside: brand panel ────────────────────────── */}
      <aside
        className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10"
        style={{
          background: "linear-gradient(160deg, oklch(0.45 0.095 188) 0%, oklch(0.32 0.08 220) 100%)",
        }}
      >
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="oklch(0.55 0.085 188)" />
            <rect x="0" y="0" width="32" height="14" rx="8" fill="white" fillOpacity="0.07" />
            <path d="M7 23 C12 23 12 15 16 15 C20 15 20 9 25 9" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.8" />
            <circle cx="7" cy="23" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
            <circle cx="16" cy="15" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <circle cx="16" cy="15" r="1.1" fill="white" fillOpacity="0.65" />
            <circle cx="25" cy="9" r="3.5" fill="white" />
            <circle cx="25" cy="9" r="1.7" fill="oklch(0.55 0.085 188)" />
          </svg>
          <span className="text-white font-bold text-[17px] tracking-[-0.02em]">AppTrack</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-white text-[28px] font-bold leading-[1.2] tracking-[-0.03em] mb-4">
            Run your job search like a pipeline.
          </h1>
          <p className="text-white/75 text-[14.5px] leading-relaxed mb-8">
            Track every application, spot what&apos;s working, and stay on top of what needs attention — all in one calm, focused view.
          </p>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { value: "100%", label: "Free to use" },
              { value: "∞", label: "Applications" },
              { value: "0", label: "Distractions" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-white text-[22px] font-semibold" style={{ fontFeatureSettings: '"tnum"' }}>
                  {stat.value}
                </p>
                <p className="text-white/60 text-[12px] font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-[12px]">© {new Date().getFullYear()} AppTrack</p>
      </aside>

      {/* ── Right: form card ───────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 mobile:items-start mobile:pt-10">
        <div className="w-full max-w-[380px]">
          {/* Mobile brand (shown when aside is hidden) */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <rect className="logo-fill" width="32" height="32" rx="8" fill="oklch(0.55 0.085 188)" />
              <rect x="0" y="0" width="32" height="14" rx="8" fill="white" fillOpacity="0.07" />
              <path d="M7 23 C12 23 12 15 16 15 C20 15 20 9 25 9" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.8" />
              <circle className="logo-fill" cx="7" cy="23" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
              <circle className="logo-fill" cx="16" cy="15" r="2.5" fill="oklch(0.55 0.085 188)" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
              <circle cx="16" cy="15" r="1.1" fill="white" fillOpacity="0.65" />
              <circle cx="25" cy="9" r="3.5" fill="white" />
              <circle className="logo-fill" cx="25" cy="9" r="1.7" fill="oklch(0.55 0.085 188)" />
            </svg>
            <span className="font-bold text-[17px] tracking-[-0.02em] text-ink">AppTrack</span>
          </div>

          <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink mb-1.5">Sign in</h2>
          <p className="text-[13.5px] text-ink-2 mb-7">Welcome back. Track where you left off.</p>

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

          <div className="rounded-2xl border border-border-base bg-surface p-6 shadow-sm">
            <LoginForm action={loginAction} verifyAction={verifyOtpAction} />
          </div>
        </div>
      </main>
    </div>
  );
}
