export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Account Supplier - Platform Guidelines</h1>
      
      <section className="mb-8 border-b border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-green-400 mb-3">🛡️ What is Account Supplier?</h2>
        <p className="text-gray-300 leading-relaxed">
          Account Supplier is a trusted intermediary platform connecting micro-workers and buyers worldwide. 
          We facilitate secure account generation, strict manual quality control, and verified transaction logging.
        </p>
      </section>

      <section className="mb-8 border-b border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-yellow-400 mb-3">📧 Gmail Account Usage & Security</h2>
        <p className="text-gray-300 mb-3">Buyers purchase verified Gmail accounts primarily for legitimate operational needs:</p>
        <ul className="list-disc pl-6 text-gray-400 space-y-2">
          <li><strong>Digital Marketing & Outreach:</strong> Running large-scale email campaigns without flagging main business domains.</li>
          <li><strong>App Testing & QA:</strong> Software developers testing app sign-ups, multi-user edge cases, and social logins.</li>
          <li><strong>E-commerce Operations:</strong> Managing multiple vendor platforms, store management, and customer support channels.</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">
          * Note: All accounts undergo double-verification (Worker Submission ➔ Buyer Review ➔ Payment Release) ensuring 100% active status.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-purple-400 mb-3">🔐 KYC Verification Usage</h2>
        <p className="text-gray-300 mb-3">KYC (Know Your Customer) account verification protocols serve critical functions:</p>
        <ul className="list-disc pl-6 text-gray-400 space-y-2">
          <li><strong>Identity Compliance:</strong> Ensuring accounts meet global financial and platform compliance regulations.</li>
          <li><strong>Fraud Prevention:</strong> Preventing automated bot creation, fake identities, and malicious activities.</li>
          <li><strong>Platform Trust:</strong> Buyers can safely trade with workers whose identity integrity is validated.</li>
        </ul>
      </section>
    </div>
  );
}
