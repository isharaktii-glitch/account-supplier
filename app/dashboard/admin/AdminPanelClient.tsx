"use client";

import { useState, useTransition } from "react";
import {
  approveBuyer,
  rejectBuyer,
  updateSystemRates,
  updateAdminPaymentDetails,
  approvePaymentRequest,
  rejectPaymentRequest
} from "@/app/actions/adminActions";

type Buyer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type Worker = {
  id: string;
  name: string;
  email: string;
  workerCode: string | null;
  balance: number;
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

type Settings = {
  taskRate: number;
  referralCommission: number;
} | null;

type AccountStat = {
  status: string;
  _count: { status: number };
};

type AdminInfo = {
  id: string;
  paymentDetails: string | null;
} | null;

type AdminData = {
  admin: AdminInfo;
  pendingBuyers: Buyer[];
  approvedBuyers: Buyer[];
  workers: Worker[];
  pendingPayments: PaymentRequest[];
  allPayments: PaymentRequest[];
  settings: Settings;
  accountStats: AccountStat[];
  pendingPaymentCount: number;
  pendingBuyerCount: number;
};

export default function AdminPanelClient({ initialData }: { initialData: AdminData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [rateMessage, setRateMessage] = useState<string | null>(null);
  const [paymentDetailsMessage, setPaymentDetailsMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"buyers" | "workers" | "payments" | "settings">("buyers");

  function handleApproveBuyer(id: string) {
    startTransition(async () => {
      await approveBuyer(id);
      setData((prev) => ({
        ...prev,
        pendingBuyers: prev.pendingBuyers.filter((b) => b.id !== id),
        approvedBuyers: [
          ...prev.approvedBuyers,
          prev.pendingBuyers.find((b) => b.id === id)!
        ].filter(Boolean),
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

  function handleApprovePayment(id: string) {
    startTransition(async () => {
      await approvePaymentRequest(id);
      setData((prev) => ({
        ...prev,
        pendingPayments: prev.pendingPayments.filter((p) => p.id !== id),
        allPayments: prev.allPayments.map((p) =>
          p.id === id ? { ...p, status: "APPROVED" } : p
        ),
        pendingPaymentCount: prev.pendingPaymentCount - 1
      }));
    });
  }

  function handleRejectPayment(id: string) {
    startTransition(async () => {
      await rejectPaymentRequest(id);
      setData((prev) => ({
        ...prev,
        pendingPayments: prev.pendingPayments.filter((p) => p.id !== id),
        allPayments: prev.allPayments.map((p) =>
          p.id === id ? { ...p, status: "REJECTED" } : p
        ),
        pendingPaymentCount: prev.pendingPaymentCount - 1
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
          const taskRate = parseFloat(String(formData.get("taskRate") || "0"));
          const referralCommission = parseFloat(String(formData.get("referralCommission") || "0"));
          setData((prev) => ({ ...prev, settings: { taskRate, referralCommission } }));
        }
      }
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
          setData((prev) => ({
            ...prev,
            admin: prev.admin ? { ...prev.admin, paymentDetails } : prev.admin
          }));
        }
      }
    });
  }

  const availableCount =
    data.accountStats.find((s) => s.status === "AVAILABLE")?._count.status ?? 0;
  const soldCount = data.accountStats.find((s) => s.status === "SOLD")?._count.status ?? 0;
  const totalNotifications = data.pendingPaymentCount + data.pendingBuyerCount;

  return (
    <div>
      {totalNotifications > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 animate-pulse-glow">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-lg font-bold text-amber-300">
            {totalNotifications}
          </span>
          <p className="text-sm font-semibold text-amber-200">
            You have {data.pendingPaymentCount} pending payment
            {data.pendingPaymentCount !== 1 ? "s" : ""} and {data.pendingBuyerCount} pending buyer
            request{data.pendingBuyerCount !== 1 ? "s" : ""} awaiting your review.
          </p>
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
        {(["buyers", "workers", "payments", "settings"] as const).map((t) => (
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
                  <div
                    key={buyer.id}
                    className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{buyer.name}</p>
                      <p className="text-sm text-slate-400">{buyer.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={isPending}
                        onClick={() => handleApproveBuyer(buyer.id)}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
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
              <div className="overflow-x-auto">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.approvedBuyers.map((b) => (
                      <tr key={b.id}>
                        <td>{b.name}</td>
                        <td>{b.email}</td>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "workers" && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Workers ({data.workers.length})
          </h2>
          {data.workers.length === 0 ? (
            <p className="glass-panel p-6 text-sm text-slate-400">No workers yet.</p>
          ) : (
            <div className="space-y-3">
              {data.workers.map((w) => (
                <div key={w.id} className="glass-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        <span className="font-mono text-galaxy-accent2">{w.workerCode}</span> —{" "}
                        {w.name}
                      </p>
                      <p className="text-sm text-slate-400">{w.email}</p>
                    </div>
                    <p className="font-semibold text-emerald-400">Rs. {w.balance.toFixed(2)}</p>
                  </div>
                  <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Payment Details (Bank / Binance)
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-slate-200">
                      {w.paymentDetails || (
                        <span className="italic text-slate-500">Not provided yet</span>
                      )}
                    </p>
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
                        <p className="font-semibold text-white">
                          {p.buyer.name} — Rs. {p.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-400">{p.buyer.email}</p>
                        <a
                          href={p.proofSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-galaxy-accent2 hover:underline"
                        >
                          View Proof Slip →
                        </a>

                        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Buyer Paid From (Bank / Binance)
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-slate-200">
                            {p.buyerPaymentDetails || (
                              <span className="italic text-slate-500">Not provided</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={isPending}
                          onClick={() => handleApprovePayment(p.id)}
                          className="btn-primary !px-4 !py-2 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleRejectPayment(p.id)}
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
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.buyer.name}</td>
                      <td>Rs. {p.amount.toFixed(2)}</td>
                      <td>
                        <span
                          className={
                            p.status === "APPROVED"
                              ? "badge-approved"
                              : p.status === "REJECTED"
                              ? "badge-rejected"
                              : "badge-pending"
                          }
                        >
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

      {activeTab === "settings" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="glass-panel p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Global Rate Settings</h2>
            <form action={handleRateUpdate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Task Rate (per submission)
                </label>
                <input
                  type="number"
                  name="taskRate"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={data.settings?.taskRate ?? 50}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Referral Commission (%)
                </label>
                <input
                  type="number"
                  name="referralCommission"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={data.settings?.referralCommission ?? 10}
                  className="glass-input"
                />
              </div>

              {rateMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {rateMessage}
                </div>
              )}

              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Updating..." : "Update Rates"}
              </button>
            </form>
          </section>

          <section className="glass-panel p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">
              Your Payment Receiving Details
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Enter your Bank Account or Binance ID here. This is shown only to approved Buyers so
              they know where to send payments.
            </p>
            <form action={handleAdminPaymentDetailsUpdate} className="space-y-4">
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
    </div>
  );
}
