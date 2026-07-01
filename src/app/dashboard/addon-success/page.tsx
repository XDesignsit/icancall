"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function AddonSuccessContent() {
  const searchParams = useSearchParams();
  const addon = searchParams.get("addon") ?? "";
  const qty = parseInt(searchParams.get("qty") ?? "1", 10);

  useEffect(() => {
    // window.opener is nulled by browsers after cross-origin navigation (Creem → back)
    // Use localStorage so the parent dashboard tab can detect the success
    localStorage.setItem("creem_addon_success", JSON.stringify({ addon, qty, ts: Date.now() }));
    // Still try postMessage in case opener is available
    try {
      if (window.opener) {
        window.opener.postMessage({ type: "CREEM_ADDON_SUCCESS", addon, qty }, window.location.origin);
      }
    } catch {}
    setTimeout(() => window.close(), 1200);
  }, [addon, qty]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-slate-700 font-semibold text-lg">Add-on purchased!</p>
        <p className="text-slate-500 text-sm mt-1">Updating your account…</p>
      </div>
    </div>
  );
}

export default function AddonSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading…</div>}>
      <AddonSuccessContent />
    </Suspense>
  );
}
