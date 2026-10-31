import Link from "next/link";
import { requireRole } from "@/lib/authGuard";
import { getAdminAccountsData } from "@/app/actions/adminAccountActions";
import { Role } from "@prisma/client";
import AdminAccountsClient from "./AdminAccountsClient";
import Navbar from "@/components/Navbar";

export default async function AdminAccountsPage() {
  await requireRole(Role.ADMIN);
  const data = await getAdminAccountsData();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="badge-approved mb-2 inline-flex">Super Admin</div>
              <h1 className="text-3xl font-bold text-white">Email Accounts & Type Rates</h1>
              <p className="mt-1 text-sm text-slate-400">
                Add Gmail, Hotmail, AOL or other email accounts and set worker rates per type.
              </p>
            </div>
            <Link href="/dashboard/admin" className="btn-secondary !px-4 !py-2 text-sm">
              ← Back to Control Panel
            </Link>
          </div>

          <AdminAccountsClient data={JSON.parse(JSON.stringify(data))} />
        </div>
      </div>
    </div>
  );
}
