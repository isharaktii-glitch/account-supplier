import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { updateBulkRates, approveWorkerPayment } from "@/app/actions/adminActions";

export default async function AdminDashboard() {
  const workers = await prisma.user.findMany({ where: { role: "WORKER" } });
  const paymentRequests = await prisma.paymentRequest.findMany({ include: { worker: true } });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-3xl font-black text-purple-400">System Admin Control Center</h1>

        <div className="rounded-2xl p-6 bg-purple-950/20 border border-purple-500/30">
          <h2 className="text-lg font-bold text-purple-300 mb-4">Bulk Rates Adjuster</h2>
          <form action={async (formData: FormData) => {
            "use server";
            const rate = parseFloat(formData.get("ratePerTask") as string);
            const comm = parseFloat(formData.get("refCommission") as string);
            if (!isNaN(rate) && !isNaN(comm)) await updateBulkRates(rate, comm);
          }} className="flex gap-4 text-xs">
            <input type="number" step="0.01" name="ratePerTask" placeholder="Task Rate ($)" required className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl" />
            <input type="number" step="0.01" name="refCommission" placeholder="Commission Rate (%)" required className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl" />
            <button type="submit" className="px-4 py-2.5 bg-purple-500 font-bold text-white rounded-xl">Apply Bulk Rates</button>
          </form>
        </div>

        <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Payment Proof Slips Approval Desk</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-950 text-slate-300 uppercase">
                <tr>
                  <th className="p-3">Worker Code</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Proof Slip</th>
                  <th className="p-3">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paymentRequests.map((pay) => (
                  <tr key={pay.id}>
                    <td className="p-3 font-bold text-cyan-400">{pay.worker.userCode}</td>
                    <td className="p-3 font-bold text-emerald-400">${pay.amount.toFixed(2)}</td>
                    <td className="p-3">
                      {pay.buyerSlipUrl ? (
                        <a href={pay.buyerSlipUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline">View Slip</a>
                      ) : "No Slip"}
                    </td>
                    <td className="p-3">
                      {pay.status === "BUYER_PAID" ? (
                        <form action={async () => { "use server"; await approveWorkerPayment(pay.id); }}>
                          <button type="submit" className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/40">Approve Payout</button>
                        </form>
                      ) : (
                        <span className="font-bold">{pay.status}</span>
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
