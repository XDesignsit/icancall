"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function CreemCheckoutContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {
    if (status === "success") {
      // Notify the opener (signup page) and close this popup
      if (window.opener) {
        window.opener.postMessage({ type: "CREEM_PAYMENT_SUCCESS" }, window.location.origin);
        setTimeout(() => window.close(), 800);
      }
    }
  }, [status]);

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-slate-700 font-semibold text-lg">Payment successful!</p>
          <p className="text-slate-500 text-sm mt-1">Finishing up your account…</p>
        </div>
      </div>
    );
  }

  if (status === "cancel") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-700 font-semibold text-lg">Checkout cancelled.</p>
          <p className="text-slate-500 text-sm mt-1">You can close this and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Loading checkout…</p>
    </div>
  );
}

export default function CreemCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading…</div>}>
      <CreemCheckoutContent />
    </Suspense>
  );
}
