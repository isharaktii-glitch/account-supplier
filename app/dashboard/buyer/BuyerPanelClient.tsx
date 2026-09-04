"use client";

import { useState, useTransition, useRef } from "react";
import {
  submitPaymentProof,
  markBuyerNotificationAsRead,
  markAllBuyerNotificationsAsRead,
  markAccountDone,
  markAccountRejected
} from "@/app/actions/buyerActions";

type AccountItem = {
  id: string;
  gmail: string;
  password: string;
  status: string;
  createdAt: string;
};

type PaymentRequest = {
  id: string;
  amount: number;
  proofSlipUrl: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function BuyerPanelClient({
  initialAccounts,
  initialPayments,
  adminPaymentDetails,
  initialNotifications,
  initialUnreadCount
}: {
  initialAccounts: AccountItem[];
  initialPayments: PaymentRequest[];
  adminPaymentDetails: string | null;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [payments, setPayments] = useState(initialPayments);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"accounts" | "payments">("accounts");
  const formRef = useRef<HTMLFormElement>(null);

  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showNotifications, setShowNotifications] = useState(false);

  const [rejectingAccountId, setRejectingAccountId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [accountActionMessage, setAccountActionMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitPaymentProof(formData);
      if (result) {
        setIsError(!result.success);
        setMessage(result.message);
        if (result.success) {
          formRef.current?.reset();
          setPayments((prev) => [
            {
              id: `temp-${Date.now()}`,
              amount: parseFloat(String(formData.get("amount"))),
              proofSlipUrl: "",
              status: "PENDING",
              rejectionReason: null,
              createdAt: new Date().toISOString()
            },
            ...prev
          ]);
        }
      }
    });
  }

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      await markBuyerNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllBuyerNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  }

  function handleMarkDone(id: string) {
    setAccountActionMessage(null);
    startTransition(async () => {
      const result = await markAccountDone(id);
      if (result) {
        setAccountActionMessage(result.message);
        if (result.success) {
          setAccounts((prev) => prev.filter((a) => a.id !== id));
        }
      }
    });
  }

  function openRejectModal(id: string) {
    setRejectingAccountId(id);
    setRejectReason("");
  }

  function submitRejectAccount() {
    if (!rejectingAccountId || !rejectReason.trim()) return;
    const fd = new FormData();
    fd.set("reason", rejectReason.trim());

    startTransition(async () => {
      const result = await markAccountRejected(rejectingAccountId, fd);
      if (result?.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== rejectingAccountId));
        setRejectingAccountId(null);
        setAccountActionMessage(result.message);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["accounts", "payments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === t
                  ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white shadow-glow-purple"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "accounts" ? "Available Accounts" : "Payment Requests"}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="glass-panel relative flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-white/10 bg-galaxy-surface p-3 shadow-glass">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-galaxy-accent2 hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No notifications yet.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        n.isRead ? "border-white/5 bg-white/5" : "border-galaxy-accent2/30 bg-galaxy-accent2/10"
                      }`}
                    >
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === "accounts" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Available Gmail Accounts ({accounts.length})
          </h2>

          {accountActionMessage && (
            <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {accountActionMessage}
            </div>
          )}

          {accounts.length === 0 ? (
            <p className="glass-panel p-6 text-sm text-slate-400">
              No accounts available right now. Check back soon.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.map((a) => (
                <div key={a.id} className="glass-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm text-white">{a.gmail}</p>
                      <p className="font-mono text-xs text-slate-400">{a.password}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={isPending}
                        onClick={() => handleMarkDone(a.id)}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
                        Mark as Done
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => openRejectModal(a.id)}
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
        </div>
      )}

      {activeTab === "payments" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel border-galaxy-accent2/30 p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Send Payment To</h2>
              <p className="mb-3 text-xs text-slate-400">
                Use the details below to make your payment before submitting proof.
              </p>
              <div className="rounded-lg border border-galaxy-accent2/30 bg-galaxy-accent2/10 p-3">
                <p className="whitespace-pre-wrap text-sm font-medium text-galaxy-accent2">
                  {adminPaymentDetails || (
                    <span className="italic text-slate-500">
                      Admin has not set up payment details yet. Please contact support.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Submit Payment Proof</h2>
              <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount Paid</label>
                  <input type="number" name="amount" step="0.01" min="0" required className="glass-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Your Bank / Binance Details (Paid From)
                  </label>
                  <textarea name="buyerPaymentDetails" required rows={3} className="glass-input resize-none" placeholder={"Bank: BOC\nAcc Name: Jane Smith\n\nOR\n\nBinance ID: 112233445"} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Proof Slip (Image or PDF)</label>
                  <input
                    type="file"
                    name="proofSlip"
                    required
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    className="glass-input file:mr-4 file:rounded-lg file:border-0 file:bg-galaxy-accent file:px-3 file:py-1.5 file:text-sm file:text-white"
                  />
                </div>

                {message && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"}`}>
                    {message}
                  </div>
                )}

                <button type="submit" disabled={isPending} className="btn-primary w-full">
                  {isPending ? "Uploading..." : "Submit Request"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">Your Payment History</h2>
            {payments.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">No payment requests yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="glass-panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">Rs. {p.amount.toFixed(2)}</p>
                      <span className={p.status === "APPROVED" ? "badge-approved" : p.status === "REJECTED" ? "badge-rejected" : "badge-pending"}>
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                    {p.status === "REJECTED" && p.rejectionReason && (
                      <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        Reason: {p.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {rejectingAccountId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="glass-panel w-full max-w-md p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">Reject Account</h3>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="glass-input resize-none"
              placeholder="e.g. Password does not work / account is locked."
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setRejectingAccountId(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={submitRejectAccount}
                disabled={isPending || !rejectReason.trim()}
                className="btn-primary flex-1"
              >
                {isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
