"use client";

import React, { useEffect, useRef } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

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
    
    const initialize = () => {
      const turnstile = (window as any).turnstile;
      if (turnstile && containerRef.current) {
        clearInterval(interval);
        
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
            callback: (token: string) => onVerifyRef.current(token),
            "error-callback": () => onErrorRef.current?.(),
            "expired-callback": () => onExpireRef.current?.(),
          });
        } catch (err) {
          console.error("Error rendering Turnstile widget:", err);
        }
      }
    };

    if ((window as any).turnstile) {
      initialize();
    } else {
      interval = setInterval(initialize, 100);
    }

    return () => {
      clearInterval(interval);
      const turnstile = (window as any).turnstile;
      if (turnstile && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors on unmount
        }
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="cf-turnstile" />;
}
