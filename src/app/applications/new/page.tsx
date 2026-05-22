import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/env";
import { CARD } from "@/lib/ui";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { createApplicationAction } from "@/app/applications/actions";

export default async function NewApplicationPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href={ROUTES.applications} className="text-gray-400 transition hover:text-gray-700">
            Applications
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700">New</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Application</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Track a new job application
          </p>
        </div>

        <div className={`max-w-2xl ${CARD}`}>
          <ApplicationForm action={createApplicationAction} />
        </div>
      </div>
    </AppShell>
  );
}
