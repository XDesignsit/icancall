"use client";

import React, { useEffect } from "react";
import type { HomepageTranslations } from "@/lib/translations";
import type { HomeTranslations } from "@/lib/translations/home/types";
import { ADDON_PRICING, PLAN_PRICING } from "@/lib/pricing";
import { planFeatures, type MarketingPlanId } from "@/lib/planFeatures";
import { initHome } from "./controller";
import { Icon, WaveBars, fill, rich, vars } from "./text";

export const LANGS = [
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
export type Lang = (typeof LANGS)[number][0];

interface Props {
  t: HomeTranslations;
  /** The shared marketing dictionary: plan names, descriptions and feature lists. */
  base: HomepageTranslations;
  lang: Lang;
  onLang: (lang: Lang) => void;
  root: React.RefObject<HTMLDivElement | null>;
}

const NUMBER = (
  <>
    (415) 200-<em>CARE</em>
  </>
);

/** Mom's number typed in character by character on the hero note (--c staggers each one). */
const TYPED = "(415) 200-CARE".split("");

/** The contact list that collapses into the note on desktop. Decorative, so it stays in English. */
const CONTACT_ROWS: [string, string?][] = [
  ["A"], ["Aaron (work)", "AW"], ["Abuela Sofia", "AS"], ["Alex Plumber", "AP"],
  ["B"], ["Ben's school", "BS"],
  ["D"], ["Dan Neighbor", "DN"], ["Dr. Patel", "DP"],
  ["G"], ["Grandpa Lou", "GL"],
  ["J"], ["Joseph", "J"], ["Joseph (work)", "JW"],
  ["M"], ["Mama", "M"], ["Maria", "M"], ["Maria C.", "MC"], ["Mr. Kim", "MK"],
  ["P"], ["Pharmacy", "P"],
  ["R"], ["Rosa", "R"],
  ["S"], ["School office", "SO"],
];
const MORPH_ROWS = ["Aaron (work)", "Abuela Sofia", "Dr. Patel", "Joseph", "Joseph (work)", "Maria", "Maria C.", "Pharmacy"];

/** Positions of the four circle members around the number (percent of the stage). */
const SEATS = {
  m: { x: "86%", y: "29.17%", pos: "top" },
  j: { x: "86%", y: "70.83%", pos: "bot" },
  r: { x: "14%", y: "70.83%", pos: "bot" },
  d: { x: "14%", y: "29.17%", pos: "top" },
} as const;

/** The icon beside each plan's name on the pricing cards. */
const PLAN_ICONS: Record<MarketingPlanId, string> = { essential: "i-phone", pro: "i-in", careteam: "i-circle" };

/** The sign-in code typed into the trust section's two-step card (not the demo PIN). */
const OTP_DIGITS = "482916";

/** When each of the guarantee dial's 30 ticks lights: in step with its 1.5s ease-out
    (cubic) fill that starts at 0.3s, so the ticks keep pace with the arc and the count. */
const TICK_DELAYS = Array.from({ length: 30 }, (_, k) => `${(0.3 + 1.5 * (1 - Math.cbrt(1 - (k + 1) / 30))).toFixed(3)}s`);

const THREADS = {
  m: "M300 300 C 400 300 440 175 516 175",
  j: "M300 300 C 400 300 440 425 516 425",
  r: "M300 300 C 200 300 160 425 84 425",
  d: "M300 300 C 200 300 160 175 84 175",
} as const;

function LangSelect({ t, lang, onLang }: Pick<Props, "t" | "lang" | "onLang">) {
  return (
    <label className="hp-lang">
      <Icon id="i-globe" />
      <select
        className="hp-lang-sel"
        aria-label={t.nav.language}
        value={lang}
        onChange={(e) => onLang(e.target.value as Lang)}
      >
        {LANGS.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <Icon id="i-chev-d" className="i hp-lang-chev" />
    </label>
  );
}

function HomeV2({ t, base, lang, onLang, root }: Props) {
  useEffect(() => {
    if (!root.current) return;
    return initHome(root.current, { t, lang, billedMonthly: base.ui.billedMonthlyCancelAnytime });
  }, [t, base, lang, root]);

  const fromPrice = rich(t.hero.fromPrice, "price", <b className="mono">{PLAN_PRICING.essential.monthlyLabel}</b>);
  const who = { m: ["Maria", t.rel.daughter], j: ["Joseph", t.rel.son], r: ["Rosa", t.rel.grandma], d: ["Dan", t.rel.neighbor] } as const;

  const feats = planFeatures(base);
  const plans: { id: MarketingPlanId; title: string; tag: string; noteAnnual: string; cta: string }[] = [
    {
      id: "essential",
      title: base.pricing.essentialTitle,
      tag: base.pricing.essentialDesc,
      noteAnnual: base.ui.justPriceAnnualEssential,
      cta: t.pricing.choose.essential,
    },
    {
      id: "pro",
      title: base.pricing.proTitle,
      tag: base.pricing.proDesc,
      noteAnnual: base.ui.justPriceAnnualPro,
      cta: t.pricing.choose.pro,
    },
    {
      id: "careteam",
      title: base.pricing.careteamTitle,
      tag: base.pricing.careteamDesc,
      noteAnnual: base.ui.justPriceAnnualCareteam,
      cta: t.pricing.choose.careteam,
    },
  ];

  const more = t.pricing.more.split(/(\{numberPrice\}|\{minutesPrice\})/).map((part, i) =>
    part === "{numberPrice}" ? (
      <span key={i} className="mono">{ADDON_PRICING.extraNumberLabel}</span>
    ) : part === "{minutesPrice}" ? (
      <span key={i} className="mono">{ADDON_PRICING.extraMinutesLabel}</span>
    ) : (
      part
    ),
  );

  return (
    <>
      <a className="hp-skip" href="#main">
        {t.skip}
      </a>

      {/* ============ HEADER ============ */}
      <header className="header hp-header" id="header">
        <div className="wrap header-inner">
          <a className="brand" href="#top" aria-label={t.nav.home}>
            <svg className="hp-logo" viewBox="0 0 800 154.5652" aria-hidden="true">
              <use href="#logo" />
            </svg>
          </a>
          <nav className="nav" aria-label={t.nav.primary}>
            <a href="#how">{t.nav.how}</a>
            <a href="#usecases">{t.nav.who}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#faq">{t.nav.faq}</a>
          </nav>
          <div className="header-cta">
            <LangSelect t={t} lang={lang} onLang={onLang} />
            <a className="btn btn-text" href="/login">
              {t.nav.login}
            </a>
            <a className="btn btn-primary" href="#pricing">
              {t.nav.getStarted}
            </a>
            <button className="hp-menu-btn" type="button" aria-expanded="false" aria-controls="hp-sheet" aria-label={t.nav.menu}>
              <Icon id="i-menu" className="i i-open" />
              <Icon id="i-x" className="i i-close" />
            </button>
          </div>
        </div>
        <div className="hp-sheet" id="hp-sheet">
          <nav aria-label={t.nav.mobile}>
            <a href="#how">{t.nav.how}</a>
            <a href="#usecases">{t.nav.who}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#faq">{t.nav.faq}</a>
          </nav>
          <div className="hp-sheet-row">
            <LangSelect t={t} lang={lang} onLang={onLang} />
            <a className="btn btn-ghost" href="/login">
              {t.nav.login}
            </a>
          </div>
          <div className="hp-sheet-row">
            <a className="btn btn-primary btn-lg" href="#pricing">
              {t.nav.getStarted}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ============ HERO + PROBLEM ============ */}
        <div className="hp-duo" id="top">
          <div className="wrap hp-duo-grid">
            <section className="hp-hero" id="hero" aria-labelledby="hero-title">
              <span className="eyebrow">{t.hero.eyebrow}</span>
              <h1 className="hp-h1" id="hero-title">
                {t.hero.titleStart}
                <span className="accent">{t.hero.titleAccent}</span>
              </h1>
              <p className="lead">{t.hero.lead}</p>
              <div className="hp-ctas">
                <a className="btn btn-primary btn-lg" href="#pricing">
                  {t.nav.getStarted}
                </a>
                <a className="btn btn-ghost btn-lg" href="#how">
                  <Icon id="i-arrow-d" />
                  {t.hero.seeHow}
                </a>
              </div>
              <p className="hp-trustline">
                <span>{fromPrice}</span>
                <span className="sep" aria-hidden="true">·</span>
                <span>{t.hero.guarantee}</span>
                <span className="sep" aria-hidden="true">·</span>
                <span>{t.hero.noContracts}</span>
              </p>
            </section>

            <div className="hp-duo-vis">
              <div className="hp-duo-stick">
                <div className="hp-stage is-intro" id="hero-stage" role="img" aria-label={t.hero.stageLabel}>
                  <div className="hp-orbit">
                    <svg className="hp-svg" viewBox="0 0 600 600" aria-hidden="true">
                      <circle className="orb" cx="300" cy="300" r="250" />
                      <circle className="orb2" cx="300" cy="300" r="186" />
                      <path className="thr" d={THREADS.m} />
                      <path className="thr" d={THREADS.j} />
                      <path className="thr" d={THREADS.r} />
                      <path className="thr" d={THREADS.d} />
                      <path className="hot m1" d={THREADS.m} />
                      <path className="hot j1" d={THREADS.j} />
                      <path className="hot g" d={THREADS.j} />
                      <circle className="pk m1" r="5.5" />
                      <circle className="pk j1" r="5.5" />
                    </svg>
                    <span className="hp-pulse" />
                    <span className="hp-pulse p2" />
                    <div className="hp-av a-m top is-miss" style={vars({ "--x": SEATS.m.x, "--y": SEATS.m.y, "--i": 0 })}>
                      <span className="av">M</span>
                      <span className="lbl">
                        <b>Maria</b>
                        <span className="rel">{t.rel.daughter}</span>
                        <span className="badge badge-gray">{t.hero.noAnswer}</span>
                      </span>
                    </div>
                    <div className="hp-av a-j bot is-conn" style={vars({ "--x": SEATS.j.x, "--y": SEATS.j.y, "--i": 1 })}>
                      <span className="av">
                        J<i className="br" />
                      </span>
                      <span className="lbl">
                        <b>Joseph</b>
                        <span className="rel">{t.rel.son}</span>
                        <span className="badge badge-green">
                          <i className="d" />
                          {t.hero.connected} · <span className="mono">0:04</span>
                        </span>
                      </span>
                    </div>
                    <div className="hp-av a-r bot" style={vars({ "--x": SEATS.r.x, "--y": SEATS.r.y, "--i": 2 })}>
                      <span className="av">R</span>
                      <span className="lbl">
                        <b>Rosa</b>
                        <span className="rel">{t.rel.grandma}</span>
                      </span>
                    </div>
                    <div className="hp-av a-d top" style={vars({ "--x": SEATS.d.x, "--y": SEATS.d.y, "--i": 3 })}>
                      <span className="av">D</span>
                      <span className="lbl">
                        <b>Dan</b>
                        <span className="rel">{t.rel.neighbor}</span>
                      </span>
                    </div>
                  </div>
                  <div className="hp-note-w">
                    <div className="hp-note">
                      <span className="hp-magnet" />
                      <span className="hp-note-lbl">{t.hero.noteLabel}</span>
                      <span className="hp-num">
                        {TYPED.map((c, i) => (
                          <span key={i} className={i >= 10 ? "v" : undefined} style={vars({ "--c": i })}>
                            {c}
                          </span>
                        ))}
                      </span>
                      <span className="hp-note-foot">
                        <span className="devs">
                          <Icon id="i-landline" />
                          <Icon id="i-flip" />
                          <Icon id="i-smart" />
                        </span>
                        {t.hero.worksOnAnyPhone}
                      </span>
                    </div>
                  </div>
                  <div className="hp-list">
                    <div className="hp-list-head">
                      <b>{t.hero.contacts}</b>
                      <span className="hp-list-search">
                        <Icon id="i-search" />
                        {t.hero.searchContacts}
                      </span>
                    </div>
                    <div className="hp-list-view">
                      <ul className="hp-list-rows">
                        {CONTACT_ROWS.map(([name, ini]) =>
                          ini ? (
                            <li key={name}>
                              <i>{ini}</i>
                              {name}
                            </li>
                          ) : (
                            <li key={name} className="lh">
                              {name}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                <button className="hp-stage-ctl" type="button" aria-label={t.hero.pause} data-state="play">
                  <Icon id="i-pause" />
                </button>
              </div>
            </div>

            <section className="hp-problem" id="problem" aria-labelledby="problem-title">
              <div className="hp-prob-in">
                <h2 className="hp-h2" id="problem-title">
                  {t.problem.titleStart}
                  <span className="accent">{t.problem.titleAccent}</span>
                </h2>
                <p className="hp-lines">
                  <span className="ln">{t.problem.lines[0]}</span> <span className="ln">{t.problem.lines[1]}</span>{" "}
                  <span className="ln">{t.problem.lines[2]}</span>
                </p>
              </div>
              <figure className="hp-mmorph" aria-hidden="true">
                <ul className="hp-mm-list">
                  {MORPH_ROWS.map((name) => (
                    <li key={name}>
                      <i />
                      {name}
                    </li>
                  ))}
                </ul>
                <Icon id="i-arrow-r" className="i hp-mm-arrow" />
                <div className="hp-mm-card">
                  <span className="hp-magnet" />
                  <span>{t.hero.noteLabel}</span>
                  <b>{NUMBER}</b>
                </div>
              </figure>
            </section>
          </div>
        </div>

        {/* ============ HOW IT WORKS (scroll story) ============ */}
        <section className="hp-story hp-dark" id="how" aria-labelledby="how-title">
          <div className="hp-story-track">
            <div className="hp-story-pin">
              <div className="wrap">
                <div className="hp-story-grid">
                  <div className="hp-story-copy">
                    <div className="hp-story-head">
                      <span className="eyebrow">{t.how.eyebrow}</span>
                      <h2 className="hp-h2" id="how-title">
                        {t.how.title}
                      </h2>
                    </div>
                    <div className="hp-rail" role="group" aria-label={t.how.railLabel}>
                      <i />
                      {t.how.steps.map((s, i) => (
                        <button key={i} type="button" data-go={i} aria-label={s.aria}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <ol className="hp-steps">
                      {t.how.steps.map((s, i) => (
                        <li key={i} className="st" data-step={i + 1}>
                          <div className="st-txt">
                            <span className="st-n">0{i + 1}</span>
                            <h3>{s.title}</h3>
                            <p>{s.body}</p>
                          </div>
                          <div className="st-ill" aria-hidden="true">
                            {i === 0 && (
                              <div className="ill-dial">
                                <div className="ill-devs">
                                  <span><Icon id="i-landline" /></span>
                                  <span><Icon id="i-flip" /></span>
                                  <span><Icon id="i-smart" /></span>
                                </div>
                                <span className="ill-numchip">(415) 200-CARE</span>
                              </div>
                            )}
                            {i === 1 && (
                              <div className="ill-greet">
                                <div className="ill-bubble">
                                  <Icon id="i-wave" />
                                  <span className="dk-wave"><WaveBars n={18} /></span>
                                  <span className="dk-key">1</span>
                                </div>
                                <p className="ill-quote">“{t.how.greeting}”</p>
                              </div>
                            )}
                            {i === 2 && (
                              <div className="ill-row">
                                <div className="dk-av is-miss">
                                  <span className="av">M</span>
                                  <b>Maria</b>
                                  <span className="dk-pill">{t.how.pill.noAnswer}</span>
                                </div>
                                <Icon id="i-arrow-r" />
                                <div className="dk-av is-ring">
                                  <span className="av">J</span>
                                  <b>Joseph</b>
                                  <span className="dk-pill ring">
                                    <i className="d" />
                                    {t.how.pill.ringing}
                                  </span>
                                </div>
                              </div>
                            )}
                            {i === 3 && (
                              <div className="dk-av is-conn" style={vars({ "--avs": "72px" })}>
                                <span className="av">J</span>
                                <b>Joseph</b>
                                <span className="dk-pill conn">
                                  <i className="d" />
                                  {t.how.pill.connected} · <span className="mono">0:04</span>
                                </span>
                              </div>
                            )}
                            {i === 4 && (
                              <div className="ill-vm dk-tx">
                                <div className="dk-tx-h">
                                  <span>{t.how.voicemailFrom}</span>
                                  <span className="mono">0:18</span>
                                </div>
                                <p>{t.how.transcript}</p>
                                <div className="dk-tx-f">
                                  <span><Icon id="i-mail" />{t.how.sentByEmail}</span>
                                  <span><Icon id="i-msg" />{t.how.sentByText}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="hp-sv-wrap" aria-hidden="true">
                    <div className="sv" data-step="1" data-dev="land">
                      <div className="sv-glow" />
                      <svg className="sv-svg" viewBox="0 0 600 600">
                        <circle className="orb" cx="300" cy="300" r="250" />
                        <circle className="orb2" cx="300" cy="300" r="186" />
                        {(["m", "j", "r", "d"] as const).map((k) => (
                          <path key={k} className="thr" data-k={k} d={THREADS[k]} />
                        ))}
                        <path className="hot" data-k="m" d={THREADS.m} />
                        <path className="hot" data-k="j" d={THREADS.j} />
                        <path className="hot g" data-k="j" d={THREADS.j} />
                        <circle className="pk" data-k="m" r="6" />
                        <circle className="pk" data-k="j" r="6" />
                      </svg>
                      <span className="sv-ring" />
                      <span className="sv-ring" />
                      <div className="sv-caller">
                        <span className="sv-dev">
                          <Icon id="i-landline" className="i d-land" />
                          <Icon id="i-flip" className="i d-flip" />
                          <Icon id="i-smart" className="i d-smart" />
                        </span>
                        <b>{t.how.caller}</b>
                        <span className="sv-devname">{t.how.devices.land}</span>
                        <span className="sv-no">(415) 200-CARE</span>
                      </div>
                      {(["m", "j", "r", "d"] as const).map((k) => (
                        <div key={k} className={`sv-av ${SEATS[k].pos}`} data-k={k} style={vars({ "--x": SEATS[k].x, "--y": SEATS[k].y })}>
                          <div className="dk-av">
                            <span className="av">
                              {who[k][0][0]}
                              <span className="rp" />
                            </span>
                            <div>
                              <b>{who[k][0]}</b>
                              <span className="rel">{who[k][1]}</span>
                            </div>
                            <span className="dk-pill">{k === "j" ? t.how.pill.ringing : t.how.pill.noAnswer}</span>
                          </div>
                        </div>
                      ))}
                      <div className="sv-greet">
                        <div className="ill-bubble">
                          <Icon id="i-wave" />
                          <span className="dk-wave sv-wv"><WaveBars n={18} /></span>
                          <span className="dk-key">1</span>
                        </div>
                        <q>{t.how.greeting}</q>
                      </div>
                      <div className="sv-rec">
                        <span className="dot" />
                        {t.how.recording}
                        <span className="dk-wave sv-wv2"><WaveBars n={12} /></span>
                      </div>
                      <div className="sv-vm">
                        <div className="dk-tx">
                          <div className="dk-tx-h">
                            <span>{t.how.voicemailFrom}</span>
                            <span className="mono">0:18</span>
                          </div>
                          <p />
                          <div className="dk-tx-f">
                            <span><Icon id="i-mail" />{t.how.sentByEmail}</span>
                            <span><Icon id="i-msg" />{t.how.sentByText}</span>
                          </div>
                        </div>
                      </div>
                      <div className="sv-timer">
                        <span>{t.how.status.dialing}</span>
                        <b>0:00</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SETUP ============ */}
        <section className="section hp-setup" id="setup" aria-labelledby="setup-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="hp-h2" id="setup-title">{t.setup.title}</h2>
              <p className="lead">{t.setup.lead}</p>
            </div>
            <div className="hp-s3-grid">
              <span className="hp-s3-line" aria-hidden="true" />
              <article className="hp-s3 rv" style={vars({ "--i": 0 })}>
                <span className="hp-s3-node" aria-hidden="true">01</span>
                <div className="hp-s3-ill" aria-hidden="true">
                  <div className="hp-s3-nums">
                    <div className="num-opt sel">
                      <span className="tick">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 13 4 4L19 7" /></svg>
                      </span>
                      <span className="nlabel">
                        <span className="nnum">(415) 200-CARE</span>
                        <span className="memorable">{t.setup.spellsCare}</span>
                      </span>
                    </div>
                    <div className="num-opt">
                      <span className="tick">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 13 4 4L19 7" /></svg>
                      </span>
                      <span className="nlabel">
                        <span className="nnum">(415) 555-0199</span>
                        <span className="nmeta">{t.setup.localTo}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hp-s3-txt">
                  <h3>{t.setup.cards[0].title}</h3>
                  <p>{t.setup.cards[0].body}</p>
                </div>
              </article>
              <article className="hp-s3 rv" style={vars({ "--i": 1 })}>
                <span className="hp-s3-node" aria-hidden="true">02</span>
                <div className="hp-s3-ill" aria-hidden="true">
                  <div className="cp-slots">
                    <div className="cp-slot filled">
                      <span className="ava">M</span>
                      <span className="cp-who"><b>Maria</b><span>{t.rel.daughter}</span></span>
                      <span className="cp-order">{t.setup.first}</span>
                    </div>
                    <div className="cp-slot filled">
                      <span className="ava">J</span>
                      <span className="cp-who"><b>Joseph</b><span>{t.rel.son}</span></span>
                      <span className="cp-order">{t.setup.second}</span>
                    </div>
                    <div className="cp-slot">
                      <span className="ava empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </span>
                      {fill(t.setup.add, { name: "Rosa" })}
                    </div>
                  </div>
                </div>
                <div className="hp-s3-txt">
                  <h3>{t.setup.cards[1].title}</h3>
                  <p>{t.setup.cards[1].body}</p>
                </div>
              </article>
              <article className="hp-s3 rv" style={vars({ "--i": 2 })}>
                <span className="hp-s3-node" aria-hidden="true">03</span>
                <div className="hp-s3-ill" aria-hidden="true">
                  <div className="hp-s3-share">
                    <div className="hp-mm-card">
                      <span className="hp-magnet" />
                      <span>{t.hero.noteLabel}</span>
                      <b>{NUMBER}</b>
                    </div>
                    <div className="hp-s3-key">
                      <i>1</i>
                      {t.setup.speedDial}
                    </div>
                  </div>
                </div>
                <div className="hp-s3-txt">
                  <h3>{t.setup.cards[2].title}</h3>
                  <p>{t.setup.cards[2].body}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ TRY IT (simulator) ============ */}
        <section className="section hp-try hp-tint" id="try" aria-labelledby="try-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.try.eyebrow}</span>
              <h2 className="hp-h2" id="try-title">{t.try.title}</h2>
            </div>
            <div data-sim="">
              <div className="sim">
                <div className="sim-nojs">
                  <p><b>{t.try.noJsCircle}</b></p>
                  <ol>
                    <li>Maria · {t.rel.daughter}</li>
                    <li>Joseph · {t.rel.son}</li>
                    <li>Rosa · {t.rel.grandma}</li>
                  </ol>
                  <p>{t.try.noJsHint}</p>
                </div>
              </div>
            </div>
            <div className="hp-after-sim">
              <a className="btn btn-primary btn-lg" href="#pricing">{t.nav.getStarted}</a>
              <span>{fromPrice} · {t.hero.guarantee}</span>
            </div>
          </div>
        </section>

        {/* ============ WHO IT'S FOR ============ */}
        <section className="section hp-uses" id="usecases" aria-labelledby="uses-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.usecases.eyebrow}</span>
              <h2 className="hp-h2" id="uses-title">{t.usecases.title}</h2>
            </div>
            <div className="hp-stack">
              {[
                { id: "uc-kids", img: "/usecases/child-calling.png", href: "/parents" },
                { id: "uc-seniors", img: "/usecases/aging-parent.png", href: "/seniors" },
                { id: "uc-care", img: "/usecases/special-abilities.png", href: "/caregivers" },
              ].map((uc, i) => {
                const c = t.usecases.cards[i];
                return (
                  <article key={uc.id} className="hp-uc" style={vars({ "--i": i })} aria-labelledby={uc.id}>
                    <div className="hp-uc-in">
                      <div className="hp-uc-media">
                        <img src={uc.img} alt={c.alt} width={1024} height={1024} loading="lazy" decoding="async" />
                      </div>
                      <div className="hp-uc-body">
                        <span className="hp-uc-aud">{c.audience}</span>
                        <h3 id={uc.id}>{c.title}</h3>
                        <p>{c.body}</p>
                        <ul className="hp-chips" aria-label={t.usecases.moments}>
                          {c.chips.map((chip) => (
                            <li key={chip}>{chip}</li>
                          ))}
                        </ul>
                        <a className="hp-link" href={uc.href}>
                          {c.link}
                          <Icon id="i-arrow-r" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ FEATURES (bento) ============ */}
        <section className="section hp-feat hp-tint" id="features" aria-labelledby="feat-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.features.eyebrow}</span>
              <h2 className="hp-h2" id="feat-title">{t.features.title}</h2>
            </div>
            <div className="hp-bento">
              <article className="hp-tile t-phones rv" style={vars({ "--i": 0 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="hp-devs">
                    <div className="hp-dev" style={vars({ "--i": 0 })}>
                      <svg viewBox="0 0 120 170">
                        <ellipse className="glow" cx="60" cy="48" rx="30" ry="22" />
                        <rect x="38" y="8" width="44" height="126" rx="18" />
                        <path d="M52 21h16" />
                        <rect className="lit" x="46" y="32" width="28" height="22" rx="4" />
                        <rect x="46" y="32" width="28" height="22" rx="4" />
                        <path d="M50 70h.01M60 70h.01M70 70h.01M50 81h.01M60 81h.01M70 81h.01M50 92h.01M60 92h.01M70 92h.01M50 103h.01M60 103h.01M70 103h.01" style={{ strokeWidth: 3.4 }} />
                        <path d="M14 128h24v6a4 4 0 0 0 4 4h36a4 4 0 0 0 4-4v-6h24a8 8 0 0 1 8 8v16a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6v-16a8 8 0 0 1 8-8Z" />
                        <circle className="lit" cx="95" cy="148" r="3" />
                      </svg>
                      <span>{t.features.phones.landline}</span>
                    </div>
                    <div className="hp-dev" style={vars({ "--i": 1 })}>
                      <svg viewBox="0 0 120 170">
                        <ellipse className="glow" cx="60" cy="38" rx="30" ry="26" />
                        <rect x="34" y="6" width="52" height="70" rx="12" />
                        <path d="M54 11.5h12" />
                        <rect className="lit" x="42" y="18" width="36" height="46" rx="5" />
                        <rect x="42" y="18" width="36" height="46" rx="5" />
                        <rect x="40" y="76" width="40" height="8" rx="4" />
                        <rect x="30" y="84" width="60" height="80" rx="14" />
                        <rect x="48" y="94" width="24" height="14" rx="7" />
                        <path d="M45 122h.01M60 122h.01M75 122h.01M45 133h.01M60 133h.01M75 133h.01M45 144h.01M60 144h.01M75 144h.01M45 155h.01M60 155h.01M75 155h.01" style={{ strokeWidth: 3.4 }} />
                      </svg>
                      <span>{t.features.phones.flip}</span>
                    </div>
                    <div className="hp-dev" style={vars({ "--i": 2 })}>
                      <svg viewBox="0 0 120 170">
                        <ellipse className="glow" cx="60" cy="84" rx="34" ry="58" />
                        <rect x="30" y="4" width="60" height="162" rx="14" />
                        <rect className="lit" x="36" y="14" width="48" height="136" rx="8" />
                        <rect x="36" y="14" width="48" height="136" rx="8" />
                        <path d="M52 9h16M52 158h16" />
                        <circle cx="60" cy="120" r="9" />
                        <path d="M56.6 117.4h1.9l.9 2.4-1.2.9a6.8 6.8 0 0 0 3.8 3.8l.9-1.2 2.4.9v1.9" />
                      </svg>
                      <span>{t.features.phones.smart}</span>
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.phones.title}</h3>
                  <p>{t.features.phones.body}</p>
                </div>
              </article>

              <article className="hp-tile t-cascade rv" style={vars({ "--i": 1 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="admin">
                    <div className="hp-crows">
                      {[
                        { n: 1, ini: "MD", bg: "var(--blue)", name: "Maria Delgado", rel: t.rel.daughter, tel: "(415) 555‑0142", on: true },
                        { n: 2, ini: "JD", bg: "var(--teal-deep)", name: "Joseph Delgado", rel: t.rel.son, tel: "(415) 555‑0188", on: true },
                        { n: 3, ini: "RD", bg: "var(--blue-deep)", name: "Rosa Delgado", rel: t.rel.grandma, tel: "(415) 555‑0110", on: false },
                      ].map((r) => (
                        <div key={r.n} className={r.on ? "crow" : "crow dim"}>
                          <div className="pos"><span className="num">{r.n}</span></div>
                          <span className="ava" style={{ background: r.bg }}>{r.ini}</span>
                          <div className="info">
                            <b>{r.name}</b>
                            <div className="rel">{r.rel}</div>
                            <div className="tel">{r.tel}</div>
                          </div>
                          <div className="acts">
                            <span className={r.on ? "toggle on" : "toggle"}>
                              <span className="track" />
                              <span className="lbl">{r.on ? t.features.cascade.available : t.features.cascade.busy}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.cascade.title}</h3>
                  <p>{t.features.cascade.body}</p>
                </div>
              </article>

              <article className="hp-tile t-menu rv" style={vars({ "--i": 0 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="hp-kp">
                    <div className="hp-kp-bub">
                      <span>{t.features.menu.momHears}</span>
                      {t.features.menu.press}
                    </div>
                    <div className="hp-kp-keys">
                      {"123456789*0#".split("").map((k) => (
                        <b key={k} className={k === "1" ? "k1" : undefined}>{k}</b>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.menu.title}</h3>
                  <p>{t.features.menu.body}</p>
                </div>
              </article>

              <article className="hp-tile t-vm rv" style={vars({ "--i": 1 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="hp-vmcard">
                    <div className="dk-tx-h">
                      <span>{t.how.voicemailFrom}</span>
                      <span className="mono">0:18</span>
                    </div>
                    <p>
                      {t.features.voicemail.lines.map((line, i) => (
                        <span key={i} style={vars({ "--i": i })}>{line}</span>
                      ))}
                    </p>
                    <div className="dk-tx-f">
                      <span><Icon id="i-mail" />{t.how.sentByEmail}</span>
                      <span><Icon id="i-msg" />{t.how.sentByText}</span>
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.voicemail.title}</h3>
                  <p>{t.features.voicemail.body}</p>
                </div>
              </article>

              <article className="hp-tile t-voice rv" style={vars({ "--i": 2 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="hp-voice">
                    <div className="seg">
                      <span className="seg-btn active">{t.features.voice.natural}</span>
                      <span className="seg-btn">{t.features.voice.record}</span>
                    </div>
                    <div className="hp-voice-wave"><WaveBars n={26} /></div>
                    <div className="hp-voice-play">
                      <b><Icon id="i-play" /></b>
                      {t.features.voice.sample}
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.voice.title}</h3>
                  <p>{t.features.voice.body}</p>
                </div>
              </article>

              <article className="hp-tile t-dash rv" style={vars({ "--i": 0 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="admin hp-dash">
                    <div className="card">
                      <div className="card-head">
                        <div>
                          <h2>{t.features.dashboard.callLog}</h2>
                          <p>{t.features.dashboard.callLogSub}</p>
                        </div>
                      </div>
                      {[
                        { dir: "in", icon: "i-in", who: t.features.dashboard.answered, routed: "Joseph", dur: "2:14", when: "4:12 pm" },
                        { dir: "miss", icon: "i-miss", who: t.features.dashboard.movedOn, routed: "Maria", dur: "0:15", when: "4:12 pm" },
                        { dir: "vm", icon: "i-vm", who: t.features.dashboard.transcriptSent, routed: t.features.dashboard.voicemail, dur: "0:18", when: t.features.dashboard.yesterday },
                      ].map((row, i) => (
                        <div key={i} className="logrow" style={vars({ "--i": i })}>
                          <div className={`dir dir-${row.dir}`}><Icon id={row.icon} /></div>
                          <div className="who"><b>{t.how.caller}</b><span>(415) 200-CARE</span></div>
                          <div className="routed"><b>{row.routed}</b>{row.who}</div>
                          <div className="dur">{row.dur}</div>
                          <div className="when">{row.when}</div>
                        </div>
                      ))}
                    </div>
                    <div className="stats">
                      <div className="stat">
                        <div className="ic"><Icon id="i-phone" /></div>
                        <div className="val">11</div>
                        <div className="lbl">{t.features.dashboard.callsThisWeek}</div>
                      </div>
                      <div className="stat">
                        <div className="ic"><Icon id="i-circle" /></div>
                        <div className="val">{fill(t.features.dashboard.availableCount, { n: 3, total: 4 })}</div>
                        <div className="lbl">{t.features.dashboard.availableNow}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.dashboard.title}</h3>
                  <p>{t.features.dashboard.body}</p>
                </div>
              </article>

              <article className="hp-tile t-private rv" style={vars({ "--i": 1 })}>
                <div className="hp-tile-vis" aria-hidden="true">
                  <div className="hp-priv">
                    <div className="hp-priv-call">
                      <span className="ic"><Icon id="i-phone" /></span>
                      <div>
                        <span>{t.features.private.callerId}</span>
                        <b>{t.features.private.yourLine}</b>
                        <span className="mono">(415) 200-CARE</span>
                      </div>
                    </div>
                    <div className="admin">
                      <div className="crow">
                        <span className="ava" style={{ background: "var(--blue)" }}>MD</span>
                        <div className="info">
                          <b>Maria Delgado</b>
                          <div className="rel">{t.rel.daughter}</div>
                          <div className="tel">{t.features.private.hidden}</div>
                        </div>
                        <div className="acts"><span className="mini"><Icon id="i-lock" /></span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hp-tile-txt">
                  <h3>{t.features.private.title}</h3>
                  <p>{t.features.private.body}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ TRUST ============ */}
        {/* Each promise card has a small illustration (aria-hidden: the heading carries
            the meaning) that plays once when the card scrolls into view. */}
        <section className="section hp-trust hp-dark" id="trust" aria-labelledby="trust-title">
          <div className="hp-trust-bg" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="wrap">
            <div className="section-head rv">
              <span className="eyebrow">{t.trust.eyebrow}</span>
              <h2 className="hp-h2" id="trust-title">
                {t.trust.titleStart}
                <span className="accent">{t.trust.titleAccent}</span>
              </h2>
              <p className="lead">{t.trust.lead}</p>
            </div>
            <ul className="hp-pcs">
              <li className="hp-pc pc-guar rv" style={vars({ "--i": 0 })}>
                <div className="hp-pc-vis" aria-hidden="true">
                  <div className="hp-pc-float">
                    <div className="hp-dial">
                      <svg viewBox="0 0 200 200">
                        <defs>
                          <linearGradient id="hp-dial-g" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" />
                            <stop offset="1" />
                          </linearGradient>
                        </defs>
                        <circle className="trk" cx="100" cy="100" r="96" />
                        <circle className="arc" cx="100" cy="100" r="96" pathLength={1} transform="rotate(-90 100 100)" />
                        {Array.from({ length: 30 }, (_, k) => (
                          <line
                            key={k}
                            className="tk"
                            x1="100"
                            y1="15"
                            x2="100"
                            y2="24"
                            transform={`rotate(${k * 12} 100 100)`}
                            style={vars({ "--d": TICK_DELAYS[k] })}
                          />
                        ))}
                      </svg>
                      <div className="hp-dial-n">
                        <b />
                        <span>{t.trust.guarantee.days}</span>
                      </div>
                    </div>
                    <span className="hp-pc-chip">
                      <Icon id="i-check" />
                      {t.trust.guarantee.refund}
                    </span>
                  </div>
                </div>
                <div className="hp-pc-txt">
                  <span className="ic"><Icon id="i-shield" /></span>
                  <h3>{t.trust.points[0]}</h3>
                </div>
              </li>
              <li className="hp-pc pc-priv rv" style={vars({ "--i": 1 })}>
                <div className="hp-pc-vis" aria-hidden="true">
                  <div className="hp-pc-float hp-pv">
                    <div className="hp-ui hp-pv-card">
                      <span className="ava">MD</span>
                      <div className="info">
                        <b>Maria Delgado</b>
                        <span className="rel">{t.rel.daughter}</span>
                        <span className="hp-mask mono">
                          <span className="real">(415) 555-0142</span>
                          <span className="dots">(•••) •••-••42</span>
                          <i className="scan" />
                        </span>
                      </div>
                      <span className="lock"><Icon id="i-lock" /></span>
                    </div>
                    <div className="hp-ui hp-pv-data">
                      <div className="hd">
                        <Icon id="i-shield" />
                        {t.trust.privacy.title}
                      </div>
                      <div className="row" style={vars({ "--i": 0 })}>
                        <span>{t.trust.privacy.numbers}</span>
                        <b>{t.trust.privacy.hidden}</b>
                      </div>
                      <div className="row" style={vars({ "--i": 1 })}>
                        <span>{t.trust.privacy.sold}</span>
                        <b className="stamp">{t.trust.privacy.never}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hp-pc-txt">
                  <span className="ic"><Icon id="i-eye-off" /></span>
                  <h3>{t.trust.points[2]}</h3>
                </div>
              </li>
              <li className="hp-pc pc-terms rv" style={vars({ "--i": 2 })}>
                <div className="hp-pc-vis" aria-hidden="true">
                  <div className="hp-pc-float hp-rcpt-w">
                    <div className="hp-rcpt">
                      <svg className="hp-logo" viewBox="0 0 800 154.5652">
                        <use href="#logo" />
                      </svg>
                      {(
                        [
                          [t.trust.terms.setupFee, "$0"],
                          [t.trust.terms.contract, t.trust.terms.none],
                          [t.trust.terms.cancel, t.trust.terms.anytime],
                        ] as const
                      ).map(([k, v], i) => (
                        <div className="row" key={i} style={vars({ "--i": i })}>
                          <span>{k}</span>
                          <b>{v}</b>
                          <i className="ck"><Icon id="i-check" /></i>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hp-pc-txt">
                  <span className="ic"><Icon id="i-nocontract" /></span>
                  <h3>{t.trust.points[1]}</h3>
                </div>
              </li>
              <li className="hp-pc pc-otp rv" style={vars({ "--i": 3 })}>
                <div className="hp-pc-vis" aria-hidden="true">
                  <div className="hp-pc-float hp-ui hp-otp">
                    <div className="hd">
                      <Icon id="i-lock" />
                      {t.trust.signIn.enterCode}
                    </div>
                    <div className="boxes mono">
                      {[...OTP_DIGITS].map((d, k) => (
                        <span key={k} style={vars({ "--k": k })}>
                          <b>{d}</b>
                        </span>
                      ))}
                    </div>
                    <span className="ok">
                      <Icon id="i-check" />
                      {t.trust.signIn.verified}
                    </span>
                  </div>
                </div>
                <div className="hp-pc-txt">
                  <span className="ic"><Icon id="i-2step" /></span>
                  <h3>{t.trust.points[3]}</h3>
                </div>
              </li>
              <li className="hp-pc pc-help rv" style={vars({ "--i": 4 })}>
                <div className="hp-pc-vis" aria-hidden="true">
                  <div className="hp-pc-float hp-chat">
                    <p className="q">{t.trust.support.question}</p>
                    <div className="from">
                      <span className="av"><Icon id="i-headset" /></span>
                      <div className="col">
                        <span className="who">{t.trust.support.team}</span>
                        <div className="cell">
                          <span className="typing">
                            <i style={vars({ "--k": 0 })} />
                            <i style={vars({ "--k": 1 })} />
                            <i style={vars({ "--k": 2 })} />
                          </span>
                          <p className="a">{t.trust.support.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hp-pc-txt">
                  <span className="ic"><Icon id="i-headset" /></span>
                  <h3>{t.trust.points[4]}</h3>
                </div>
              </li>
            </ul>
            {/* The design's testimonial row (.hp-quotes) is left out until there are
                real customer quotes to show; its styles are kept in home-sections.css. */}
            <p className="hp-disc rv">
              <Icon id="i-info" />
              <span>{t.trust.disclaimer}</span>
            </p>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        {/* The controller drives the billing toggle (prices tween, notes, CTA links,
            .is-annual on the section) and plays each card's entrance once (.play). */}
        <section className="section hp-price hp-tint" id="pricing" aria-labelledby="price-title">
          <div className="hp-price-bg" aria-hidden="true" />
          <div className="wrap">
            <div className="section-head rv">
              <span className="eyebrow">{t.pricing.eyebrow}</span>
              <h2 className="hp-h2" id="price-title">
                {t.pricing.titleStart}
                <span className="accent">{t.pricing.titleAccent}</span>
              </h2>
              <p className="lead">{t.pricing.lead}</p>
            </div>
            <div className="hp-bill rv">
              <div className="seg" role="radiogroup" aria-label={t.pricing.billingPeriod}>
                <span className="hp-seg-pill" aria-hidden="true" />
                <button type="button" className="seg-btn active" role="radio" aria-checked="true" tabIndex={0} data-bill="monthly">
                  {t.pricing.monthly}
                </button>
                <button type="button" className="seg-btn" role="radio" aria-checked="false" tabIndex={-1} data-bill="annual">
                  {t.pricing.annual}
                </button>
              </div>
              <span className="badge hp-save">
                <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5-6.5-2L10 10Z" />
                </svg>
                {base.ui.save17}
              </span>
            </div>
            <div className="hp-plans">
              {plans.map((p, i) => (
                <article
                  key={p.id}
                  className={p.id === "pro" ? "hp-plan is-pop" : "hp-plan"}
                  style={vars({ "--i": i })}
                  data-plan={p.id}
                  data-m={PLAN_PRICING[p.id].monthlyAmount}
                  data-a={PLAN_PRICING[p.id].annualAmount}
                  data-note-a={p.noteAnnual}
                  aria-labelledby={`pl-${p.id}`}
                >
                  {p.id === "pro" && (
                    <>
                      <span className="hp-plan-ring" aria-hidden="true" />
                      <span className="hp-plan-badge">
                        <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5-6.5-2L10 10Z" />
                        </svg>
                        {t.pricing.mostPopular}
                      </span>
                    </>
                  )}
                  <div className="hp-plan-head">
                    <span className="ic"><Icon id={PLAN_ICONS[p.id]} /></span>
                    <h3 id={`pl-${p.id}`}>{p.title}</h3>
                  </div>
                  <p className="hp-plan-tag">{p.tag}</p>
                  <div className="hp-plan-cost">
                    {/* What twelve monthly payments would cost; shown struck through while Annual is selected. */}
                    <s className="was mono" aria-hidden="true">
                      ${(PLAN_PRICING[p.id].monthlyAmount * 12).toFixed(2)}
                    </s>
                    <p className="hp-plan-price">
                      <span className="cur">$</span>
                      <b className="amt">{PLAN_PRICING[p.id].monthlyAmount.toFixed(2)}</b>
                      <span className="per">{t.pricing.perMonth}</span>
                    </p>
                  </div>
                  <p className="hp-plan-note">{base.ui.billedMonthlyCancelAnytime}</p>
                  <a className={p.id === "pro" ? "btn btn-primary btn-lg" : "btn btn-ghost btn-lg"} href={`/signup?plan=${p.id}&billing=monthly&lang=${lang}`}>
                    {p.cta}
                  </a>
                  <ul className="hp-plan-feats">
                    {feats[p.id].map((f, k) => (
                      <li key={f} style={vars({ "--k": k })}>
                        <span className="ck"><Icon id="i-check" /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="pricing-guarantee hp-guar rv">
              <span className="hp-seal" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <circle className="face" cx="50" cy="50" r="48" />
                  {Array.from({ length: 30 }, (_, k) => (
                    <line
                      key={k}
                      x1="50"
                      y1="6"
                      x2="50"
                      y2="11"
                      transform={`rotate(${k * 12} 50 50)`}
                      style={vars({ "--k": k })}
                    />
                  ))}
                </svg>
                <b>30</b>
                <span>{t.trust.guarantee.days}</span>
              </span>
              <div>
                <h4>{t.pricing.guaranteeTitle}</h4>
                <p>{t.pricing.guaranteeBody}</p>
              </div>
            </div>
            <p className="hp-more rv">
              <span className="ic"><Icon id="i-plus" /></span>
              <span>{more}</span>
            </p>
            <div className="hp-price-links">
              <a className="hp-link" href="/contact">
                {t.pricing.organizations}
                <Icon id="i-arrow-r" />
              </a>
              <a className="hp-link" href="/comparison-chart">
                {t.pricing.compare}
                <Icon id="i-arrow-r" />
              </a>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="section hp-faq" id="faq" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="hp-h2" id="faq-title">{t.faq.title}</h2>
            </div>
            <div className="faq">
              {t.faq.items.map((item) => (
                <details key={item.q} className="faq-item" name="faq">
                  <summary className="faq-q">
                    {item.q}
                    <span className="pm"><Icon id="i-plus" /></span>
                  </summary>
                  <div className="faq-a">
                    <p>{fill(item.a, { numberPrice: ADDON_PRICING.extraNumberLabel })}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="hp-final hp-dark" id="start" aria-labelledby="final-title">
          <div className="hp-final-glow" aria-hidden="true" />
          <div className="wrap hp-final-grid">
            <div className="hp-final-copy">
              <h2 className="hp-h2" id="final-title">{t.final.title}</h2>
              <p className="lead">{t.final.lead}</p>
              <div className="hp-ctas">
                <a className="btn btn-primary btn-lg" href="#pricing">{t.nav.getStarted}</a>
                <a className="btn btn-ghost btn-lg hp-on-dark" href="/contact">
                  <Icon id="i-headset" />
                  {t.final.talk}
                </a>
              </div>
              <p className="hp-fine">
                <span>{t.final.fine[0]}</span>
                <span className="sep" aria-hidden="true">·</span>
                <span>{t.final.fine[1]}</span>
                <span className="sep" aria-hidden="true">·</span>
                <span>{t.final.fine[2]}</span>
              </p>
            </div>
            <div className="hp-final-vis">
              <div className="hp-stage is-rest" role="img" aria-label={t.final.stageLabel}>
                <div className="hp-orbit">
                  <svg className="hp-svg" viewBox="0 0 600 600" aria-hidden="true">
                    <circle className="orb" cx="300" cy="300" r="250" />
                    <circle className="orb2" cx="300" cy="300" r="186" />
                    {(["m", "j", "r", "d"] as const).map((k) => (
                      <path key={k} className="hot g" d={THREADS[k]} />
                    ))}
                  </svg>
                  {(["m", "j", "r", "d"] as const).map((k) => (
                    <div
                      key={k}
                      className={`hp-av ${SEATS[k].pos}`}
                      style={vars({
                        "--x": SEATS[k].x,
                        "--y": SEATS[k].y,
                        "--dx": k === "m" || k === "j" ? 70 : -70,
                        "--dy": SEATS[k].pos === "top" ? -46 : 46,
                      })}
                    >
                      <span className="av">{who[k][0][0]}</span>
                      <span className="lbl">
                        <b>{who[k][0]}</b>
                        <span className="rel">{who[k][1]}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="hp-note-w">
                  <div className="hp-note">
                    <span className="hp-magnet" />
                    <span className="hp-note-lbl">{t.hero.noteLabel}</span>
                    <span className="hp-num">
                      (415)&nbsp;200-<span className="v">CARE</span>
                    </span>
                    <span className="hp-note-foot">
                      <span className="devs">
                        <Icon id="i-landline" />
                        <Icon id="i-flip" />
                        <Icon id="i-smart" />
                      </span>
                      {t.final.anyPhone}
                      <span className="hp-live">
                        <i />
                        {t.final.live}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer hp-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <a className="brand" href="#top" aria-label={t.nav.home}>
                <svg className="hp-logo" viewBox="0 0 800 154.5652" aria-hidden="true">
                  <use href="#logo" />
                </svg>
              </a>
              <p className="blurb">{t.footer.blurb}</p>
            </div>
            <div>
              <h5>{t.footer.product}</h5>
              <ul>
                <li><a href="#how">{t.nav.how}</a></li>
                <li><a href="#pricing">{t.nav.pricing}</a></li>
                <li><a href="#faq">{t.nav.faq}</a></li>
                <li><a href="/comparison-chart">{t.footer.compare}</a></li>
                <li><a href="/login">{t.nav.login}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.who}</h5>
              <ul>
                <li><a href="/parents">{t.footer.parents}</a></li>
                <li><a href="/seniors">{t.footer.seniors}</a></li>
                <li><a href="/caregivers">{t.footer.caregivers}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.company}</h5>
              <ul>
                <li><a href="/contact">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.legal}</h5>
              <ul>
                <li><a href="/privacy-policy">{t.footer.privacy}</a></li>
                <li><a href="/terms-of-service">{t.footer.terms}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t.footer.copyright}</span>
            <span>{t.footer.moments}</span>
            <a className="hp-badge-slot" href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer">
              <img
                src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp"
                alt={t.footer.badgeAlt}
                width={120}
                height={40}
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </footer>

      <div className="hp-mbar" id="hp-mbar" inert>
        <div className="hp-mbar-in">
          <span>{fromPrice}</span>
          <a className="btn btn-primary" href="#pricing">{t.nav.getStarted}</a>
        </div>
      </div>
    </>
  );
}

// Never re-rendered in place: the controller mutates this DOM directly, and a
// language change remounts it (keyed by language in HomePage).
export default React.memo(HomeV2);
