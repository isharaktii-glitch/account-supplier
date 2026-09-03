"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerWorker, registerBuyer } from "@/app/actions/authActions";
import Link from "next/link";

type Tab = "worker" | "buyer";

export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>("worker");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const action = tab === "worker" ? registerWorker : registerBuyer;
      const result = await action(formData);
      if (result) {
        setIsError(!result.success);
        setMessage(result.message);

        if (result.success && result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-galaxy-accent to-galaxy-accent2 shadow-glow-purple animate-pulse-glow" />
          <h1 className="text-2xl font-bold text-white">Join Galaxy Workers</h1>
          <p className="mt-1 text-sm text-slate-400">Choose your role to get started</p>
        </div>

        {refCode && tab === "worker" && (
          <div className="mb-4 rounded-xl border border-galaxy-accent2/30 bg-galaxy-accent2/10 px-4 py-2 text-xs text-galaxy-accent2">
            You were referred by a Galaxy Workers member! 🎉
          </div>
        )}

        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("worker");
              setMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "worker"
                ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white shadow-glow-purple"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            I&apos;m a Worker
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("buyer");
              setMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "buyer"
                ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white shadow-glow-purple"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            I&apos;m a Buyer
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {tab === "worker" && <input type="hidden" name="ref" value={refCode} />}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Full Name
            </label>
            <input type="text" name="name" required className="glass-input" placeholder="John Doe" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="glass-input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="glass-input"
              placeholder="At least 6 characters"
            />
          </div>

          {tab === "buyer" && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Buyer accounts require admin approval before you can log in.
            </div>
          )}

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {message}
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? "Creating account..." : `Register as ${tab === "worker" ? "Worker" : "Buyer"}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-galaxy-accent2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
