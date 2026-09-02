import Navbar from "@/components/Navbar";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="relative rounded-3xl p-8 mb-12 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,240,255,0.15)]">
          <h1 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 bg-clip-text text-transparent">
            Platform Operational Guidelines
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Standard Operating Rules for Galaxy Workers Account Supplier Buyers, Workers, and System Administrators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold mb-4">
              📧
            </div>
            <h2 className="text-xl font-bold text-cyan-300 mb-3">Allowed Gmail Operational Use Cases</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              All accounts provided via the platform must adhere strictly to compliance-ready operational procedures:
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="text-cyan-400">▹</span> Software & Mobile App QA Verification Testing</li>
              <li className="flex items-center gap-2"><span className="text-cyan-400">▹</span> Legitimate Digital Outreach & Email Marketing</li>
              <li className="flex items-center gap-2"><span className="text-cyan-400">▹</span> Enterprise Account Infrastructure Setup</li>
            </ul>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold mb-4">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-indigo-300 mb-3">Worker Anonymity & Security Protection</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Strict identity masking protocols to prevent buyer-worker direct conflict:
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="text-indigo-400">▹</span> Worker real names are hidden from Buyers (Worker Code only)</li>
              <li className="flex items-center gap-2"><span className="text-indigo-400">▹</span> Multi-Tier Referral tracking format (e.g. UK-001/TK)</li>
              <li className="flex items-center gap-2"><span className="text-indigo-400">▹</span> Automated rejection auditing with mandatory reason logs</li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
