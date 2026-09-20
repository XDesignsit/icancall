"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AddonSuccessContent() {
  const searchParams = useSearchParams();
  const addon = searchParams.get("addon") ?? "";
  const qty = parseInt(searchParams.get("qty") ?? "1", 10);
  // Creem appends checkout_id to the return URL.
  const checkoutId = searchParams.get("checkout_id") ?? "";

  useEffect(() => {
    // Popup blocked: the checkout ran in the dashboard's own tab, so there is
    // no dashboard left open to confirm the purchase. Confirm it here (the
    // server verifies it with Creem) and go back to the account page.
    if (!window.opener) {
      fetch("/api/creem/confirm-addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId, addon, quantity: qty }),
      })
        .then((res) => res.ok)
        .catch(() => false)
        // addon_paid: the dashboard may now add the numbers picked before paying.
        .then((paid) => { window.location.replace(`/dashboard?view=account&tab=billing${paid ? "&addon_paid=1" : ""}`); });
      return;
    }

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
  }, [addon, qty, checkoutId]);

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
