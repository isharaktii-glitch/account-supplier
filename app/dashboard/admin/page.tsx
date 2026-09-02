import { requireRole } from "@/lib/authGuard";
import { getAdminDashboardData } from "@/app/actions/adminActions";
import { Role } from "@prisma/client";
import AdminPanelClient from "./AdminPanelClient";

export default async function AdminDashboardPage() {
  await requireRole(Role.ADMIN);
  const data = await getAdminDashboardData();

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="badge-approved mb-2 inline-flex">Super Admin</div>
          <h1 className="text-3xl font-bold text-white">Control Panel</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage buyers, workers, rates, and payment approvals.
          </p>
        </div>

        <AdminPanelClient initialData={JSON.parse(JSON.stringify(data))} />
      </div>
    </div>
  );
}
