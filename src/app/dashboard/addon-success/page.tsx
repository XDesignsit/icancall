"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AddonSuccessContent() {
  const searchParams = useSearchParams();
  const addon = searchParams.get("addon") ?? "";
  const qty = parseInt(searchParams.get("qty") ?? "1", 10);

  useEffect(() => {
    const payload = JSON.stringify({ addon, qty, ts: Date.now() });

    // 1. BroadcastChannel — most reliable for same-origin cross-window messaging
    try {
      const bc = new BroadcastChannel("creem_addon");
      bc.postMessage({ type: "CREEM_ADDON_SUCCESS", addon, qty });
      bc.close();
    } catch {}

    // 2. localStorage — fallback for browsers without BroadcastChannel
    try {
      localStorage.setItem("creem_addon_success", payload);
    } catch {}

    // 3. postMessage to opener — fallback if opener still exists
    try {
      if (window.opener) {
        window.opener.postMessage({ type: "CREEM_ADDON_SUCCESS", addon, qty }, window.location.origin);
      }
    } catch {}

    setTimeout(() => { try { window.close(); } catch {} }, 1500);
  }, [addon, qty]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-6">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-slate-700 font-semibold text-lg">Payment successful!</p>
        <p className="text-slate-500 text-sm mt-1">Updating your account… this window will close shortly.</p>
      </div>
    </div>
  );
}

export default function AddonSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Processing…</div>}>
      <AddonSuccessContent />
    </Suspense>
  );
}
