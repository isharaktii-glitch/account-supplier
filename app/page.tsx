import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        {/* Glowing Badge */}
        <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          ✨ Galaxy Workers Account Supplier Platform
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-200 to-indigo-400 bg-clip-text text-transparent leading-tight max-w-4xl drop-shadow-[0_4px_20px_rgba(0,240,255,0.2)]">
          High Quality Account Supply & Distribution Infrastructure
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mt-6 leading-relaxed">
          Secure identity verification, multi-tier referral tracking, automated worker payouts, and transparent buyer quality controls.
        </p>

        {/* Portal Direct Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-12">
          
          <Link href="/dashboard/worker" className="group rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 hover:border-cyan-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(0,240,255,0.2)] transition-all transform hover:-translate-y-1">
            <div className="text-3xl mb-3">👷‍♂️</div>
            <h2 className="text-lg font-bold text-cyan-300 group-hover:text-cyan-200">Worker Portal</h2>
            <p className="text-slate-400 text-xs mt-2">Submit accounts, track task rate balances & request manual payouts.</p>
          </Link>

          <Link href="/dashboard/buyer" className="group rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/30 hover:border-indigo-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.2)] transition-all transform hover:-translate-y-1">
            <div className="text-3xl mb-3">🛒</div>
            <h2 className="text-lg font-bold text-indigo-300 group-hover:text-indigo-200">Buyer Portal</h2>
            <p className="text-slate-400 text-xs mt-2">Review submitted accounts by Worker Code & process payment slips.</p>
          </Link>

          <Link href="/dashboard/admin" className="group rounded-2xl p-6 bg-slate-900/60 border border-purple-500/30 hover:border-purple-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(168,85,247,0.2)] transition-all transform hover:-translate-y-1">
            <div className="text-3xl mb-3">⚡</div>
            <h2 className="text-lg font-bold text-purple-300 group-hover:text-purple-200">Admin Control</h2>
            <p className="text-slate-400 text-xs mt-2">Manage dynamic rates, verify payment receipts & system controls.</p>
          </Link>

        </div>
      </main>
    </div>
  );
}
