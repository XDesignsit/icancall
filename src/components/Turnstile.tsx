"use client";

import React, { useEffect, useRef } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenSentRef = useRef(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    // 1. Ensure the script is loaded
    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // 2. Poll/wait until turnstile is available in global scope, then render
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    // Emit a token (real or bypass) exactly once and record that we did, so the
    // fail-open fallback below can tell whether verification actually completed.
    const emit = (token: string) => {
      if (tokenSentRef.current) return;
      tokenSentRef.current = true;
      onVerifyRef.current(token);
    };

    const initialize = () => {
      const turnstile = window.turnstile;
      if (turnstile && containerRef.current) {
        clearInterval(interval);
        clearTimeout(timeout);
        
        // Clean up previous widget if it exists
        if (widgetIdRef.current) {
          try {
            turnstile.remove(widgetIdRef.current);
          } catch (e) {
            console.error("Error removing old Turnstile widget:", e);
          }
        }

        try {
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              tokenSentRef.current = true;
              onVerifyRef.current(token);
            },
            "error-callback": () => {
              onErrorRef.current?.();
              console.warn("Turnstile widget error callback triggered. Invoking fallback bypass.");
              emit("blocked_bypass");
            },
            "expired-callback": () => onExpireRef.current?.(),
          });
        } catch (err) {
          console.error("Error rendering Turnstile widget:", err);
          emit("blocked_bypass");
        }
      }
    };

    if (window.turnstile) {
      initialize();
    } else {
      interval = setInterval(initialize, 100);
      // Auto-bypass if Turnstile is blocked by adblockers after 2.5 seconds
      timeout = setTimeout(() => {
        clearInterval(interval);
        console.warn("Turnstile script failed to load (possibly blocked by content blocker). Invoking fallback bypass.");
        emit("blocked_bypass");
      }, 2500);
    }

    // General fail-open timer: if no token has been produced after 4.5 seconds,
    // bypass. Guard on the token, not on widgetIdRef — turnstile.render() sets
    // widgetIdRef synchronously, so a rendered-but-unsolved challenge would
    // otherwise leave the form's submit button disabled indefinitely.
    const fallbackTimer = setTimeout(() => {
      if (!tokenSentRef.current) {
        console.warn("Turnstile produced no token after 4.5 seconds. Invoking fallback bypass.");
        emit("blocked_bypass");
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(fallbackTimer);
      const turnstile = window.turnstile;
      if (turnstile && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors on unmount
        }
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="cf-turnstile" />;
}
