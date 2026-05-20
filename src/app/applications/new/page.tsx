import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { createApplicationAction } from "@/app/applications/actions";

export default async function NewApplicationPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/applications" className="text-sm text-indigo-600 hover:text-indigo-700">
            Applications
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-600">New</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Application</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create a new job application and track its progress
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl">
          <ApplicationForm action={createApplicationAction} />
        </div>
      </div>
    </AppShell>
  );
}
