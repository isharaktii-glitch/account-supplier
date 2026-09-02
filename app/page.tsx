import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center">
        <div className="glass-panel mb-8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-galaxy-accent2 animate-float">
          Distribution Network Online
        </div>

        <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-galaxy-accent via-galaxy-glow to-galaxy-accent2 bg-clip-text text-transparent">
            Galaxy Workers
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          A secure, high-performance account distribution platform connecting
          workers, buyers, and administrators inside one unified galaxy.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary text-base">
            🚀 Enter the Portal
          </Link>
          <Link href="/login" className="btn-secondary text-base">
            Already a member? Login
          </Link>
        </div>

        <div className="mt-24 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="glass-card text-left">
            <div className="mb-4 h-10 w-10 rounded-lg bg-galaxy-accent/20 shadow-glow-purple" />
            <h3 className="mb-2 text-lg font-semibold text-white">For Workers</h3>
            <p className="text-sm text-slate-400">
              Submit accounts, track your balance in real time, and get paid
              based on dynamic task rates.
            </p>
          </div>

          <div className="glass-card text-left">
            <div className="mb-4 h-10 w-10 rounded-lg bg-galaxy-accent2/20 shadow-glow-cyan" />
            <h3 className="mb-2 text-lg font-semibold text-white">For Buyers</h3>
            <p className="text-sm text-slate-400">
              Get approved, browse available inventory, and securely submit
              your payment proof for review.
            </p>
          </div>

          <div className="glass-card text-left">
            <div className="mb-4 h-10 w-10 rounded-lg bg-galaxy-glow/20 shadow-glow-purple" />
            <h3 className="mb-2 text-lg font-semibold text-white">Secure by Design</h3>
            <p className="text-sm text-slate-400">
              Passwords are hashed, sessions are protected, and every role
              operates within its own boundary.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
