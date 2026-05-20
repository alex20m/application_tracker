import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function DashboardPage() {
  const { user } = await requireUser();

  return (
    <AppShell email={user.email || ""}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Welcome!</h2>
          <p className="mt-2 text-sm text-slate-600">
            Track your job applications and visualize your workflow.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• <strong>Applications:</strong> Manage all your job applications in one place</li>
            <li>• <strong>Sankey:</strong> Visualize your application flow and status transitions</li>
            <li>• <strong>Sync:</strong> Your data syncs across iPhone and desktop in real-time</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
