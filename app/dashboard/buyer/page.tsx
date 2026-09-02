import { requireRole } from "@/lib/authGuard";
import { getAvailableAccounts, getBuyerPaymentHistory } from "@/app/actions/buyerActions";
import { Role } from "@prisma/client";
import BuyerPanelClient from "./BuyerPanelClient";

export default async function BuyerDashboardPage() {
  await requireRole(Role.BUYER);

  const [accounts, payments] = await Promise.all([
    getAvailableAccounts(),
    getBuyerPaymentHistory()
  ]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="badge-approved mb-2 inline-flex">Approved Buyer</div>
          <h1 className="text-3xl font-bold text-white">Buyer Portal</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse available accounts and manage your payment requests.
          </p>
        </div>

        <BuyerPanelClient
          initialAccounts={JSON.parse(JSON.stringify(accounts))}
          initialPayments={JSON.parse(JSON.stringify(payments))}
        />
      </div>
    </div>
  );
}
