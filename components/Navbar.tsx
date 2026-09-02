"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-slate-950/80 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-[0_4px_20px_rgba(0,240,255,0.15)]">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)] transform -rotate-6">
          <span className="text-xl font-black text-white">G</span>
        </div>
        <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,240,255,0.3)]">
          GALAXY WORKERS
        </span>
      </div>

      <div className="flex space-x-6 text-sm font-medium text-slate-300">
        <Link href="/" className="hover:text-cyan-400 transition-all">Home</Link>
        <Link href="/guidelines" className="hover:text-cyan-400 transition-all">Guidelines</Link>
        <Link href="/dashboard/worker" className="hover:text-cyan-400 transition-all">Worker</Link>
        <Link href="/dashboard/buyer" className="hover:text-cyan-400 transition-all">Buyer</Link>
        <Link href="/dashboard/admin" className="hover:text-cyan-400 transition-all">Admin</Link>
      </div>
    </nav>
  );
}
