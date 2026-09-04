"use client";

import { useState, useTransition } from "react";
import {
  approveBuyer,
  rejectBuyer,
  deleteUser,
  updateSystemRates,
  setCountryRate,
  deleteCountryRate,
  toggleSystemPause,
  updateAdminPaymentDetails,
  approvePaymentRequest,
  rejectPaymentRequest,
  sendAnnouncement,
  uploadPayoutProof,
  approvePayoutRequest,
  rejectPayoutRequest
} from "@/app/actions/adminActions";
import { COUNTRIES } from "@/lib/countries";

type Buyer = { id: string; name: string; email: string; country: string | null; createdAt: string };

type Worker = {
  id: string;
  name: string;
  email: string;
  displayId: string | null;
  country: string | null;
  balance: number;
  pendingBalance: number;
  paymentDetails: string | null;
  createdAt: string;
};

type PaymentRequest = {
  id: string;
  amount: number;
  proofSlipUrl: string;
  buyerPaymentDetails: string | null;
  status: string;
  createdAt: string;
  buyer: { name: string; email: string };
};

type PayoutProofItem = {
  id: string;
  amount: number;
  proofUrl: string;
  note: string | null;
  createdAt: string;
  worker: { name: string; displayId: string | null };
};

type PayoutRequestItem = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  worker: { name: string; displayId: string | null; balance: number };
};

type CountryRateItem = { id: string; countryCode: string; countryName: string; rate: number };

type Settings = { sriLankaRate: number; otherCountriesRate: number; referralCommission: number } | null;
type AccountStat = { status: string; _count: { status: number } };
type AdminInfo = { id: string; paymentDetails: string | null } | null;

type AdminData = {
  admin: AdminInfo;
  pendingBuyers: Buyer[];
  approvedBuyers: Buyer[];
  workers: Worker[];
  pendingPayments: PaymentRequest[];
  allPayments: PaymentRequest[];
  settings: Settings;
  accountStats: AccountStat[];
  payoutProofs: PayoutProofItem[];
  payoutRequests: PayoutRequestItem[];
  countryRates: CountryRateItem[];
  pendingPaymentCount: number;
  pendingBuyerCount: number;
  pendingPayoutRequestCount: number;
  isSystemPaused: boolean;
};

export default function AdminPanelClient({ initialData }: { initialData: AdminData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [rateMessage, setRateMessage] = useState<string | null>(null);
  const [paymentDetailsMessage, setPaymentDetailsMessage] = useState<string | null>(null);
  const [countryRateMessage, setCountryRateMessage] = useState<string | null>(null);
  const [pauseMessage, setPauseMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState
    "buyers" | "workers" | "payments" | "payouts" | "announcements" | "settings"
  >("buyers");

  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  function handleApproveBuyer(id: string) {
    startTransition(async () => {
      await approveBuyer(id);
      setData((prev) => ({
        ...prev,
        pendingBuyers: prev.pendingBuyers.filter((b) => b.id !== id),
        approvedBuyers: [...prev.approvedBuyers, prev.pendingBuyers.find((b) => b.id === id)!].filter(Boolean),
        pendingBuyerCount: prev.pendingBuyerCount - 1
      }));
    });
  }

  function handleRejectBuyer(id: string) {
    startTransition(async () => {
      await rejectBuyer(id);
      setData((prev) => ({
        ...prev,
        pendingBuyers: prev.pendingBuyers.filter((b) => b.id !== id),
        pendingBuyerCount: prev.pendingBuyerCount - 1
      }));
    });
  }

  function confirmDeleteUser() {
    if (!deletingUser) return;
    startTransition(async () => {
      const result = await deleteUser(deletingUser.id);
      if (result?.success) {
        setData((prev) => ({
          ...prev,
          workers: prev.workers.filter((w) => w.id !== deletingUser.id),
          approvedBuyers: prev.approvedBuyers.filter((b) => b.id !== deletingUser.id),
          pendingBuyers: prev.pendingBuyers.filter((b) => b.id !== deletingUser.id)
        }));
      }
      setDeletingUser(null);
    });
  }

  function handleApprovePayment(id: string) {
    startTransition(async () => {
      await approvePaymentRequest(id);
      setData((prev) => ({
        ...prev,
        pendingPayments: prev.pendingPayments.filter((p) => p.id !== id),
        allPayments: prev.allPayments.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p)),
        pendingPaymentCount: prev.pendingPaymentCount - 1
      }));
    });
  }

  function openRejectModal(id: string) {
    setRejectingPaymentId(id);
    setRejectReason("");
  }

  function submitRejectPayment() {
    if (!rejectingPaymentId || !rejectReason.trim()) return;
    const fd = new FormData();
    fd.set("reason", rejectReason.trim());

    startTransition(async () => {
      const result = await rejectPaymentRequest(rejectingPaymentId, fd);
      if (result?.success) {
        setData((prev) => ({
          ...prev,
          pendingPayments: prev.pendingPayments.filter((p) => p.id !== rejectingPaymentId),
          allPayments: prev.allPayments.map((p) => (p.id === rejectingPaymentId ? { ...p, status: "REJECTED" } : p)),
          pendingPaymentCount: prev.pendingPaymentCount - 1
        }));
        setRejectingPaymentId(null);
      }
    });
  }

  function handleApprovePayoutRequest(id: string) {
    startTransition(async () => {
      await approvePayoutRequest(id);
      setData((prev) => ({
        ...prev,
        payoutRequests: prev.payoutRequests.filter((r) => r.id !== id),
        pendingPayoutRequestCount: prev.pendingPayoutRequestCount - 1
      }));
    });
  }

  function handleRejectPayoutRequest(id: string) {
    startTransition(async () => {
      await rejectPayoutRequest(id);
      setData((prev) => ({
        ...prev,
        payoutRequests: prev.payoutRequests.filter((r) => r.id !== id),
        pendingPayoutRequestCount: prev.pendingPayoutRequestCount - 1
      }));
    });
  }

  async function handleRateUpdate(formData: FormData) {
    setRateMessage(null);
    startTransition(async () => {
      const result = await updateSystemRates(formData);
      if (result) {
        setRateMessage(result.message);
        if (result.success) {
          const sriLankaRate = parseFloat(String(formData.get("sriLankaRate") || "0"));
          const otherCountriesRate = parseFloat(String(formData.get("otherCountriesRate") || "0"));
          const referralCommission = parseFloat(String(formData.get("referralCommission") || "0"));
          setData((prev) => ({ ...prev, settings: { sriLankaRate, otherCountriesRate, referralCommission } }));
        }
      }
    });
  }

  async function handleSetCountryRate(formData: FormData) {
    setCountryRateMessage(null);
    startTransition(async () => {
      const result = await setCountryRate(formData);
      if (result) {
        setCountryRateMessage(result.message);
        if (result.success) {
          const countryCode = String(formData.get("countryCode"));
          const countryName = String(formData.get("countryName"));
          const rate = parseFloat(String(formData.get("rate")));
          setData((prev) => {
            const existing = prev.countryRates.find((c) => c.countryCode === countryCode);
            if (existing) {
              return {
                ...prev,
                countryRates: prev.countryRates.map((c) => (c.countryCode === countryCode ? { ...c, rate } : c))
              };
            }
            return {
              ...prev,
              countryRates: [...prev.countryRates, { id: `temp-${Date.now()}`, countryCode, countryName, rate }]
            };
          });
        }
      }
    });
  }

  function handleDeleteCountryRate(countryCode: string) {
    startTransition(async () => {
      await deleteCountryRate(countryCode);
      setData((prev) => ({ ...prev, countryRates: prev.countryRates.filter((c) => c.countryCode !== countryCode) }));
    });
  }

  async function handleAdminPaymentDetailsUpdate(formData: FormData) {
    setPaymentDetailsMessage(null);
    startTransition(async () => {
      const result = await updateAdminPaymentDetails(formData);
      if (result) {
        setPaymentDetailsMessage(result.message);
        if (result.success) {
          const paymentDetails = String(formData.get("paymentDetails") || "");
          setData((prev) => ({ ...prev, admin: prev.admin ? { ...prev.admin, paymentDetails } : prev.admin }));
        }
      }
    });
  }

  async function handleSendAnnouncement(formData: FormData) {
    setAnnouncementMessage(null);
    startTransition(async () => {
      const result = await sendAnnouncement(formData);
      if (result) setAnnouncementMessage(result.message);
    });
  }

  async function handleUploadPayout(formData: FormData) {
    setPayoutMessage(null);
    startTransition(async () => {
      const result = await uploadPayoutProof(formData);
      if (result) setPayoutMessage(result.message);
    });
  }

  function handleTogglePause() {
    setPauseMessage(null);
    startTransition(async () => {
      const result = await toggleSystemPause();
      if (result) {
        setPauseMessage(result.message);
        setData((prev) => ({ ...prev, isSystemPaused: result.isPaused }));
      }
    });
  }

  const availableCount = data.accountStats.find((s) => s.status === "AVAILABLE")?._count.status ?? 0;
  const soldCount = data.accountStats.find((s) => s.status === "SOLD")?._count.status ?? 0;
  const totalNotifications = data.pendingPaymentCount + data.pendingBuyerCount + data.pendingPayoutRequestCount;

  return (
    <div>
      {totalNotifications > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 animate-pulse-glow">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-lg font-bold text-amber-300">
            {totalNotifications}
          </span>
          <p className="text-sm font-semibold text-amber-200">
            {data.pendingPaymentCount} pending payment{data.pendingPaymentCount !== 1 ? "s" : ""},{" "}
            {data.pendingBuyerCount} pending buyer{data.pendingBuyerCount !== 1 ? "s" : ""}, and{" "}
            {data.pendingPayoutRequestCount} payout request{data.pendingPayoutRequestCount !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">System Status</p>
          <p className="text-xs text-slate-400">
            {data.isSystemPaused ? "Paused — workers cannot submit accounts" : "Running normally"}
          </p>
        </div>
        <button
          onClick={handleTogglePause}
          disabled={isPending}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
            data.isSystemPaused
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
          }`}
        >
          {data.isSystemPaused ? "Resume System" : "Pause System"}
        </button>
      </div>
      {pauseMessage && (
        <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {pauseMessage}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-galaxy-accent2">{data.pendingBuyers.length}</p>
          <p className="text-xs text-slate-400">Pending Buyers</p>
        </div>
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-galaxy-accent2">{data.workers.length}</p>
          <p className="text-xs text-slate-400">Total Workers</p>
        </div>
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{availableCount}</p>
          <p className="text-xs text-slate-400">Accounts Available</p>
        </div>
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-galaxy-glow">{soldCount}</p>
          <p className="text-xs text-slate-400">Accounts Sold</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {(["buyers", "workers", "payments", "payouts", "announcements", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
              activeTab === t
                ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white shadow-glow-purple"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
            {t === "buyers" && data.pendingBuyerCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {data.pendingBuyerCount}
              </span>
            )}
            {t === "payments" && data.pendingPaymentCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {data.pendingPaymentCount}
              </span>
            )}
            {t === "payouts" && data.pendingPayoutRequestCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {data.pendingPayoutRequestCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "buyers" && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Pending Buyer Requests ({data.pendingBuyers.length})
            </h2>
            {data.pendingBuyers.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {data.pendingBuyers.map((buyer) => (
                  <div key={buyer.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">{buyer.name}</p>
                      <p className="text-sm text-slate-400">{buyer.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={isPending} onClick={() => handleApproveBuyer(buyer.id)} className="btn-primary !px-4 !py-2 text-sm">
                        Approve
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleRejectBuyer(buyer.id)}
                        className="btn-secondary !px-4 !py-2 text-sm hover:!border-rose-400 hover:!text-rose-400"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Approved Buyers ({data.approvedBuyers.length})
            </h2>
            {data.approvedBuyers.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No approved buyers yet.</p>
            ) : (
              <div className="space-y-2">
                {data.approvedBuyers.map((b) => (
                  <div key={b.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-slate-400">{b.email} • {b.country ?? "Unknown"}</p>
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => setDeletingUser({ id: b.id, name: b.name })}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "workers" && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Workers ({data.workers.length})</h2>
          {data.workers.length === 0 ? (
            <p className="glass-panel p-6 text-sm text-slate-400">No workers yet.</p>
          ) : (
            <div className="space-y-3">
              {data.workers.map((w) => (
                <div key={w.id} className="glass-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        <span className="font-mono text-galaxy-accent2">{w.displayId}</span> — {w.name}
                      </p>
                      <p className="text-sm text-slate-400">{w.email} • {w.country ?? "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">${w.balance.toFixed(2)}</p>
                      <p className="text-xs text-amber-400">Pending: ${w.pendingBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Payment Details
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-slate-200">
                        {w.paymentDetails || <span className="italic text-slate-500">Not provided yet</span>}
                      </p>
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => setDeletingUser({ id: w.id, name: w.name })}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "payments" && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Pending Payment Approvals ({data.pendingPayments.length})
            </h2>
            {data.pendingPayments.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No pending payments.</p>
            ) : (
              <div className="space-y-3">
                {data.pendingPayments.map((p) => (
                  <div key={p.id} className="glass-panel p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{p.buyer.name} — ${p.amount.toFixed(2)}</p>
                        <p className="text-sm text-slate-400">{p.buyer.email}</p>
                        <a href={p.proofSlipUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-galaxy-accent2 hover:underline">
                          View Proof Slip →
                        </a>
                        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Buyer Paid From
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-200">
                            {p.buyerPaymentDetails || <span className="italic text-slate-500">Not provided</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={isPending} onClick={() => handleApprovePayment(p.id)} className="btn-primary !px-4 !py-2 text-sm">
                          Approve
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => openRejectModal(p.id)}
                          className="btn-secondary !px-4 !py-2 text-sm hover:!border-rose-400 hover:!text-rose-400"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="table-glass">
                <thead><tr><th>Buyer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {data.allPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.buyer.name}</td>
                      <td>${p.amount.toFixed(2)}</td>
                      <td>
                        <span className={p.status === "APPROVED" ? "badge-approved" : p.status === "REJECTED" ? "badge-rejected" : "badge-pending"}>
                          {p.status}
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Pending Payout Requests ({data.payoutRequests.length})
            </h2>
            {data.payoutRequests.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No pending payout requests.</p>
            ) : (
              <div className="space-y-3">
                {data.payoutRequests.map((r) => (
                  <div key={r.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">
                        {r.worker.displayId} — {r.worker.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        Requested: <span className="text-amber-400">${r.amount.toFixed(2)}</span> (Balance: ${r.worker.balance.toFixed(2)})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={isPending} onClick={() => handleApprovePayoutRequest(r.id)} className="btn-primary !px-4 !py-2 text-sm">
                        Approve
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleRejectPayoutRequest(r.id)}
                        className="btn-secondary !px-4 !py-2 text-sm hover:!border-rose-400 hover:!text-rose-400"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-panel max-w-lg p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Upload Payout Proof</h2>
            <p className="mb-4 text-xs text-slate-400">
              After paying a worker, upload the transaction slip/screenshot. This deducts from
              their confirmed balance and notifies them.
            </p>
            <form action={handleUploadPayout} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Worker</label>
                <select name="workerId" required className="glass-input">
                  <option value="">Select a worker...</option>
                  {data.workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.displayId} — {w.name} (Balance: ${w.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount Paid</label>
                <input type="number" name="amount" step="0.01" min="0" required className="glass-input" placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Note (optional)</label>
                <input type="text" name="note" className="glass-input" placeholder="e.g. September payout" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Proof (Slip / Screenshot)</label>
                <input
                  type="file"
                  name="proofFile"
                  required
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="glass-input file:mr-4 file:rounded-lg file:border-0 file:bg-galaxy-accent file:px-3 file:py-1.5 file:text-sm file:text-white"
                />
              </div>

              {payoutMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {payoutMessage}
                </div>
              )}

              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Uploading..." : "Upload & Notify Worker"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Payouts</h2>
            {data.payoutProofs.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No payouts recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-glass">
                  <thead><tr><th>Worker</th><th>Amount</th><th>Date</th><th>Proof</th></tr></thead>
                  <tbody>
                    {data.payoutProofs.map((p) => (
                      <tr key={p.id}>
                        <td>{p.worker.displayId} — {p.worker.name}</td>
                        <td>${p.amount.toFixed(2)}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-galaxy-accent2 hover:underline">
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "announcements" && (
        <section className="glass-panel max-w-lg p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Send Announcement</h2>
          <p className="mb-4 text-xs text-slate-400">
            Send a message to a specific worker, or broadcast to all workers at once.
          </p>
          <form action={handleSendAnnouncement} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Send To</label>
              <select name="targetWorkerId" required className="glass-input">
                <option value="ALL">All Workers</option>
                {data.workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.displayId} — {w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
              <input type="text" name="title" required className="glass-input" placeholder="e.g. Rate Update" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Message</label>
              <textarea name="message" required rows={4} className="glass-input resize-none" placeholder="Type your announcement here..." />
            </div>
            {announcementMessage && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {announcementMessage}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Sending..." : "Send Announcement"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Default Rate Settings</h2>
            <form action={handleRateUpdate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Sri Lanka Rate ($)</label>
                <input type="number" name="sriLankaRate" step="0.01" min="0" required defaultValue={data.settings?.sriLankaRate ?? 50} className="glass-input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Other Countries Rate ($)</label>
                <input type="number" name="otherCountriesRate" step="0.01" min="0" required defaultValue={data.settings?.otherCountriesRate ?? 30} className="glass-input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Referral Commission (%)</label>
                <input type="number" name="referralCommission" step="0.01" min="0" required defaultValue={data.settings?.referralCommission ?? 10} className="glass-input" />
              </div>
              {rateMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {rateMessage}
                </div>
              )}
              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Updating..." : "Update Default Rates"}
              </button>
            </form>
          </section>

          <section className="glass-panel p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Country-Specific Rate Override</h2>
            <p className="mb-4 text-xs text-slate-400">
              Set a custom rate for a specific country. Overrides the default rates above.
            </p>
            <form action={handleSetCountryRate} className="space-y-4">
              <select
                name="countryCode"
                required
                className="glass-input"
                onChange={(e) => {
                  const form = e.target.closest("form");
                  const nameInput = form?.querySelector('input[name="countryName"]') as HTMLInputElement;
                  const selected = COUNTRIES.find((c) => c.code === e.target.value);
                  if (nameInput && selected) nameInput.value = selected.name;
                }}
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <input type="hidden" name="countryName" />
              <input type="number" name="rate" step="0.01" min="0" required className="glass-input" placeholder="Custom rate ($)" />

              {countryRateMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {countryRateMessage}
                </div>
              )}

              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Saving..." : "Set Country Rate"}
              </button>
            </form>

            {data.countryRates.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.countryRates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span className="text-white">{c.countryName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-galaxy-accent2">${c.rate.toFixed(2)}</span>
                      <button onClick={() => handleDeleteCountryRate(c.countryCode)} className="text-xs text-rose-400 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-panel p-6 lg:col-span-2">
            <h2 className="mb-1 text-lg font-semibold text-white">Your Payment Receiving Details</h2>
            <p className="mb-4 text-xs text-slate-400">Shown only to approved Buyers.</p>
            <form action={handleAdminPaymentDetailsUpdate} className="max-w-md space-y-4">
              <textarea
                name="paymentDetails"
                required
                rows={5}
                defaultValue={data.admin?.paymentDetails ?? ""}
                className="glass-input resize-none"
                placeholder={"Bank: Commercial Bank\nAcc No: 987654321\nName: Galaxy Workers\n\nOR\n\nBinance ID: 987654321"}
              />
              {paymentDetailsMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {paymentDetailsMessage}
                </div>
              )}
              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Saving..." : "Save Payment Details"}
              </button>
            </form>
          </section>
        </div>
      )}

      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="glass-panel w-full max-w-md p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">Reject Payment Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="glass-input resize-none"
              placeholder="e.g. Proof slip does not match the amount stated."
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setRejectingPaymentId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitRejectPayment} disabled={isPending || !rejectReason.trim()} className="btn-primary flex-1">
                {isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="glass-panel w-full max-w-sm p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-white">Delete {deletingUser.name}?</h3>
            <p className="mb-4 text-sm text-slate-400">
              This will permanently delete this account and all related data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={confirmDeleteUser}
                disabled={isPending}
                className="flex-1 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/30"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
