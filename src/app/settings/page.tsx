import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeSelector } from "@/components/theme-selector";
import { CARD } from "@/lib/ui";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mobile:text-2xl">
            Settings
          </h1>
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Appearance
          </h2>
          <ThemeSelector />
        </div>
      </div>
    </AppShell>
  );
}
