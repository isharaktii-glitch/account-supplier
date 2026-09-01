import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import {
  updateBulkRates,
  updateWorkerIndividualRate,
  updateAccountPrice,
  approveWorkerPayment,
} from "@/app/actions/adminActions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; statusFilter?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.query || "";
  const statusFilter = params.statusFilter || "ALL";

  // Workers & Registrations List
  const workers = await prisma.user.findMany({
    where: {
      role: "WORKER",
      OR: [
        { fullName: { contains: searchQuery, mode: "insensitive" } },
        { userCode: { contains: searchQuery, mode: "insensitive" } },
        { username: { contains: searchQuery, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Accounts List Filtered by Status (DONE / REJECTED / ALL)
  const accounts = await prisma.accountItem.findMany({
    where: {
      ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
      OR: [
        { username: { contains: searchQuery, mode: "insensitive" } },
        { worker: { userCode: { contains: searchQuery, mode: "insensitive" } } },
      ],
    },
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  // Buyer Payment Slips Waiting for Admin Approval
  const paymentRequests = await prisma.paymentRequest.findMany({
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Header & Global Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 bg-clip-text text-transparent">
              System Admin Control Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Global Pricing, Multi-Tier Commission Controls & Verification Desk
            </p>
          </div>

          <form method="GET" className="w-full md:w-80">
            <input
              type="text"
              name="query"
              defaultValue={searchQuery}
              placeholder="Search Users, Codes, Accounts..."
              className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl p-3 focus:border-purple-500 outline-none"
            />
          </form>
        </div>

        {/* SECTION 1: DYNAMIC BULK PRICING CONTROLS */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 shadow-[0_15px_35px_rgba(168,85,247,0.15)]">
          <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>⚙️</span> Global Bulk Rates Adjuster (All Workers)
          </h2>

          <form
            action={async (formData: FormData) => {
              "use server";
              const rate = parseFloat(formData.get("ratePerTask") as string);
              const comm = parseFloat(formData.get("refCommission") as string);
              if (!isNaN(rate) && !isNaN(comm)) await updateBulkRates(rate, comm);
            }}
            className="grid md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">TASK RATE PER GMAIL ($)</label>
              <input
                type="number"
                step="0.01"
                name="ratePerTask"
                required
                placeholder="e.g. 1.50"
                className="w-full bg-slate-950 border border-slate-700 text-sm p-3 rounded-xl outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">REFERRAL COMMISSION RATE (%)</label>
              <input
                type="number"
                step="0.01"
                name="refCommission"
                required
                placeholder="e.g. 0.10 for 10%"
                className="w-full bg-slate-950 border border-slate-700 text-sm p-3 rounded-xl outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 font-bold text-white text-sm rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition-all"
              >
                Apply Rates to All Workers
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: PAYMENT SLIP VERIFICATION DESK */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span>💳</span> Payment Approval & Verification Desk (Slips Only Visible to Admin)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Worker Code</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Buyer Proof Slip</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paymentRequests.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-bold text-cyan-400">{pay.worker.userCode}</td>
                    <td className="p-4 font-black text-emerald-400">${pay.amount.toFixed(2)}</td>
                    <td className="p-4 font-mono text-xs">
                      {pay.buyerSlipUrl ? (
                        <a
                          href={pay.buyerSlipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 underline hover:text-cyan-300"
                        >
                          🔍 View Buyer Slip
                        </a>
                      ) : (
                        <span className="text-slate-600 italic">No Slip Uploaded Yet</span>
                      )}
                    </td>
                    <td className="p-4">
                      {pay.status === "COMPLETED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          APPROVED & PAID
                        </span>
                      )}
                      {pay.status === "BUYER_PAID" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          BUYER PAID (SLIP READY)
                        </span>
                      )}
                      {pay.status === "PENDING" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          PENDING BUYER PAYMENT
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {pay.status === "BUYER_PAID" && (
                        <form
                          action={async () => {
                            "use server";
                            await approveWorkerPayment(pay.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all"
                          >
                            ✔ Approve Worker Payout
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: WORKERS LIST & INDIVIDUAL PRICING EDIT */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span>👥</span> Registered Workers & Custom Rates Management
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Worker Code</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Current Rate/Task</th>
                  <th className="p-4">Commission %</th>
                  <th className="p-4">Custom Edit Rates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-black text-cyan-400">{w.userCode}</td>
                    <td className="p-4 text-slate-200">{w.fullName}</td>
                    <td className="p-4 font-bold text-emerald-400">${w.ratePerTask.toFixed(2)}</td>
                    <td className="p-4 font-bold text-purple-400">{(w.refCommission * 100).toFixed(0)}%</td>
                    <td className="p-4">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const rate = parseFloat(formData.get("ratePerTask") as string);
                          const comm = parseFloat(formData.get("refCommission") as string);
                          if (!isNaN(rate) && !isNaN(comm)) {
                            await updateWorkerIndividualRate(w.id, rate, comm);
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="number"
                          step="0.01"
                          name="ratePerTask"
                          defaultValue={w.ratePerTask}
                          className="w-20 bg-slate-950 border border-slate-700 text-xs p-1.5 rounded-lg outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          name="refCommission"
                          defaultValue={w.refCommission}
                          className="w-20 bg-slate-950 border border-slate-700 text-xs p-1.5 rounded-lg outline-none"
                        />
                        <button
                          type="submit"
                          className="py-1 px-3 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 font-bold text-xs rounded-lg border border-purple-500/40"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: ALL SUBMITTED ACCOUNTS (WITH STATUS FILTERS & PRICE EDIT) */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200">System Submitted Accounts History</h2>
            
            {/* Status Filter Buttons */}
            <div className="flex gap-2 text-xs">
              <a href="/dashboard/admin?statusFilter=ALL" className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg">ALL</a>
              <a href="/dashboard/admin?statusFilter=DONE" className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">DONE LIST</a>
              <a href="/dashboard/admin?statusFilter=REJECTED" className="px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg">REJECTED LIST</a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Worker Code</th>
                  <th className="p-4">Identifier</th>
                  <th className="p-4">Password</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Price for Buyer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-black text-cyan-400">{acc.worker.userCode}</td>
                    <td className="p-4 font-mono text-slate-200">{acc.username}</td>
                    <td className="p-4 font-mono text-slate-400">{acc.password}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        acc.status === "DONE" ? "bg-emerald-500/10 text-emerald-400" :
                        acc.status === "REJECTED" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const p = parseFloat(formData.get("price") as string);
                          if (!isNaN(p)) await updateAccountPrice(acc.id, p);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          defaultValue={acc.price}
                          className="w-24 bg-slate-950 border border-slate-700 text-xs p-1.5 rounded-lg outline-none"
                        />
                        <button
                          type="submit"
                          className="py-1 px-3 bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-lg border border-cyan-500/40"
                        >
                          Update Price
                        </button>
                      </form>
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
