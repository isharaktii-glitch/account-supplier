import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { 
  updateBulkRates, 
  approveWorkerPayment, 
  approveBuyerAccount 
} from "@/app/actions/adminActions";

export default async function AdminDashboard() {
  const pendingBuyers = await prisma.user.findMany({ 
    where: { 
      role: "BUYER", 
      isApproved: false 
    } 
  });

  const paymentRequests = await prisma.paymentRequest.findMany({ 
    include: { 
      worker: true 
    } 
  });

  const workersCount = await prisma.user.count({ 
    where: { role: "WORKER" } 
  });

  const accountsCount = await prisma.accountItem.count();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              System Admin Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Secret Control Panel - Restricted Access Only
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Workers</p>
              <p className="text-lg font-black text-cyan-400">{workersCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Submitted Accounts</p>
              <p className="text-lg font-black text-purple-400">{accountsCount}</p>
            </div>
          </div>
        </div>

        {/* Pending Buyer Approval Applications */}
        <div className="rounded-2xl p-6 bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-indigo-300">
              Pending Buyer Applications ({pendingBuyers.length})
            </h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-semibold">
              Needs Approval
            </span>
          </div>

          {pendingBuyers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No pending buyer registration requests at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBuyers.map((b) => (
                <div key={b.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Buyer Name</p>
                      <p className="font-bold text-slate-100 text-sm">{b.fullName}</p>
                    </div>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
                      {b.userCode}
                    </span>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Email Address</p>
                    <p className="font-mono text-cyan-400 break-all">{b.username}</p>
                  </div>

                  <form action={async () => { 
                    "use server"; 
                    await approveBuyerAccount(b.id); 
                  }}>
                    <button type="submit" className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-bold text-white rounded-lg transition-all shadow-md text-xs">
                      Approve Buyer Access
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker Bulk Rates Adjuster */}
        <div className="rounded-2xl p-6 bg-purple-950/20 border border-purple-500/30 backdrop-blur-md">
          <h2 className="text-lg font-bold text-purple-300 mb-2">Global Rates & Commission Control</h2>
          <p className="text-xs text-slate-400 mb-4">Update default earnings rate per task and referral commission for all active workers.</p>
          
          <form action={async (formData: FormData) => {
            "use server";
            const rate = parseFloat(formData.get("ratePerTask") as string);
            const comm = parseFloat(formData.get("refCommission") as string);
            if (!isNaN(rate) && !isNaN(comm)) {
              await updateBulkRates(rate, comm);
            }
          }} className="flex flex-col sm:flex-row gap-4 text-xs">
            <div className="flex-1">
              <label className="block text-slate-400 mb-1 font-bold">Rate Per Task ($)</label>
              <input 
                type="number" 
                step="0.01" 
                name="ratePerTask" 
                placeholder="e.g. 1.00" 
                required 
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-slate-100 focus:outline-none focus:border-purple-500" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-slate-400 mb-1 font-bold">Referral Commission ($ or %)</label>
              <input 
                type="number" 
                step="0.01" 
                name="refCommission" 
                placeholder="e.g. 0.10" 
                required 
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-slate-100 focus:outline-none focus:border-purple-500" 
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl transition-all shadow-lg">
                Apply Rates To All
              </button>
            </div>
          </form>
        </div>

        {/* Payment Proof Verification Desk */}
        <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Payment Proof Verification Desk</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-950 text-slate-300 uppercase font-mono">
                <tr>
                  <th className="p-3">Worker Code</th>
                  <th className="p-3">Requested Amount</th>
                  <th className="p-3">Payment Slip</th>
                  <th className="p-3 text-right">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paymentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 italic">No payment requests submitted yet.</td>
                  </tr>
                ) : (
                  paymentRequests.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-950/50">
                      <td className="p-3 font-bold text-cyan-400 font-mono">{pay.worker.userCode}</td>
                      <td className="p-3 font-bold text-emerald-400">${pay.amount.toFixed(2)}</td>
                      <td className="p-3">
                        {pay.buyerSlipUrl ? (
                          <a href={pay.buyerSlipUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold">
                            <span>📄</span> View Slip Link
                          </a>
                        ) : (
                          <span className="text-slate-600 italic">No slip uploaded</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {pay.status === "BUYER_PAID" ? (
                          <form action={async () => { 
                            "use server"; 
                            await approveWorkerPayment(pay.id); 
                          }} className="inline-block">
                            <button type="submit" className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold rounded-lg border border-emerald-500/40 transition-all">
                              Approve Payout
                            </button>
                          </form>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            pay.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            {pay.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
