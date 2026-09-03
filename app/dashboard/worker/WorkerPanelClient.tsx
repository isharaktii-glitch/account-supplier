"use client";

import { useState, useTransition, useRef } from "react";
import {
  submitGmailAccount,
  updateWorkerPaymentDetails,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "@/app/actions/workerActions";

type Worker = {
  id: string;
  name: string;
  balance: number;
  displayId: string | null;
  referralCode: string | null;
  paymentDetails: string | null;
} | null;

type Submission = {
  id: string;
  gmail: string;
  status: string;
  rateAtEntry: number;
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

type Referral = {
  id: string;
  name: string;
  displayId: string | null;
  createdAt: string;
};

type PayoutProof = {
  id: string;
  amount: number;
  proofUrl: string;
  note: string | null;
  createdAt: string;
};

export default function WorkerPanelClient({
  initialWorker,
  initialSubmissions,
  currentRate,
  initialNotifications,
  initialUnreadCount,
  referrals,
  referralCommission,
  payoutProofs
}: {
  initialWorker: Worker;
  initialSubmissions: Submission[];
  currentRate: number;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  referrals: Referral[];
  referralCommission: number;
  payoutProofs: PayoutProof[];
}) {
  const [worker, setWorker] = useState(initialWorker);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentIsError, setPaymentIsError] = useState(false);
  const [isPaymentPending, startPaymentTransition] = useTransition();

  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showNotifications, setShowNotifications] = useState(false);

  const [activeTab, setActiveTab] = useState<"submit" | "referrals" | "payouts" | "payment">("submit");
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== "undefined" && worker?.referralCode
      ? `${window.location.origin}/register?ref=${worker.referralCode}`
      : "";

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitGmailAccount(formData);
      if (result) {
        setIsError(!result.success);
        setMessage(result.message);

        if (result.success) {
          formRef.current?.reset();
          setWorker((prev) => (prev ? { ...prev, balance: prev.balance + currentRate } : prev));
          setSubmissions((prev) => [
            {
              id: `temp-${Date.now()}`,
              gmail: String(formData.get("gmail")),
              status: "AVAILABLE",
              rateAtEntry: currentRate,
              rejectionReason: null,
              createdAt: new Date().toISOString()
            },
            ...prev
          ]);
        }
      }
    });
  }

  function handlePaymentDetailsSubmit(formData: FormData) {
    setPaymentMessage(null);
    startPaymentTransition(async () => {
      const result = await updateWorkerPaymentDetails(formData);
      if (result) {
        setPaymentIsError(!result.success);
        setPaymentMessage(result.message);
        if (result.success) {
          setWorker((prev) =>
            prev ? { ...prev, paymentDetails: String(formData.get("paymentDetails")) } : prev
          );
        }
      }
    });
  }

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  }

  function copyReferralLink() {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["submit", "referrals", "payouts", "payment"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === t
                  ? "bg-gradient-to-r from-galaxy-accent to-galaxy-glow text-white shadow-glow-purple"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "submit" ? "Submit Account" : t === "referrals" ? "My Referrals" : t === "payouts" ? "Payout History" : "Payment Details"}
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
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-galaxy-accent2 hover:underline"
                  >
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
                        n.isRead
                          ? "border-white/5 bg-white/5"
                          : "border-galaxy-accent2/30 bg-galaxy-accent2/10"
                      }`}
                    >
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">Rs. {worker?.balance.toFixed(2) ?? "0.00"}</p>
          <p className="text-xs text-slate-400">Current Balance</p>
        </div>
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-galaxy-accent2">Rs. {currentRate.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Task Rate</p>
        </div>
        <div className="glass-card !p-4 text-center">
          <p className="text-2xl font-bold text-galaxy-glow">{referrals.length}</p>
          <p className="text-xs text-slate-400">Your Referrals</p>
        </div>
      </div>

      {activeTab === "submit" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="glass-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Submit Gmail Account</h2>
              <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    name="gmail"
                    required
                    className="glass-input"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Account Password
                  </label>
                  <input
                    type="text"
                    name="accountPassword"
                    required
                    minLength={4}
                    className="glass-input"
                    placeholder="Account password"
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
                  {isPending ? "Submitting..." : "Submit Account"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Your Submissions ({submissions.length})
            </h2>
            {submissions.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">
                You haven&apos;t submitted any accounts yet.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => (
                  <div key={s.id} className="glass-panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-sm text-white">{s.gmail}</p>
                      <span
                        className={
                          s.status === "SOLD"
                            ? "badge-approved"
                            : s.status === "REJECTED"
                            ? "badge-rejected"
                            : "badge-pending"
                        }
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Rate Earned: Rs. {s.rateAtEntry.toFixed(2)}</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    {s.status === "REJECTED" && s.rejectionReason && (
                      <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        Reason: {s.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "referrals" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="glass-panel p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Your Referral Link</h2>
              <p className="mb-4 text-xs text-slate-400">
                Share this link. When someone registers as a Worker through it, they become your
                referral and you earn {referralCommission}% commission.
              </p>
              <div className="mb-3 break-all rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-galaxy-accent2">
                {referralLink || "Loading..."}
              </div>
              <button onClick={copyReferralLink} className="btn-primary w-full">
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Workers You Referred ({referrals.length})
            </h2>
            {referrals.length === 0 ? (
              <p className="glass-panel p-6 text-sm text-slate-400">
                You haven&apos;t referred anyone yet. Share your link to start earning!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Worker ID</th>
                      <th>Name</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="font-mono text-galaxy-accent2">{r.displayId}</td>
                        <td>{r.name}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "payouts" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Payout History ({payoutProofs.length})
          </h2>
          {payoutProofs.length === 0 ? (
            <p className="glass-panel p-6 text-sm text-slate-400">
              No payouts received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payoutProofs.map((p) => (
                <div key={p.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-emerald-400">Rs. {p.amount.toFixed(2)}</p>
                    {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                    <p className="text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={p.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary !px-4 !py-2 text-sm"
                  >
                    View Proof
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "payment" && (
        <div className="max-w-md">
          <div className="glass-panel p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Your Payment Details</h2>
            <p className="mb-4 text-xs text-slate-400">
              Enter your Bank Account or Binance ID. This is only visible to the Admin, who uses
              it to pay your earnings.
            </p>
            <form action={handlePaymentDetailsSubmit} className="space-y-4">
              <textarea
                name="paymentDetails"
                required
                rows={5}
                defaultValue={worker?.paymentDetails ?? ""}
                className="glass-input resize-none"
                placeholder={"Bank: Sampath Bank\nAcc No: 001234567890\nName: John Doe\n\nOR\n\nBinance ID: 123456789"}
              />

              {paymentMessage && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    paymentIsError
                      ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {paymentMessage}
                </div>
              )}

              <button type="submit" disabled={isPaymentPending} className="btn-primary w-full">
                {isPaymentPending ? "Saving..." : "Save Payment Details"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
