"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/authActions";
import Link from "next/link";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await loginUser(formData);
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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-galaxy-accent to-galaxy-accent2 shadow-glow-purple animate-pulse-glow" />
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to access your Galaxy Workers dashboard
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
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
              className="glass-input"
              placeholder="••••••••"
            />
          </div>

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
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-galaxy-accent2 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
