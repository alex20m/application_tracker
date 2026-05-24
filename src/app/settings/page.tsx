import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeSelector } from "@/components/theme-selector";
import { CARD, SECTION_STACK, TEXT_H1, TEXT_H3 } from "@/lib/ui";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className={`max-w-lg ${SECTION_STACK}`}>
        <div>
          <h1 className={TEXT_H1}>Settings</h1>
        </div>

        <div className={CARD}>
          <h2 className={`${TEXT_H3} mb-4`}>Appearance</h2>
          <ThemeSelector />
        </div>
      </div>
    </AppShell>
  );
}
