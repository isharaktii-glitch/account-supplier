import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { reviewAccountByBuyer, processBuyerPayment } from "@/app/actions/buyerActions";

export default async function BuyerDashboard() {
  const pendingPayments = await prisma.paymentRequest.findMany({
    where: { status: "PENDING" },
    include: { worker: true },
  });

  const accounts = await prisma.accountItem.findMany({
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-3xl font-black text-indigo-300">Buyer Quality & Verification Portal</h1>

        {pendingPayments.length > 0 && (
          <div className="rounded-2xl p-6 bg-amber-950/80 border border-amber-500 space-y-4">
            <h2 className="text-lg font-bold text-amber-400">⚠️ URGENT: PENDING WORKER PAYOUTS ({pendingPayments.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPayments.map((pay) => (
                <div key={pay.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <p>Worker Code: <span className="font-bold text-cyan-400">{pay.worker.userCode}</span></p>
                  <p>Amount: <span className="font-bold text-emerald-400">${pay.amount.toFixed(2)}</span></p>
                  <form action={async (formData: FormData) => {
                    "use server";
                    const slipUrl = formData.get("slipUrl") as string;
                    if (slipUrl) await processBuyerPayment(pay.id, slipUrl);
                  }} className="space-y-2">
                    <input type="text" name="slipUrl" required placeholder="Paste Receipt Slip URL" className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs" />
                    <button type="submit" className="w-full py-1.5 bg-amber-500 text-black font-bold rounded-lg">Mark Paid & Submit Slip</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Accounts for Buyer Review</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-950 text-slate-300 uppercase">
                <tr>
                  <th className="p-3">Worker Code</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="p-3 font-bold text-cyan-400">{acc.worker.userCode}</td>
                    <td className="p-3">{acc.type}</td>
                    <td className="p-3 font-mono text-slate-200">{acc.username}</td>
                    <td className="p-3 font-mono">{acc.password}</td>
                    <td className="p-3">
                      {acc.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <form action={async () => { "use server"; await reviewAccountByBuyer(acc.id, "DONE"); }}>
                            <button type="submit" className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/40">DONE</button>
                          </form>
                          <form action={async (formData: FormData) => {
                            "use server";
                            const reason = formData.get("reason") as string;
                            await reviewAccountByBuyer(acc.id, "REJECTED", reason);
                          }} className="flex gap-1">
                            <input type="text" name="reason" required placeholder="Reason" className="bg-slate-950 border border-slate-700 p-1 rounded text-[10px] w-24" />
                            <button type="submit" className="px-2 py-1 bg-rose-500/20 text-rose-300 font-bold rounded-lg border border-rose-500/40">Reject</button>
                          </form>
                        </div>
                      ) : (
                        <span className="font-bold">{acc.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
