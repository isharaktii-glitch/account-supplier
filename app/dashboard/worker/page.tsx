import { requireRole } from "@/lib/authGuard";
import { getWorkerDashboardData } from "@/app/actions/workerActions";
import { Role } from "@prisma/client";
import WorkerPanelClient from "./WorkerPanelClient";
import Navbar from "@/components/Navbar";

export default async function WorkerDashboardPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await requireRole(Role.WORKER);
  const data = await getWorkerDashboardData();

  const justSubmitted = searchParams?.submitted === "true";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          {data.isSystemPaused && (
            <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-200">
              ⚠️ The system is currently paused by the admin. Account submissions are temporarily disabled.
            </div>
          )}

          <div className="mb-8">
            <div className="badge-pending mb-2 inline-flex bg-galaxy-accent2/15 text-galaxy-accent2 border-galaxy-accent2/30">
              Worker ID: {data.worker?.displayId}
            </div>
            <h1 className="text-3xl font-bold text-white">Worker Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Submit accounts, invite referrals, and track your earnings in real time.
            </p>
          </div>

          {justSubmitted && (
            <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Your submission was received successfully.
            </div>
          )}

          <WorkerPanelClient
            initialWorker={JSON.parse(JSON.stringify(data.worker))}
            initialSubmissions={JSON.parse(JSON.stringify(data.submissions))}
            currentRate={data.currentRate}
            initialNotifications={JSON.parse(JSON.stringify(data.notifications))}
            initialUnreadCount={data.unreadCount}
            referrals={JSON.parse(JSON.stringify(data.referrals))}
            referralCommission={data.referralCommission}
            payoutProofs={JSON.parse(JSON.stringify(data.payoutProofs))}
            payoutRequests={JSON.parse(JSON.stringify(data.payoutRequests))}
            isSystemPaused={data.isSystemPaused}
          />
        </div>
      </div>
    </div>
  );
}
