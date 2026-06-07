import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeSelector } from "@/components/theme-selector";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_H2 } from "@/lib/ui";
import { InstallAppButton } from "@/components/install-app-button";
import { changePasswordAction, deleteAccountAction } from "./actions";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-[580px] mx-auto ${SECTION_STACK}`}>
        <div>
          <h1 className={TEXT_H1}>Settings</h1>
        </div>

        <div className={CARD}>
          <h2 className={`${TEXT_H2} mb-4`}>Appearance</h2>
          <ThemeSelector />
        </div>

        <InstallAppButton variant="card" />

        {user.email && (
          <div className={CARD}>
            <h2 className={`${TEXT_H2} mb-4`}>Change Password</h2>
            <ChangePasswordForm action={changePasswordAction} />
          </div>
        )}

        {user.email && (
          <div
            className="rounded-2xl border p-[22px] shadow-sm mobile:p-4"
            style={{
              borderColor: "color-mix(in oklch, var(--st-rejected) 40%, var(--border))",
              background: "color-mix(in oklch, var(--st-rejected) 6%, var(--surface))",
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.015em] mb-1" style={{ color: "oklch(0.50 0.18 25)" }}>
                  Danger Zone
                </h2>
                <p className="text-[13px] text-ink-2 max-w-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="flex-shrink-0">
                <DeleteAccountForm action={deleteAccountAction} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
