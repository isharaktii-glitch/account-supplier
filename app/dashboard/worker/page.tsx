import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { submitAccount, requestPayment } from "@/app/actions/workerActions";

export default async function WorkerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ workerId?: string; query?: string }>;
}) {
  const params = await searchParams;
  // Demo එක සඳහා Default Worker කෙනෙකු (Real App එකේදී Auth Session එකෙන් ලබාගනී)
  const workerId = params.workerId || "DEFAULT_WORKER_ID";
  const searchQuery = params.query || "";

  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    include: {
      accountsSubmitted: {
        where: {
          OR: [
            { username: { contains: searchQuery, mode: "insensitive" } },
            { type: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
      },
      paymentRequests: true,
    },
  });

  const workerCode = worker?.userCode || "UK-001";
  const referralLink = `https://account-supplier.vercel.app/register?ref=${workerCode}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Header Stats & Referral Panel */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Worker Info Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 shadow-[0_15px_35px_rgba(0,240,255,0.15)] relative overflow-hidden">
            <p className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-1">Worker Identification</p>
            <h2 className="text-3xl font-black text-white">{workerCode}</h2>
            <p className="text-slate-400 text-sm mt-1">{worker?.fullName || "Udari Kulathunga"}</p>
          </div>

          {/* Balance & Payment Request Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-[0_15px_35px_rgba(16,185,129,0.15)] flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-1">Approved Earnings</p>
              <h2 className="text-3xl font-black text-emerald-300">${worker?.balance.toFixed(2) || "0.00"}</h2>
            </div>
            
            <form action={async () => {
              "use server";
              if (worker) await requestPayment(worker.id, worker.balance);
            }}>
              <button
                type="submit"
                disabled={!worker || worker.balance <= 0}
                className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
              >
                🚀 Request Payment
              </button>
            </form>
          </div>

          {/* Dynamic Referral Link Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30 shadow-[0_15px_35px_rgba(168,85,247,0.15)]">
            <p className="text-xs font-bold text-purple-400 tracking-wider uppercase mb-2">Your Multi-Tier Referral Link</p>
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full bg-slate-950 border border-purple-500/30 text-purple-300 text-xs p-3 rounded-xl mb-3 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Share link to earn dynamic referral commissions (Level 1: <span className="text-purple-300 font-semibold">{workerCode}/[Initials]</span>).
            </p>
          </div>

        </div>

        {/* Submit Account Form & History Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Account Submission Box */}
          <div className="lg:col-span-1 rounded-3xl p-6 bg-slate-900/80 border border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] h-fit">
            <h3 className="text-xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
              <span>➕</span> Submit Account
            </h3>

            <form action={submitAccount} className="space-y-4">
              <input type="hidden" name="workerId" value={worker?.id || workerId} />

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">ACCOUNT TYPE</label>
                <select name="type" className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none">
                  <option value="GMAIL">Gmail Account</option>
                  <option value="KYC">KYC Verified Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">EMAIL / USERNAME</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">PASSWORD</label>
                <input
                  type="text"
                  name="password"
                  required
                  placeholder="Account Password"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-black rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 transition-all mt-4"
              >
                Submit Account Now
              </button>
            </form>
          </div>

          {/* Account Submission History */}
          <div className="lg:col-span-2 rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Submission History</h3>
              
              {/* Search Filter */}
              <form method="GET" className="w-64">
                <input
                  type="text"
                  name="query"
                  defaultValue={searchQuery}
                  placeholder="Search Username / Password..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:border-cyan-500 outline-none"
                />
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Username / Email</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">Rate</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {worker?.accountsSubmitted.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-bold text-cyan-400">{acc.type}</td>
                      <td className="p-4 text-slate-200">{acc.username}</td>
                      <td className="p-4 font-mono text-slate-400">{acc.password}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${acc.price.toFixed(2)}</td>
                      <td className="p-4">
                        {acc.status === "DONE" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            DONE
                          </span>
                        )}
                        {acc.status === "PENDING" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            PENDING
                          </span>
                        )}
                        {acc.status === "REJECTED" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30" title={acc.rejectReason || ""}>
                            REJECTED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!worker?.accountsSubmitted || worker.accountsSubmitted.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-slate-600">No accounts submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
