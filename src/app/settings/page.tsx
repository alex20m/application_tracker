import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeSelector } from "@/components/theme-selector";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_H3 } from "@/lib/ui";
import { changePasswordAction, deleteAccountAction } from "./actions";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-lg mx-auto ${SECTION_STACK}`}>
        <div>
          <h1 className={TEXT_H1}>Settings</h1>
        </div>

        <div className={CARD}>
          <h2 className={`${TEXT_H3} mb-4`}>Appearance</h2>
          <ThemeSelector />
        </div>

        {user.email && (
          <div className={CARD}>
            <h2 className={`${TEXT_H3} mb-4`}>Change Password</h2>
            <ChangePasswordForm action={changePasswordAction} />
          </div>
        )}

        {user.email && (
          <div className={CARD}>
            <h2 className={`${TEXT_H3} mb-4`}>Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <DeleteAccountForm action={deleteAccountAction} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
