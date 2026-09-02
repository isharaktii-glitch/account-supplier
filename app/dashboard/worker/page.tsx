import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { submitAccount, requestPayment } from "@/app/actions/workerActions";

export default async function WorkerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ workerId?: string; query?: string }>;
}) {
  const params = await searchParams;
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
  const referralLink = `https://galaxy-workers-app.netlify.app/register?ref=${workerCode}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 bg-slate-900/80 border border-cyan-500/30">
            <p className="text-xs font-bold text-cyan-400 uppercase">Worker Code</p>
            <h2 className="text-3xl font-black text-white">{workerCode}</h2>
            <p className="text-slate-400 text-xs mt-1">{worker?.fullName || "Worker Account"}</p>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/80 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase">Earnings Balance</p>
              <h2 className="text-3xl font-black text-emerald-300">${worker?.balance.toFixed(2) || "0.00"}</h2>
            </div>
            <form action={async () => {
              "use server";
              if (worker) await requestPayment(worker.id, worker.balance);
            }}>
              <button
                type="submit"
                disabled={!worker || worker.balance <= 0}
                className="w-full mt-3 py-2 bg-emerald-500 font-bold text-black text-xs rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                Request Payment
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/80 border border-purple-500/30">
            <p className="text-xs font-bold text-purple-400 uppercase mb-2">Multi-Tier Referral Link</p>
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full bg-slate-950 border border-purple-500/30 text-purple-300 text-xs p-2.5 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 rounded-2xl p-6 bg-slate-900/80 border border-slate-800">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Submit Account</h3>
            <form action={submitAccount} className="space-y-4 text-xs">
              <input type="hidden" name="workerId" value={worker?.id || workerId} />
              <div>
                <label className="block font-bold text-slate-400 mb-1">TYPE</label>
                <select name="type" className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none">
                  <option value="GMAIL">Gmail Account</option>
                  <option value="KYC">KYC Account</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1">EMAIL / USERNAME</label>
                <input type="text" name="username" required placeholder="user@gmail.com" className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1">PASSWORD</label>
                <input type="text" name="password" required placeholder="Password" className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-cyan-500 font-bold text-black rounded-xl hover:bg-cyan-400 transition-all">
                Submit Account
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl p-6 bg-slate-900/80 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Submissions History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="bg-slate-950 text-slate-300 uppercase">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Password</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {worker?.accountsSubmitted.map((acc) => (
                    <tr key={acc.id}>
                      <td className="p-3 font-bold text-cyan-400">{acc.type}</td>
                      <td className="p-3 text-slate-200">{acc.username}</td>
                      <td className="p-3 font-mono">{acc.password}</td>
                      <td className="p-3 font-bold">{acc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
