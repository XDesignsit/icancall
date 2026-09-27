// Homepage v2 behaviour, ported from the design handoff's core.js and story.js:
// header, mobile menu, reveals, hero intro + pause control, hero → problem
// morph, stacked use-case cards, mobile bar, pricing toggle, FAQ, and the
// scroll-pinned "How it works" story. Only transform/opacity/filter animate.
//
// It drives the server-rendered DOM directly (one rAF loop, reads then
// writes), so the React tree it runs on is never re-rendered in place — a
// language change remounts it — and everything here is torn down on unmount.
import type { HomeTranslations } from "@/lib/translations/home/types";
import { fill } from "./text";
import { mountSim } from "./sim";

interface Options {
  t: HomeTranslations;
  lang: string;
  /** "Billed monthly · cancel anytime" from the shared pricing copy. */
  billedMonthly: string;
}

type Job = {
  read?: (vh: number) => unknown;
  write?: (value: never, vh: number) => void;
  resize?: () => void;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ≈ cubic-bezier(.65,0,.35,1)
const mq = (q: string) => matchMedia(q).matches;
const dir = () => (document.documentElement.dir === "rtl" ? -1 : 1);
const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};

/** `root` is the .hp-page wrapper; it carries the motion classes (.m / .rm / .no-sda / .rvr). */
export function initHome(root: HTMLElement, { t, lang, billedMonthly }: Options): () => void {
  const $ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector<E>(s)!;
  const $$ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll<E>(s)];
  const motion = () => root.classList.contains("m");

  const ac = new AbortController();
  const on = { signal: ac.signal } as const;
  const observers: IntersectionObserver[] = [];
  const timers = new Set<number>();
  let raf = 0;

  /* one rAF loop, reads then writes */
  const jobs: Job[] = [];
  let queued = false;
  const frame = () => {
    queued = false;
    const vh = innerHeight;
    const r = jobs.map((j) => (j.read ? j.read(vh) : null));
    jobs.forEach((j, i) => j.write && j.write(r[i] as never, vh));
  };
  const req = () => {
    if (!queued) {
      queued = true;
      raf = requestAnimationFrame(frame);
    }
  };
  const add = (j: Job) => {
    jobs.push(j);
    req();
  };
  addEventListener("scroll", req, { passive: true, signal: ac.signal });
  addEventListener("resize", () => { jobs.forEach((j) => j.resize && j.resize()); req(); }, on);

  const once = (sel: string, cls: string, opts?: IntersectionObserverInit) => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); } }),
      opts,
    );
    $$(sel).forEach((el) => io.observe(el));
    observers.push(io);
  };

  /* header */
  const hdr = $("#header");
  add({ read: () => scrollY, write: (y: number) => hdr.classList.toggle("scrolled", y > 80) });
  const mb = $<HTMLButtonElement>(".hp-menu-btn"), sheet = $("#hp-sheet");
  const setMenu = (o: boolean) => { mb.setAttribute("aria-expanded", String(o)); sheet.classList.toggle("open", o); };
  mb.addEventListener("click", () => setMenu(mb.getAttribute("aria-expanded") !== "true"), on);
  sheet.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) setMenu(false); }, on);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) { setMenu(false); mb.focus(); } }, on);
  document.addEventListener("click", (e) => { if (sheet.classList.contains("open") && !(e.target as Element).closest("#header")) setMenu(false); }, on);

  /* reveals + once-only micro animations */
  if (motion()) { root.classList.add("rvr"); once(".rv", "in", { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }); }
  once(".hp-tile", "play", { threshold: 0.45 });
  if (root.classList.contains("no-sda")) once(".hp-lines .ln, .hp-mmorph, .hp-s3-line, .hp-stage.is-rest", "in", { rootMargin: "0px 0px -25% 0px" });

  /* hero intro: ~2.5s, breathes 3 cycles, rests. Pause / play / replay control */
  const stage = $("#hero-stage"), ctl = $<HTMLButtonElement>(".hp-stage-ctl");
  const INTRO = 8200;
  let itm = 0, left = INTRO, t0 = 0;
  const setCtl = (s: "play" | "paused" | "done") => {
    ctl.dataset.state = s;
    ctl.setAttribute("aria-label", s === "play" ? t.hero.pause : s === "paused" ? t.hero.play : t.hero.replay);
    $("use", ctl).setAttribute("href", s === "play" ? "#i-pause" : s === "paused" ? "#i-play" : "#i-replay");
  };
  const arm = (ms: number) => { clearTimeout(itm); t0 = performance.now(); left = ms; itm = window.setTimeout(() => setCtl("done"), ms); };
  const replay = () => { stage.classList.remove("is-intro", "is-paused"); void stage.offsetWidth; stage.classList.add("is-intro"); setCtl("play"); arm(INTRO); };
  ctl.addEventListener("click", () => {
    const s = ctl.dataset.state;
    if (s === "play") { stage.classList.add("is-paused"); clearTimeout(itm); left -= performance.now() - t0; setCtl("paused"); }
    else if (s === "paused") { stage.classList.remove("is-paused"); setCtl("play"); arm(left); }
    else replay();
  }, on);
  arm(INTRO);

  /* hero → problem: the card lifts, the circle steps back, a contact list scrolls, blurs and collapses into the card */
  const prob = $("#problem"), nw = $(".hp-note-w", stage), orb = $(".hp-orbit", stage), list = $(".hp-list", stage), rows = $(".hp-list-rows", stage);
  let morph = false;
  add({
    read: (vh) => {
      if (!(motion() && mq("(min-width:1024px)"))) return null;
      const r = prob.getBoundingClientRect();
      return clamp((vh - r.top) / r.height);
    },
    write: (q: number | null) => {
      if (q == null) {
        if (morph) { [nw, orb, list, rows].forEach((e) => { e.style.transform = ""; e.style.opacity = ""; e.style.filter = ""; }); morph = false; }
        return;
      }
      morph = true;
      const lift = eio(seg(q, 0, 0.24)), lin = eio(seg(q, 0.2, 0.38)), ls = seg(q, 0.36, 0.66), col = eio(seg(q, 0.62, 0.84)), sink = lin * (1 - col);
      orb.style.opacity = (1 - lift).toFixed(3);
      orb.style.transform = `scale(${(1 - 0.08 * lift).toFixed(4)})`;
      nw.style.transform = `translateY(${(-14 * lift * (1 - sink)).toFixed(2)}px) rotate(${(2.5 * lift * dir()).toFixed(3)}deg) scale(${(1 + 0.04 * lift - 0.14 * sink).toFixed(4)})`;
      nw.style.opacity = (1 - 0.96 * sink).toFixed(3);
      list.style.opacity = (lin * (1 - seg(col, 0.55, 1))).toFixed(3);
      const sc = 0.9 + 0.1 * lin;
      list.style.transform = `scale(${sc.toFixed(4)}, ${(sc * (1 - 0.62 * col)).toFixed(4)})`;
      list.style.filter = `blur(${(ls * 2.5 + col * 7).toFixed(2)}px)`;
      rows.style.transform = `translateY(${(-ls * 52).toFixed(2)}%)`;
    },
  });

  /* who it's for: each card slides over the last; the previous one scales to .96 and dims */
  const ucs = $$(".hp-uc");
  let tops: number[] = [];
  const measure = () => { tops = ucs.map((c) => parseFloat(getComputedStyle(c).top) || 0); };
  measure();
  add({
    resize: measure,
    read: () => (motion() && mq("(min-width:768px) and (min-height:700px)") ? ucs.map((c) => c.getBoundingClientRect().top) : null),
    write: (tp: number[] | null, vh) =>
      ucs.forEach((c, i) => {
        let k = 0;
        if (tp && i < ucs.length - 1) k = clamp((vh - tp[i + 1]) / Math.max(1, vh - tops[i + 1]));
        c.style.setProperty("--k", k.toFixed(3));
      }),
  });

  /* mobile bottom bar: after the hero, hidden while pricing is on screen */
  const mbar = $("#hp-mbar");
  let heroOut = false, priceIn = false;
  const setBar = () => { const show = heroOut && !priceIn; mbar.classList.toggle("on", show); mbar.inert = !show; };
  const ioHero = new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; setBar(); });
  ioHero.observe($("#hero"));
  const ioPrice = new IntersectionObserver(([e]) => { priceIn = e.isIntersecting; setBar(); }, { threshold: 0.12 });
  ioPrice.observe($("#pricing"));
  observers.push(ioHero, ioPrice);

  /* pricing: monthly / annual, prices tween, CTA links follow the toggle */
  const bseg = $(".hp-bill .seg"), bbtn = $$<HTMLButtonElement>("[data-bill]", bseg), plans = $$(".hp-plan");
  const blive = document.createElement("p");
  blive.className = "sr-only";
  blive.setAttribute("aria-live", "polite");
  bseg.parentNode!.appendChild(blive);
  let bill = "monthly";
  const setBill = (b: string, focus?: boolean) => {
    if (b === bill) return;
    const from = bill;
    bill = b;
    const a = b === "annual";
    bbtn.forEach((x) => {
      const sel = x.dataset.bill === b;
      x.classList.toggle("active", sel);
      x.setAttribute("aria-checked", String(sel));
      x.tabIndex = sel ? 0 : -1;
      if (sel && focus) x.focus();
    });
    plans.forEach((p) => {
      const amt = $(".amt", p), v0 = parseFloat(p.dataset[from === "annual" ? "a" : "m"]!), v1 = parseFloat(p.dataset[a ? "a" : "m"]!);
      $(".per", p).textContent = a ? t.pricing.perYear : t.pricing.perMonth;
      $(".hp-plan-note", p).textContent = a ? p.dataset.noteA! : billedMonthly;
      $<HTMLAnchorElement>(".btn", p).href = `/signup?plan=${p.dataset.plan}&billing=${b}&lang=${lang}`;
      const fin = a ? String(Math.round(v1)) : v1.toFixed(2);
      if (!motion()) { amt.textContent = fin; return; }
      const s0 = performance.now(), D = 650;
      const st = (now: number) => {
        const k = clamp((now - s0) / D), e = 1 - Math.pow(1 - k, 3);
        amt.textContent = k < 1 ? (v0 + (v1 - v0) * e).toFixed(a ? 0 : 2) : fin;
        if (k < 1) raf = requestAnimationFrame(st);
      };
      raf = requestAnimationFrame(st);
      const tm = window.setTimeout(() => { amt.textContent = fin; timers.delete(tm); }, D + 80);
      timers.add(tm);
    });
    blive.textContent = a ? t.pricing.showingAnnual : t.pricing.showingMonthly;
  };
  bbtn.forEach((x) => x.addEventListener("click", () => setBill(x.dataset.bill!), on));
  bseg.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) { e.preventDefault(); setBill(bill === "monthly" ? "annual" : "monthly", true); }
  }, on);

  /* FAQ: one open at a time, smooth height (native <details name> without JS) */
  const faqs = $$<HTMLDetailsElement>(".hp-faq details");
  faqs.forEach((x) => x.removeAttribute("name"));
  const openF = (x: HTMLDetailsElement) => {
    const b = $(".faq-a", x);
    x.open = true;
    if (!motion()) return;
    b.animate([{ height: "0px", opacity: 0 }, { height: b.scrollHeight + "px", opacity: 1 }], { duration: 440, easing: "cubic-bezier(.22,1,.36,1)" });
  };
  const closeF = (x: HTMLDetailsElement) => {
    const b = $(".faq-a", x);
    if (!motion()) { x.open = false; return; }
    const an = b.animate([{ height: b.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
    an.onfinish = () => { x.open = false; an.cancel(); };
  };
  faqs.forEach((x) =>
    $("summary", x).addEventListener("click", (e) => {
      e.preventDefault();
      if (x.open) closeF(x);
      else { faqs.forEach((o) => o !== x && o.open && closeF(o)); openF(x); }
    }, on),
  );

  /* the story of one call (#how) and the Try-it simulator */
  const stopStory = initStory(root, t, add, motion, on);
  const stopSim = mountSim($("[data-sim]"), t, lang, () => root.classList.contains("rm"));

  return () => {
    ac.abort();
    observers.forEach((o) => o.disconnect());
    cancelAnimationFrame(raf);
    clearTimeout(itm);
    timers.forEach((tm) => clearTimeout(tm));
    stopStory();
    stopSim();
    blive.remove();
  };
}

/* ───── How it works: pinned with position:sticky; scroll progress read in rAF.
   Reduced motion / short screens: five static stacked steps (the default markup). ───── */
function initStory(
  root: HTMLElement,
  t: HomeTranslations,
  add: (j: Job) => void,
  motion: () => boolean,
  on: AddEventListenerOptions,
): () => void {
  const sec = root.querySelector<HTMLElement>("#how");
  if (!sec) return () => {};
  const $ = <E extends Element = HTMLElement>(s: string, r: ParentNode = sec) => r.querySelector<E>(s)!;
  const $$ = <E extends Element = HTMLElement>(s: string, r: ParentNode = sec) => [...r.querySelectorAll<E>(s)];
  const track = $(".hp-story-track"), steps = $$(".st"), rail = $(".hp-rail"), rb = $$(".hp-rail button"), sv = $(".sv");
  const K = ["m", "j", "r", "d"] as const;
  type K = (typeof K)[number];
  const av = Object.fromEntries(K.map((k) => [k, $(`.sv-av[data-k="${k}"]`, sv)])) as Record<K, HTMLElement>;
  const hotM = $<SVGPathElement>('.hot[data-k="m"]', sv), hotJ = $<SVGPathElement>('.hot[data-k="j"]:not(.g)', sv), hotG = $<SVGPathElement>(".hot.g", sv);
  const pk = { m: $<SVGCircleElement>('.pk[data-k="m"]', sv), j: $<SVGCircleElement>('.pk[data-k="j"]', sv) };
  const pth = { m: $<SVGPathElement>('.thr[data-k="m"]', sv), j: $<SVGPathElement>('.thr[data-k="j"]', sv) };
  const len = { m: pth.m.getTotalLength(), j: pth.j.getTotalLength() };
  const greet = $(".sv-greet", sv), key = $(".sv-greet .dk-key", sv), rec = $(".sv-rec", sv), vm = $(".sv-vm", sv), txp = $(".sv-vm p", sv), rings = $$(".sv-ring", sv), devname = $(".sv-devname", sv);
  const tl = $(".sv-timer span", sv), tv = $(".sv-timer b", sv), wv = $$(".sv-wv i", sv), wv2 = $$(".sv-wv2 i", sv);
  const TX = t.how.transcript;
  const caret = document.createElement("span");
  caret.className = "caret";
  let pinned = false, cur = -1, lastP = -1, lastTx = -1;

  const canPin = () => motion() && (mq("(min-width:1024px)") ? innerHeight >= 620 : innerHeight >= 760 && innerWidth >= 360);
  const setMode = () => {
    const p = canPin();
    if (p === pinned) return;
    pinned = p;
    sec.classList.toggle("is-pin", p);
    steps.forEach((s) => s.classList.remove("on", "was"));
    cur = -1;
    lastP = -1;
  };
  setMode();

  const setAv = (k: K, st?: string, pill?: string) => {
    const dk = av[k].firstElementChild as HTMLElement, p = dk.querySelector<HTMLElement>(".dk-pill")!, id = (st || "") + (pill || "");
    if (dk.dataset.key === id) return;
    dk.dataset.key = id;
    dk.classList.toggle("is-ring", st === "ring");
    dk.classList.toggle("is-miss", st === "miss");
    dk.classList.toggle("is-conn", st === "conn");
    av[k].classList.toggle("show-pill", !!pill);
    if (pill) {
      p.className = "dk-pill" + (st === "ring" ? " ring" : st === "conn" ? " conn" : "");
      p.replaceChildren();
      if (st === "ring" || st === "conn") { const d = document.createElement("i"); d.className = "d"; p.append(d); }
      p.append(pill);
    }
  };
  const pulse = (k: K, tt: number | null) => {
    const rp = av[k].querySelector<HTMLElement>(".rp")!;
    if (tt == null) { rp.style.opacity = "0"; return; }
    const f = (tt * 5) % 1;
    rp.style.opacity = (0.75 * (1 - f)).toFixed(3);
    rp.style.transform = `scale(${(1 + 0.55 * f).toFixed(3)})`;
  };
  const packet = (k: "m" | "j", tt: number | null) => {
    const c = pk[k];
    if (tt == null || tt >= 0.97) { c.style.opacity = "0"; return; }
    const p = pth[k].getPointAtLength(len[k] * tt);
    c.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    c.style.opacity = "1";
  };
  const wave = (bars: HTMLElement[], tt: number, amp: number) =>
    bars.forEach((b, i) => {
      const h = amp ? (0.22 + 0.78 * Math.abs(Math.sin(tt * 40 + i * 0.9) * Math.sin(tt * 13 + i * 0.37))) * amp : 0.14;
      b.style.transform = `scaleY(${h.toFixed(3)})`;
    });

  function render(P: number) {
    const s = Math.min(4, Math.floor(P * 5)), tt = clamp(P * 5 - s);
    if (s !== cur) {
      steps.forEach((el, i) => { el.classList.toggle("on", i === s); el.classList.toggle("was", i < s); });
      rb.forEach((b, i) => { b.classList.toggle("done", i < s); if (i === s) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      sv.dataset.step = String(s + 1);
      cur = s;
    }
    rail.style.setProperty("--rp", P.toFixed(4));
    let dev = "land", label = t.how.status.dialing, secs = 0, hm = 0, hj = 0, hg = 0, gOn = false, kp = false, rOn = false, vOn = false, txN = 0, wa = 0, wa2 = 0;
    let pm: number | null = null, pj: number | null = null, rpm: number | null = null, rpj: number | null = null, ring: number | null = null;
    const st: Partial<Record<K, string>> = {}, pill: Partial<Record<K, string>> = {};
    if (s === 0) { dev = tt < 0.34 ? "land" : tt < 0.67 ? "flip" : "smart"; ring = tt; }
    else if (s === 1) { label = t.how.status.greeting; secs = 6 * tt; gOn = true; wa = tt < 0.7 ? 1 : 0.25; kp = tt > 0.72; }
    else if (s === 2) {
      const miss = tt >= 0.82;
      label = miss ? t.how.status.noAnswer : fill(t.how.status.ringing, { name: "Maria" });
      secs = 6 + 15 * seg(tt, 0.05, 0.82);
      hm = tt < 0.86 ? 1 : 0; pm = tt < 0.2 ? seg(tt, 0, 0.2) : null;
      st.m = miss ? "miss" : "ring"; pill.m = miss ? t.how.pill.noAnswer : t.how.pill.ringing; rpm = miss ? null : tt;
    } else if (s === 3) {
      const conn = tt >= 0.42;
      st.m = "miss"; pill.m = t.how.pill.noAnswer;
      label = conn ? t.how.status.talking : fill(t.how.status.ringing, { name: "Joseph" });
      secs = conn ? 134 * seg(tt, 0.42, 1) : 21 + 5 * seg(tt, 0, 0.42);
      hj = conn ? 0 : 1; hg = conn ? 1 : 0; pj = tt < 0.18 ? seg(tt, 0, 0.18) : null;
      st.j = conn ? "conn" : "ring"; pill.j = conn ? t.how.pill.connected : t.how.pill.ringing; rpj = conn ? null : tt;
    } else {
      K.forEach((k, i) => {
        const a = i * 0.075, b = a + 0.075;
        if (tt >= b) { st[k] = "miss"; pill[k] = t.how.pill.noAnswer; } else if (tt >= a) { st[k] = "ring"; pill[k] = t.how.pill.ringing; }
      });
      label = tt < 0.3 ? t.how.status.ringingCircle : tt < 0.56 ? t.how.status.voicemail : t.how.status.transcriptSent;
      secs = tt < 0.3 ? 60 * seg(tt, 0, 0.3) : 18 * seg(tt, 0.3, 0.56);
      rOn = tt >= 0.3 && tt < 0.58; wa2 = rOn ? 1 : 0; vOn = tt >= 0.55; txN = Math.round(TX.length * seg(tt, 0.58, 0.92));
    }
    sv.dataset.dev = dev;
    const dn = dev === "land" ? t.how.devices.land : dev === "flip" ? t.how.devices.flip : t.how.devices.smart;
    if (devname.textContent !== dn) devname.textContent = dn;
    tl.textContent = label;
    tv.textContent = fmt(secs);
    K.forEach((k) => setAv(k, st[k], pill[k]));
    hotM.style.opacity = String(hm); hotJ.style.opacity = String(hj); hotG.style.opacity = String(hg);
    packet("m", pm); packet("j", pj); pulse("m", rpm); pulse("j", rpj);
    greet.classList.toggle("on", gOn); key.classList.toggle("press", kp); rec.classList.toggle("on", rOn); vm.classList.toggle("on", vOn);
    if (txN !== lastTx) { txp.textContent = TX.slice(0, txN); if (vOn && txN < TX.length) txp.appendChild(caret); lastTx = txN; }
    rings.forEach((r, i) => {
      if (ring == null) { r.style.opacity = "0"; return; }
      const f = (ring * 3 + i * 0.5) % 1;
      r.style.opacity = (0.55 * (1 - f)).toFixed(3);
      r.style.transform = `scale(${(0.72 + 0.62 * f).toFixed(3)})`;
    });
    wave(wv, tt, wa); wave(wv2, tt, wa2);
  }

  rb.forEach((b, i) =>
    b.addEventListener("click", () => {
      const r = track.getBoundingClientRect();
      scrollTo({ top: scrollY + r.top + ((i + 0.5) / 5) * (r.height - innerHeight), behavior: motion() ? "smooth" : "auto" });
    }, on),
  );
  add({
    resize: setMode,
    read: (vh) => {
      if (!pinned) return null;
      const r = track.getBoundingClientRect();
      if (r.bottom < -vh || r.top > 2 * vh) return null;
      return clamp(-r.top / (r.height - vh));
    },
    write: (P: number | null) => {
      if (P == null || Math.abs(P - lastP) < 0.0004) return;
      lastP = P;
      render(P);
    },
  });
  return () => sec.classList.remove("is-pin");
}
