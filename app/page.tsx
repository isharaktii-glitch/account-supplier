import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide">
          ✨ Galaxy Workers Infrastructure
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          High Quality Account Supply & Distribution Platform
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base leading-relaxed">
          Secure identity verification, automated worker payouts, and transparent buyer quality controls.
        </p>

        <div className="pt-6">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-black text-black text-base rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all inline-block"
          >
            Access Login / Register Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}
