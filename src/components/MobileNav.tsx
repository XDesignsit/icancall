"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { HomepageTranslations } from "@/lib/translations";

// Native names rather than flags: the panel has room for them, and the site's
// styling rules keep emoji out of new UI.
const LANGUAGES = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["ja", "日本語"],
  ["zh", "中文"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
  ["pt", "Português"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["ko", "한국어"],
] as const;

export type MobileNavLang = (typeof LANGUAGES)[number][0];

interface MobileNavProps {
  t: HomepageTranslations["nav"];
  lang: MobileNavLang;
  onLangChange: (lang: MobileNavLang) => void;
}

/**
 * Hamburger button plus the drop-down panel it opens, for the marketing
 * header below the 880px breakpoint where the inline nav is hidden. Render it
 * as the last child of `.header-inner`; the panel positions itself against the
 * sticky `.header`.
 */
export default function MobileNav({ t, lang, onLangChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // The button disappears above the breakpoint, so a panel left open across
    // a rotate or resize would have no way to be closed.
    const desktop = window.matchMedia("(min-width: 881px)");
    const handleDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    desktop.addEventListener("change", handleDesktop);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
      desktop.removeEventListener("change", handleDesktop);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="mobile-nav" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="nav-toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      <div id={panelId} className="mobile-nav-panel" hidden={!open}>
        <nav className="wrap mobile-nav-links" aria-label="Menu">
          <Link href="/#how" onClick={close}>{t.how}</Link>
          <Link href="/#features" onClick={close}>{t.features}</Link>
          <Link href="/#usecases" onClick={close}>{t.who}</Link>
          <Link href="/#pricing" onClick={close}>{t.pricing}</Link>
          <Link href="/#faq" onClick={close}>{t.faq}</Link>
          <a className="mobile-nav-login" href="/login" onClick={close}>{t.login}</a>
          <select
            className="mobile-nav-lang"
            aria-label="Language"
            value={lang}
            onChange={(e) => onLangChange(e.target.value as MobileNavLang)}
          >
            {LANGUAGES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </nav>
      </div>
    </div>
  );
}
