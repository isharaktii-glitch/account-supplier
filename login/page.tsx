"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { registerUser, loginUser } from "@/app/actions/authActions";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function handleAuth(formData: FormData) {
    setMsg("Processing...");
    if (isRegister) {
      const res = await registerUser(formData);
      if (res.error) setMsg(res.error);
      else if (res.isBuyerPending) setMsg("✅ Registered! Your Buyer application is sent to Admin for approval.");
      else { setMsg("✅ Registered! You can now log in."); setIsRegister(false); }
    } else {
      const res = await loginUser(formData);
      if (res.error) setMsg(res.error);
      else if (res.role === "ADMIN") router.push(`/dashboard/admin?adminId=${res.userId}`);
      else if (res.role === "WORKER") router.push(`/dashboard/worker?workerId=${res.userId}`);
      else if (res.role === "BUYER") router.push(`/dashboard/buyer?buyerId=${res.userId}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-md mx-auto mt-16 p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        <h2 className="text-2xl font-black text-center text-cyan-300 mb-6">
          {isRegister ? "Create Platform Account" : "Access Galaxy Portal"}
        </h2>

        {msg && <p className="mb-4 text-xs font-bold text-center text-cyan-400 bg-slate-950 p-3 rounded-xl border border-cyan-500/20">{msg}</p>}

        <form action={handleAuth} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-bold mb-1">FULL NAME</label>
              <input type="text" name="fullName" required className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl" />
            </div>
          )}
          <div>
            <label className="block font-bold mb-1">EMAIL ADDRESS</label>
            <input type="email" name="username" required className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold mb-1">PASSWORD</label>
            <input type="password" name="password" required className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl" />
          </div>

          {isRegister && (
            <div>
              <label className="block font-bold mb-1">SELECT ROLE</label>
              <select name="role" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-slate-200">
                <option value="WORKER">Worker (Submit Accounts)</option>
                <option value="BUYER">Buyer (Apply for Account Purchases)</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-black rounded-xl hover:opacity-90">
            {isRegister ? "Register Account" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 cursor-pointer hover:text-cyan-400" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already registered? Login here" : "Don't have an account? Register here"}
        </p>
      </div>
    </div>
  );
}
