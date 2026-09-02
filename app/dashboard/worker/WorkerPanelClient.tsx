"use client";

import { useState, useTransition, useRef } from "react";
import { submitGmailAccount, updateWorkerPaymentDetails } from "@/app/actions/workerActions";

type Worker = {
  id: string;
  name: string;
  balance: number;
  workerCode: string | null;
  paymentDetails: string | null;
} | null;

type Submission = {
  id: string;
  gmail: string;
  status: string;
  rateAtEntry: number;
  createdAt: string;
};

export default function WorkerPanelClient({
  initialWorker,
  initialSubmissions,
  currentRate
}: {
  initialWorker: Worker;
  initialSubmissions: Submission[];
  currentRate: number;
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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card text-center">
          <p className="text-sm text-slate-400">Current Balance</p>
          <p className="mt-1 text-4xl font-extrabold text-emerald-400">
            Rs. {worker?.balance.toFixed(2) ?? "0.00"}
          </p>
        </div>

        <div className="glass-card text-center">
          <p className="text-sm text-slate-400">Current Task Rate</p>
          <p className="mt-1 text-2xl font-bold text-galaxy-accent2">
            Rs. {currentRate.toFixed(2)} <span className="text-sm text-slate-400">/ account</span>
          </p>
        </div>

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

        <div className="glass-panel p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Your Payment Details</h2>
          <p className="mb-4 text-xs text-slate-400">
            Enter your Bank Account or Binance ID. This is only visible to the Admin, who uses it
            to pay your earnings.
          </p>
          <form action={handlePaymentDetailsSubmit} className="space-y-4">
            <div>
              <textarea
                name="paymentDetails"
                required
                rows={4}
                defaultValue={worker?.paymentDetails ?? ""}
                className="glass-input resize-none"
                placeholder={"Bank: Sampath Bank\nAcc No: 001234567890\nName: John Doe\n\nOR\n\nBinance ID: 123456789"}
              />
            </div>

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

            <button type="submit" disabled={isPaymentPending} className="btn-secondary w-full">
              {isPaymentPending ? "Saving..." : "Save Payment Details"}
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
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Gmail</th>
                  <th>Status</th>
                  <th>Rate Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-sm">{s.gmail}</td>
                    <td>
                      <span className={s.status === "SOLD" ? "badge-approved" : "badge-pending"}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-emerald-400">Rs. {s.rateAtEntry.toFixed(2)}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
