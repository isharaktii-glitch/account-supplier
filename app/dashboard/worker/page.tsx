import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function WorkerDashboard({
  searchParams,
}: {
  searchParams: { workerId?: string };
}) {
  const workerId = searchParams?.workerId;

  if (!workerId) {
    redirect("/login");
  }

  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    include: { accountsSubmitted: true },
  });

  if (!worker) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-black text-cyan-400">Worker Dashboard</h1>
            <p className="text-xs text-slate-400">Welcome back, <span className="text-white font-bold">{worker.fullName}</span></p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Worker ID</p>
              <p className="text-sm font-mono font-bold text-cyan-300">{worker.userCode}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Current Balance</p>
              <p className="text-sm font-black text-emerald-400">${worker.balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Submit Account Form */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-200">Submit New Gmail Account</h2>
          <form action={async (formData: FormData) => {
            "use server";
            const username = formData.get("username") as string;
            const password = formData.get("password") as string;
            if (username && password) {
              await prisma.accountItem.create({
                data: {
                  username,
                  password,
                  workerId: worker.id,
                  price: worker.ratePerTask,
                },
              });
            }
          }} className="grid md:grid-cols-3 gap-4 text-xs">
            <input type="email" name="username" placeholder="Gmail Address" required className="bg-slate-950 border border-slate-700 p-3 rounded-xl focus:outline-none focus:border-cyan-500 text-white" />
            <input type="text" name="password" placeholder="Account Password" required className="bg-slate-950 border border-slate-700 p-3 rounded-xl focus:outline-none focus:border-cyan-500 text-white" />
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 font-extrabold text-black p-3 rounded-xl transition-all">Submit Account (${worker.ratePerTask.toFixed(2)})</button>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-slate-200 mb-4">Submission History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-950 text-slate-300 uppercase font-mono">
                <tr>
                  <th className="p-3">Gmail</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {worker.accountsSubmitted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 italic">No accounts submitted yet.</td>
                  </tr>
                ) : (
                  worker.accountsSubmitted.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-950/50">
                      <td className="p-3 font-mono text-cyan-300">{acc.username}</td>
                      <td className="p-3 font-mono">{acc.password}</td>
                      <td className="p-3 font-bold text-emerald-400">${acc.price.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.status === "DONE" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {acc.status}
                        </span>
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
