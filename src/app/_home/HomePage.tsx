"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { HomepageTranslations } from "@/lib/translations";
import type { HomeTranslations } from "@/lib/translations/home/types";
import enBase from "@/lib/translations/en";
import enHome from "@/lib/translations/home/en";
import IconSprite from "./IconSprite";
import HomeV2, { LANGS, type Lang } from "./HomeV2";
import "./home-base.css";
import "./home-story.css";
import "./home-sim.css";
import "./home-sections.css";

// Motion mode lives on the .hp-page wrapper: .m (full) or .rm (reduced, from
// prefers-reduced-motion or ?motion=reduced), plus .no-sda where scroll-driven
// animations are unsupported (IntersectionObserver fallbacks take over). It has
// to be set before first paint, so an inline script sets it during parsing and
// the layout effect below re-applies it when the page mounts client-side.
// Keep the two in sync.
const BOOT =
  "<script>(function(){var r=document.currentScript.closest('.hp-page'),q=new URLSearchParams(location.search);" +
  "var rm=q.get('motion')==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches;" +
  "r.classList.add(rm?'rm':'m');" +
  "if(!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline','view()')))r.classList.add('no-sda');})();</script>";

function applyMotion(r: HTMLElement) {
  const q = new URLSearchParams(location.search);
  const rm = q.get("motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  r.classList.add(rm ? "rm" : "m");
  if (!(window.CSS && CSS.supports && CSS.supports("animation-timeline", "view()"))) r.classList.add("no-sda");
}

const isLang = (v: string | null): v is Lang => LANGS.some(([code]) => code === v);

interface Dict {
  lang: Lang;
  t: HomeTranslations;
  base: HomepageTranslations;
}

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  // English is imported statically so the server renders the full page for
  // crawlers; a saved language loads and swaps in after hydration.
  const [dict, setDict] = useState<Dict>({ lang: "en", t: enHome, base: enBase });
  const pending = useRef<Lang>("en");

  const load = useCallback(async (lang: Lang) => {
    pending.current = lang;
    const next: Dict =
      lang === "en"
        ? { lang, t: enHome, base: enBase }
        : {
            lang,
            t: (await import(`@/lib/translations/home/${lang}`)).default,
            base: (await import(`@/lib/translations/${lang}`)).default,
          };
    if (pending.current === lang) setDict(next);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (isLang(saved) && saved !== "en") load(saved);
  }, [load]);

  const changeLanguage = useCallback(
    (lang: Lang) => {
      localStorage.setItem("lang", lang);
      window.dispatchEvent(new Event("storage"));
      load(lang);
    },
    [load],
  );

  useLayoutEffect(() => {
    if (rootRef.current) applyMotion(rootRef.current);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = dict.lang;
    document.documentElement.dir = dict.lang === "ar" ? "rtl" : "ltr";
  }, [dict.lang]);

  return (
    // The classes added by BOOT before hydration are expected to differ.
    <div className="hp-page" ref={rootRef} suppressHydrationWarning>
      {/* Injected as markup so it runs while the server HTML is parsed; React
          never creates a <script> element itself (which it can't execute). */}
      <div hidden dangerouslySetInnerHTML={{ __html: BOOT }} />
      <IconSprite />
      <HomeV2 key={dict.lang} t={dict.t} base={dict.base} lang={dict.lang} onLang={changeLanguage} root={rootRef} />
    </div>
  );
}
