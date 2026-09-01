import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { reviewAccountByBuyer, processBuyerPayment } from "@/app/actions/buyerActions";

export default async function BuyerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.query || "";

  // 1. Pending Payment Requests ලබා ගැනීම (Attention Alert සඳහා)
  const pendingPayments = await prisma.paymentRequest.findMany({
    where: { status: "PENDING" },
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  // 2. Worker Codes අනුව Account Items Group කර ලබා ගැනීම
  const accounts = await prisma.accountItem.findMany({
    where: {
      OR: [
        { username: { contains: searchQuery, mode: "insensitive" } },
        { worker: { userCode: { contains: searchQuery, mode: "insensitive" } } },
      ],
    },
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Header Title & Search Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Buyer Quality Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review Submitted Gmail/KYC Accounts & Process Manual Settlement Receipts
            </p>
          </div>

          <form method="GET" className="w-full md:w-80">
            <input
              type="text"
              name="query"
              defaultValue={searchQuery}
              placeholder="Filter by Worker Code (e.g. UK-001) or Account..."
              className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none shadow-inner"
            />
          </form>
        </div>

        {/* 🚨 SPECIAL ATTENTION ALERT: WORKER PAYMENT REQUEST NOTIFICATION BANNER */}
        {pendingPayments.length > 0 && (
          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-slate-900 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.3)] animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-black text-amber-400 tracking-wide uppercase">
                  URGENT: PENDING WORKER PAYMENT REQUESTS ({pendingPayments.length})
                </h2>
                <p className="text-slate-300 text-xs">
                  Workers have requested payout settlement. Please review details, execute payment, and submit proof slip.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {pendingPayments.map((pay) => (
                <div key={pay.id} className="bg-slate-950/90 p-5 rounded-2xl border border-amber-500/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Worker Code:</span>
                    <span className="text-base font-black text-cyan-400">{pay.worker.userCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Requested Payout:</span>
                    <span className="text-lg font-black text-emerald-400">${pay.amount.toFixed(2)}</span>
                  </div>

                  {/* Manual Slip Submission Form */}
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const slipUrl = formData.get("slipUrl") as string;
                      if (slipUrl) await processBuyerPayment(pay.id, slipUrl);
                    }}
                    className="space-y-2 pt-2 border-t border-slate-800"
                  >
                    <input
                      type="text"
                      name="slipUrl"
                      required
                      placeholder="Paste Receipt Slip / Binance SS URL"
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2.5 rounded-xl outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:brightness-110 transition-all"
                    >
                      ✔ Mark Paid & Upload Slip
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCOUNTS REVIEW TABLE */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span>📋</span> Accounts Submitted by Worker Codes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Worker Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Account Identifier</th>
                  <th className="p-4">Password</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition-all">
                    {/* Display ONLY Worker Code (Names/Personal Details Hidden) */}
                    <td className="p-4 font-black text-cyan-400 bg-cyan-950/10 rounded-l-xl">
                      {acc.worker.userCode}
                    </td>
                    <td className="p-4 font-bold text-slate-300">{acc.type}</td>
                    <td className="p-4 font-mono text-slate-200">{acc.username}</td>
                    <td className="p-4 font-mono text-slate-400">{acc.password}</td>
                    <td className="p-4 font-bold text-emerald-400">${acc.price.toFixed(2)}</td>
                    <td className="p-4">
                      {acc.status === "DONE" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ✔ DONE
                        </span>
                      )}

                      {acc.status === "REJECTED" && (
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
                            ✖ REJECTED
                          </span>
                          {acc.rejectReason && (
                            <span className="text-[10px] text-rose-300 italic">
                              Reason: {acc.rejectReason}
                            </span>
                          )}
                        </div>
                      )}

                      {acc.status === "PENDING" && (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          {/* DONE ACTION BUTTON */}
                          <form
                            action={async () => {
                              "use server";
                              await reviewAccountByBuyer(acc.id, "DONE");
                            }}
                          >
                            <button
                              type="submit"
                              className="w-full py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all"
                            >
                              ✔ Mark as DONE
                            </button>
                          </form>

                          {/* REJECT ACTION WITH REASON FORM */}
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const reason = formData.get("reason") as string;
                              await reviewAccountByBuyer(acc.id, "REJECTED", reason);
                            }}
                            className="flex gap-1"
                          >
                            <input
                              type="text"
                              name="reason"
                              required
                              placeholder="Reason for reject..."
                              className="w-full bg-slate-950 border border-slate-700 text-[11px] text-slate-200 p-1.5 rounded-lg outline-none focus:border-rose-500"
                            />
                            <button
                              type="submit"
                              className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/40 transition-all shrink-0"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-600">
                      No accounts found for review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
