"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function CreemCheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "monthly";

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const priceLabel = plan === "pro" 
    ? (billing === "yearly" ? "$249/yr" : "$24.99/mo")
    : (billing === "yearly" ? "$149/yr" : "$14.99/mo");

  const planName = plan === "pro" ? "Pro Circle" : "Essential Solo";

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Notify parent window (iframe communication)
      if (window.parent) {
        window.parent.postMessage({ type: "CREEM_PAYMENT_SUCCESS" }, "*");
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#2c3e50] p-6 font-sans flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden">
        {/* Creem.io Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded bg-[#10b981] flex items-center justify-center font-bold text-sm text-white">c</span>
            <span className="font-semibold tracking-tight text-sm">creem<span className="text-[#a1a1aa]">.io</span></span>
          </div>
          <span className="text-xs bg-[#334155] px-2 py-0.5 rounded text-[#cbd5e1] font-mono uppercase tracking-wider">Test Mode</span>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-5 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{planName} Subscription</h3>
              <p className="text-xs text-slate-500 mt-0.5">Billed {billing === "yearly" ? "annually" : "monthly"}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{priceLabel.split("/")[0]}</span>
              <span className="text-xs text-slate-500 block">/ {priceLabel.split("/")[1]}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePay} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
            <input
              type="text"
              required
              placeholder="Maria Delgado"
              className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Card Number</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={19}
                placeholder="4111 2222 3333 4444"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg pl-3.5 pr-10 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = val.replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(formatted);
                }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold uppercase font-mono">Visa</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="MM/YY"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={expiry}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  const formatted = val.length > 2 ? val.slice(0, 2) + "/" + val.slice(2) : val;
                  setExpiry(formatted);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CVC</label>
              <input
                type="password"
                required
                maxLength={3}
                placeholder="123"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 px-4 rounded-lg font-semibold text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Securely...
              </>
            ) : success ? (
              "✓ Payment Approved"
            ) : (
              `Pay ${priceLabel.split("/")[0]} Securely`
            )}
          </button>
        </form>

        {/* Compliance Footer */}
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] text-center text-[10px] text-slate-400 leading-relaxed">
          Payments processed securely via <b>Creem.io</b>. <br />
          By subscribing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}

export default function CreemCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Checkout...</div>}>
      <CreemCheckoutContent />
    </Suspense>
  );
}
