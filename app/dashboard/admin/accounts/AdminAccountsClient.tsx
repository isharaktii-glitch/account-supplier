"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitAdminAccount, updateTypeRates } from "@/app/actions/adminAccountActions";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_PLACEHOLDERS,
  type AccountTypeKey
} from "@/lib/accountTypes";

type AccountRow = {
  id: string;
  gmail: string;
  password: string;
  type: string;
  status: string;
  createdAt: string;
  worker: { name: string; displayId: string | null; role: string };
};

type CountRow = { type: string; status: string; _count: { _all: number } };

type Props = {
  data: {
    rates: { hotmailRate: number; aolRate: number; otherEmailRate: number };
    accounts: AccountRow[];
    counts: CountRow[];
  };
};

export default function AdminAccountsClient({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedType, setSelectedType] = useState<AccountTypeKey>("GMAIL");
  const [filter, setFilter] = useState<"ALL" | AccountTypeKey>("ALL");

  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [rateMessage, setRateMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitAdminAccount(formData);
      if (result) {
        setIsError(!result.success);
        setMessage(result.message);
        if (result.success) {
          formRef.current?.reset();
          setSelectedType("GMAIL");
          router.refresh();
        }
      }
    });
  }

  function handleRates(formData: FormData) {
    setRateMessage(null);
    startTransition(async () => {
      const result = await updateTypeRates(formData);
      if (result) {
        setRateMessage(result.message);
        if (result.success) router.refresh();
      }
    });
  }

  function availableCount(type: AccountTypeKey) {
    return data.counts
      .filter((c) => c.type === type && c.status === "AVAILABLE")
      .reduce((sum, c) => sum + c._count._all, 0);
  }

  const visible = data.accounts.filter((a) => filter === "ALL" || a.type === filter);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ACCOUNT_TYPES.map((t) => (
          <div key={t} className="glass-card !p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{availableCount(t)}</p>
            <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[t]} available</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Add Account (Admin)</h2>
          <p className="mb-4 text-xs text-slate-400">
            Added accounts appear to buyers of the matching type.
          </p>
          <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Account Type</label>
              <select
                name="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AccountTypeKey)}
                className="glass-input"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="glass-input"
                placeholder={ACCOUNT_TYPE_PLACEHOLDERS[selectedType]}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input type="text" name="password" required minLength={4} className="glass-input" placeholder="Account password" />
            </div>

            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Saving..." : "Add Account"}
            </button>
          </form>
        </section>

        <section className="glass-panel p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Worker Rates per Type</h2>
          <p className="mb-4 text-xs text-slate-400">
            Enter the Sri Lanka rate in Rs. Other countries get the USD value automatically using the exchange rate in
            Settings. Gmail rates stay in the Settings tab.
          </p>
          <form action={handleRates} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Hotmail / Outlook (Rs.)</label>
              <input type="number" name="hotmailRate" step="0.01" min="0" required defaultValue={data.rates.hotmailRate} className="glass-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">AOL (Rs.)</label>
              <input type="number" name="aolRate" step="0.01" min="0" required defaultValue={data.rates.aolRate} className="glass-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Other Email (Rs.)</label>
              <input type="number" name="otherEmailRate" step="0.01" min="0" required defaultValue={data.rates.otherEmailRate} className="glass-input" />
            </div>

            {rateMessage && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {rateMessage}
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Saving..." : "Save Rates"}
            </button>
          </form>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">All Accounts (latest 100)</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["ALL", ...ACCOUNT_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === t
                  ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "ALL" ? "All" : ACCOUNT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="glass-panel p-6 text-sm text-slate-400">No accounts found.</p>
        ) : (
          <div className="space-y-2">
            {visible.map((a) => (
              <div key={a.id} className="glass-panel flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-mono text-sm text-white">{a.gmail}</p>
                  <p className="font-mono text-xs text-slate-400">{a.password}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ACCOUNT_TYPE_LABELS[a.type as AccountTypeKey] ?? a.type} •{" "}
                    {a.worker.role === "ADMIN" ? "Admin" : `${a.worker.displayId ?? ""} ${a.worker.name}`} •{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={a.status === "SOLD" ? "badge-approved" : a.status === "REJECTED" ? "badge-rejected" : "badge-pending"}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
