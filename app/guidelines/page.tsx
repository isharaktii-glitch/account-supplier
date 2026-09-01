  import Navbar from "@/components/Navbar";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 3D Hero Banner */}
        <div className="relative rounded-3xl p-8 mb-12 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,240,255,0.15)] transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 bg-clip-text text-transparent">
            Galaxy Workers Account Supplier
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Official Platform Operations & Security Standards Guide for Buyers, Workers, and System Admins.
          </p>
        </div>

        {/* Grid Cards with 3D Depth */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1: Gmail Use Cases */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(0,240,255,0.2)] transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl mb-4 shadow-[inset_0_0_10px_rgba(0,240,255,0.2)]">
              📧
            </div>
            <h2 className="text-xl font-bold text-cyan-300 mb-3">Gmail Accounts Standard Purpose</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Accounts supplied on Galaxy Workers are used exclusively for legal operational testing, quality assurance, and digital marketing outreach:
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">▹</span> Software & Mobile App QA Testing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">▹</span> Digital Marketing & Email Campaigns
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">▹</span> Multi-Channel Vendor Operations
              </li>
            </ul>
          </div>

          {/* Card 2: KYC & Buyer Safety */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.2)] transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl mb-4 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-indigo-300 mb-3">KYC & Identity Protection</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              We implement rigid manual validation protocols to protect both buyers and workers against fraud:
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">▹</span> Verification of compliance readiness
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">▹</span> Elimination of automated bot generation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-400">▹</span> Anonymized worker identity routing (Worker Codes only)
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
