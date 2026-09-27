// The homepage "Try it" simulator (#try), ported from the design handoff's
// sim.js: build a circle, pick how it rings, place a test call and watch it
// cascade. It renders into its container and owns that DOM; the server-rendered
// no-JS fallback is replaced on mount. Returns a cleanup function.
import type { HomeTranslations } from "@/lib/translations/home/types";
import { fill } from "./text";

const MAX = 6;
type Mode = "cascade" | "everyone" | "menu";
type NodeState = "ring" | "miss" | "busy" | "conn" | "stop" | "off";
type SimState = "idle" | "dial" | "greet" | "menu" | "ring" | "conn" | "vm";
interface Contact { id: number; name: string; rel: string; on: boolean }
interface Step { d: number; fn: () => void; rate: number; tag: string }

const ic = (id: string) => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const initials = (n: string) => (n.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2) || "?").toUpperCase();
const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
const bars = (n: number) =>
  Array.from({ length: n }, (_, k) => `<i style="--k:${k};--h:${(0.3 + 0.7 * Math.abs(Math.sin(k * 1.7 + 0.6))).toFixed(2)}"></i>`).join("");
const ang = (i: number, n: number) => (n % 2 ? -90 : -90 + 180 / n) + (i * 360) / n;

export function mountSim(root: HTMLElement, t: HomeTranslations, lang: string, isReduced: () => boolean): () => void {
  const S = t.sim;
  const MODES: Mode[] = ["cascade", "everyone", "menu"];
  const DEFAULTS = [
    { name: "Maria", rel: t.rel.daughter },
    { name: "Joseph", rel: t.rel.son },
    { name: "Rosa", rel: t.rel.grandma },
  ];
  const POOL = ["Dan", "Ana", "Sam", "Lena", "Theo", "Priya"].map((name, i) => ({ name, rel: S.poolRels[i] }));
  const TX = t.how.transcript;
  // English keeps the design's phrasing ("Maria, Joseph and Rosa"); other
  // languages get their own list punctuation (、 in Japanese and Chinese, و attached in Arabic).
  const list = lang === "en" ? null : new Intl.ListFormat(lang, { style: "long", type: "conjunction" });
  const join = (a: string[]) =>
    list ? list.format(a) : a.length <= 1 ? a[0] || "" : a.slice(0, -1).join(", ") + ` ${S.and} ` + a[a.length - 1];

  const TPL = `
<div class="sim" data-mode="cascade" data-state="idle">
 <div class="sim-ctrl">
  <fieldset class="sim-fs">
   <legend class="sr-only">${esc(S.legend)}</legend>
   <div class="sim-blk">
    <span class="sim-lbl" id="simL1">${esc(S.howItRings)}</span>
    <div class="seg sim-seg" role="radiogroup" aria-labelledby="simL1">${MODES.map((k, i) => `<button type="button" class="seg-btn${i ? "" : " active"}" role="radio" aria-checked="${!i}" tabindex="${i ? -1 : 0}" data-mode="${k}">${esc(S.modes[k].label)}</button>`).join("")}</div>
    <p class="sim-desc">${esc(S.modes.cascade.desc)}</p>
    <p class="sim-plan">${ic("info")}<span>${esc(S.planNote)}</span></p>
   </div>
   <div class="sim-blk">
    <div class="sim-lbl-row"><span class="sim-lbl" id="simL2">${esc(S.yourCircle)}</span><span class="sim-count"></span></div>
    <p class="sim-hint">${esc(S.hint)}</p>
    <ol class="sim-list" aria-labelledby="simL2"></ol>
    <button type="button" class="sim-add">${ic("plus")}<span>${esc(S.addContact)}</span></button>
   </div>
   <div class="sim-blk sim-what"><button type="button" class="toggle sim-na" role="switch" aria-checked="false"><span class="track"></span><span class="lbl">${esc(S.whatIfNoAnswer)}</span></button></div>
  </fieldset>
 </div>
 <div class="sim-view">
  <div class="sim-bar">
   <div class="sim-caller"><span class="sim-cic">${ic("landline")}</span><span><b>${esc(S.momCalling)}</b><span class="mono">(415) 200-CARE</span></span></div>
   <span class="sim-chip">${esc(S.chip.idle)}</span>
   <div class="sim-timer"><span>${esc(S.callTime)}</span><b class="mono">0:00</b></div>
  </div>
  <div class="sim-stage">
   <div class="sim-orbit">
    <div class="sim-arms" aria-hidden="true"></div>
    <div class="sim-hub"><span>${esc(S.hubLabel)}</span><b>(415) 200-<em>CARE</em></b></div>
    <div class="sim-nodes" style="display:contents"></div>
   </div>
   <div class="sim-menu" aria-hidden="true"><div class="sim-mcard"><span>${esc(S.momHears)}</span><q></q><div class="sim-keys">${"123456789*0#".split("").map((k) => `<span data-k="${k}">${k}</span>`).join("")}</div></div></div>
   <div class="sim-vm" aria-hidden="true"><div class="sim-vcard"><div class="sim-rec"><span class="dot"></span>${esc(S.recording)}<span class="sim-wave">${bars(14)}</span></div><div class="sim-tx dk-tx"><div class="dk-tx-h"><span>${esc(t.how.voicemailFrom)}</span><span class="mono">0:18</span></div><p></p><div class="dk-tx-f"><span>${ic("mail")}${esc(t.how.sentByEmail)}</span><span>${ic("msg")}${esc(t.how.sentByText)}</span></div></div></div></div>
  </div>
  <p class="sim-status" aria-hidden="true"></p>
  <p class="sr-only sim-live" role="status" aria-live="polite"></p>
  <div class="sim-acts">
   <button type="button" class="btn btn-primary btn-lg sim-go">${ic("phone")}<span>${esc(S.placeCall)}</span></button>
   <button type="button" class="btn btn-ghost btn-lg sim-pause" hidden>${ic("pause")}<span>${esc(S.pause)}</span></button>
   <button type="button" class="btn-text sim-reset">${ic("replay")}<span>${esc(S.reset)}</span></button>
  </div>
  <div class="sim-end" hidden><p>${esc(S.endTitle)}</p><div class="hp-ctas"><a class="btn btn-primary" href="#pricing">${esc(t.nav.getStarted)}</a><button type="button" class="btn btn-ghost sim-again">${ic("replay")}<span>${esc(S.runAgain)}</span></button></div></div>
 </div>
</div>`;

  const st = {
    mode: "cascade" as Mode,
    noAnswer: false,
    contacts: DEFAULTS.map((c, i) => ({ id: i + 1, ...c, on: true })) as Contact[],
    nextId: 4,
    running: false,
    paused: false,
    secs: 0,
    rate: 0,
    runner: null as null | { pause(): void; resume(): void; stop(): void },
    log: [] as string[],
    txTimer: 0,
    raf: 0,
  };
  root.innerHTML = TPL;
  const q = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const el = {
    sim: q(".sim"), seg: q(".sim-seg"), desc: q(".sim-desc"), list: q(".sim-list"), add: q<HTMLButtonElement>(".sim-add"),
    count: q(".sim-count"), na: q(".sim-na"), fs: q<HTMLFieldSetElement>(".sim-fs"), arms: q(".sim-arms"), nodes: q(".sim-nodes"),
    stage: q(".sim-stage"), menu: q(".sim-menu"), mq: q(".sim-menu q"), keys: q(".sim-keys"), vm: q(".sim-vm"), txp: q(".sim-tx p"),
    status: q(".sim-status"), live: q(".sim-live"), go: q<HTMLButtonElement>(".sim-go"), pause: q<HTMLButtonElement>(".sim-pause"),
    reset: q<HTMLButtonElement>(".sim-reset"), end: q(".sim-end"), again: q<HTMLButtonElement>(".sim-again"), chip: q(".sim-chip"),
    timer: q(".sim-timer b"), acts: q(".sim-acts"),
  };
  const byId = (id: string | undefined) => st.contacts.find((c) => c.id === Number(id))!;

  /* ── render ── */
  function renderOrbit() {
    const n = st.contacts.length;
    el.arms.innerHTML = st.contacts.map((c, i) => `<span class="sim-arm" data-id="${c.id}" style="--a:${ang(i, n)}deg"><i></i></span>`).join("");
    el.nodes.innerHTML = st.contacts
      .map((c, i) => {
        const a = ang(i, n), pos = Math.sin((a * Math.PI) / 180) < -0.2 ? "top" : "bot";
        return `<div class="sim-node ${pos}" data-id="${c.id}" style="--a:${a}deg"${c.on ? "" : ' data-st="off"'}><div class="sim-nd"><span class="sim-av">${esc(initials(c.name))}<span class="rp"></span></span><span class="sim-nl"><b>${esc(c.name)}</b><span>${esc(c.rel)}</span></span><span class="sim-pill">${c.on ? "" : esc(S.pill.off)}</span></div></div>`;
      })
      .join("");
  }
  function renderList(focus?: [number, string]) {
    const n = st.contacts.length;
    el.list.innerHTML = st.contacts
      .map(
        (c, i) => `<li class="sim-row${c.on ? "" : " is-off"}" data-id="${c.id}">
<button type="button" class="sim-grip" aria-label="${esc(fill(S.aria.reorder, { name: c.name, pos: i + 1, n }))}">${ic("grip")}</button>
<span class="sim-rav" aria-hidden="true">${esc(initials(c.name))}<i>${i + 1}</i></span>
<span class="sim-who"><input class="sim-name" value="${esc(c.name)}" maxlength="16" aria-label="${esc(fill(S.aria.name, { pos: i + 1 }))}" autocomplete="off" spellcheck="false"><span class="sim-rel">${esc(c.rel)}</span></span>
<button type="button" class="toggle${c.on ? " on" : ""}" role="switch" aria-checked="${c.on}" aria-label="${esc(fill(S.aria.available, { name: c.name }))}"><span class="track"></span><span class="lbl">${esc(c.on ? S.available : S.busy)}</span></button>
<button type="button" class="sim-rm" aria-label="${esc(fill(S.aria.remove, { name: c.name }))}"${n <= 1 ? " disabled" : ""}>${ic("x")}</button></li>`,
      )
      .join("");
    el.count.textContent = fill(S.count, { n, max: MAX });
    el.add.disabled = n >= MAX;
    el.add.querySelector("span")!.textContent = n >= MAX ? S.circleFull : S.addContact;
    renderOrbit();
    if (focus) el.list.querySelector<HTMLElement>(`[data-id="${focus[0]}"] ${focus[1]}`)?.focus();
  }
  function setMode(m: Mode) {
    st.mode = m;
    el.sim.dataset.mode = m;
    el.desc.textContent = S.modes[m].desc;
    [...el.seg.children].forEach((b) => {
      const sel = (b as HTMLElement).dataset.mode === m;
      b.classList.toggle("active", sel);
      b.setAttribute("aria-checked", String(sel));
      (b as HTMLElement).tabIndex = sel ? 0 : -1;
    });
  }
  function setNA(v: boolean) { st.noAnswer = v; el.na.classList.toggle("on", v); el.na.setAttribute("aria-checked", String(v)); }
  function setState(s: SimState) { el.sim.dataset.state = s; el.chip.textContent = S.chip[s] || ""; }
  function node(c: Contact, s: NodeState | null) {
    const n = el.nodes.querySelector<HTMLElement>(`.sim-node[data-id="${c.id}"]`);
    if (!n) return;
    if (s) { n.dataset.st = s; n.querySelector(".sim-pill")!.textContent = S.pill[s]; } else n.removeAttribute("data-st");
  }
  function arm(c: Contact, s: "on" | "ok" | "off" | null) {
    const a = el.arms.querySelector(`.sim-arm[data-id="${c.id}"]`);
    if (a) a.className = "sim-arm" + (s ? " " + s : "");
  }
  function press(k: number | null) { el.keys.querySelectorAll<HTMLElement>("span").forEach((s) => s.classList.toggle("press", s.dataset.k === String(k))); }
  function dim(v: boolean) { el.stage.classList.toggle("dim", v); }
  function say(msg: string, o: { reset?: boolean; append?: boolean } = {}) {
    if (o.reset) st.log = [];
    if (o.append && st.log.length) st.log[st.log.length - 1] += " " + msg;
    else st.log.push(msg);
    const shown = st.log.slice(-2);
    el.status.innerHTML = shown.map((x, i) => (i === shown.length - 1 ? `<b>${esc(x)}</b>` : esc(x))).join(" ");
    el.live.textContent = msg;
  }
  function typeTx() {
    clearInterval(st.txTimer);
    if (isReduced()) { el.txp.textContent = TX; return; }
    let k = 0;
    el.txp.textContent = "";
    st.txTimer = window.setInterval(() => {
      if (st.paused) return;
      k += 2;
      el.txp.textContent = TX.slice(0, k);
      if (k >= TX.length) clearInterval(st.txTimer);
    }, 30);
  }
  function resetView() {
    clearInterval(st.txTimer);
    st.runner?.stop();
    st.runner = null;
    st.running = false;
    st.paused = false;
    st.secs = 0;
    st.log = [];
    el.sim.classList.remove("is-paused");
    st.contacts.forEach((c) => { node(c, c.on ? null : "off"); arm(c, null); });
    el.menu.classList.remove("on");
    el.vm.classList.remove("on", "rec", "tx");
    dim(false);
    press(null);
    el.txp.textContent = "";
    el.status.textContent = S.say.ready;
    el.timer.textContent = "0:00";
    setState("idle");
    el.acts.hidden = false;
    el.end.hidden = true;
    runningUI(false);
  }
  function runningUI(running: boolean) {
    el.fs.disabled = running;
    el.go.hidden = running;
    el.pause.hidden = !running;
    el.pause.querySelector("span")!.textContent = S.pause;
    el.pause.querySelector("use")!.setAttribute("href", "#i-pause");
    el.reset.querySelector("span")!.textContent = running ? S.stop : S.reset;
  }

  /* ── the call script ── */
  function build(): Step[] {
    const steps: Step[] = [];
    const add = (d: number, fn: () => void, rate: number, tag: string) => steps.push({ d, fn, rate, tag });
    const cs = st.contacts, avail = cs.filter((c) => c.on), busy = cs.filter((c) => !c.on);
    const busyNames = join(busy.map((c) => c.name));
    const toVM = (why?: string) => {
      add(1800, () => { setState("vm"); dim(true); el.vm.classList.add("on", "rec"); say(why || S.say.voicemail); }, 1.4, "rec");
      add(2600, () => { el.vm.classList.remove("rec"); el.vm.classList.add("tx"); typeTx(); say(S.say.transcribed, { append: true }); }, 0, "tx");
    };
    add(1000, () => { setState("dial"); say(S.say.calling, { reset: true }); }, 1, "dial");
    add(1500, () => { setState("greet"); say(S.say.greeting, { append: true }); }, 2.4, "greet");
    if (st.mode === "cascade") {
      const ans = st.noAnswer ? null : avail.length >= 2 ? avail[1] : avail[0];
      for (const c of cs) {
        if (!c.on) { add(800, () => { node(c, "busy"); arm(c, "off"); say(fill(S.say.skipBusy, { name: c.name })); }, 1, "busy"); continue; }
        add(c === ans ? 1600 : 1900, () => { node(c, "ring"); arm(c, "on"); setState("ring"); say(fill(S.say.ringing, { name: c.name })); }, c === ans ? 4 : 7.9, "ring");
        if (c === ans) { add(1300, () => { node(c, "conn"); arm(c, "ok"); setState("conn"); say(S.say.connected, { append: true }); }, 1, "conn"); break; }
        add(600, () => { node(c, "miss"); arm(c, "off"); say(S.say.noAnswer, { append: true }); }, 1, "miss");
      }
      if (!ans) toVM(avail.length ? undefined : S.say.allBusy);
    } else if (st.mode === "everyone") {
      if (busy.length)
        add(900, () => {
          busy.forEach((c) => { node(c, "busy"); arm(c, "off"); });
          say(fill(busy.length > 1 ? S.say.busyMany : S.say.busyOne, { names: busyNames }));
        }, 1, "busy");
      if (!avail.length) toVM(S.say.allBusy);
      else {
        add(2200, () => {
          avail.forEach((c) => { node(c, "ring"); arm(c, "on"); });
          setState("ring");
          say(avail.length > 1 ? fill(S.say.ringingAll, { names: join(avail.map((c) => c.name)) }) : fill(S.say.ringing, { name: avail[0].name }));
        }, 6.5, "ring");
        if (st.noAnswer) {
          add(600, () => { avail.forEach((c) => { node(c, "miss"); arm(c, "off"); }); say(S.say.noAnswer, { append: true }); }, 1, "miss");
          toVM();
        } else {
          const w = avail.length >= 2 ? avail[1] : avail[0];
          add(1300, () => {
            avail.forEach((c) => { if (c === w) { node(c, "conn"); arm(c, "ok"); } else { node(c, "stop"); arm(c, "off"); } });
            setState("conn");
            say(fill(S.say.answeredFirst, { name: w.name }), { append: true });
          }, 1, "conn");
        }
      }
    } else {
      if (!avail.length) toVM(S.say.allBusy);
      else {
        const menu = avail.slice(0, 9), pick = menu.length >= 2 ? menu[1] : menu[0], key = menu.indexOf(pick) + 1;
        const phrase = menu.map((c, i) => fill(S.say.menuOption, { n: i + 1, name: c.name })).join(" ");
        add(2700, () => {
          busy.forEach((c) => { node(c, "busy"); arm(c, "off"); });
          setState("menu");
          dim(true);
          el.mq.textContent = phrase;
          el.menu.classList.add("on");
          const notIn = busy.length ? " " + fill(busy.length > 1 ? S.say.notInMenuMany : S.say.notInMenuOne, { names: busyNames }) : "";
          say(fill(S.say.hears, { phrase }) + notIn);
        }, 1.6, "menu");
        add(1000, () => { press(key); say(fill(S.say.presses, { n: key }), { append: true }); }, 1, "press");
        add(1700, () => { el.menu.classList.remove("on"); dim(false); press(null); node(pick, "ring"); arm(pick, "on"); setState("ring"); say(fill(S.say.ringing, { name: pick.name })); }, 5, "ring");
        if (st.noAnswer) {
          add(600, () => { node(pick, "miss"); arm(pick, "off"); say(S.say.noAnswer, { append: true }); }, 1, "miss");
          toVM();
        } else add(1300, () => { node(pick, "conn"); arm(pick, "ok"); setState("conn"); say(S.say.connected, { append: true }); }, 1, "conn");
      }
    }
    add(0, finish, 0, "end");
    return steps;
  }
  function finish() {
    const hadFocus = el.acts.contains(document.activeElement);
    st.running = false;
    el.fs.disabled = false;
    el.acts.hidden = true;
    el.end.hidden = false;
    if (hadFocus) el.again.focus({ preventScroll: true });
  }
  function tick() {
    cancelAnimationFrame(st.raf);
    let last = performance.now();
    const f = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (st.running && !st.paused) { st.secs += dt * st.rate; el.timer.textContent = fmt(st.secs); }
      if (st.running) st.raf = requestAnimationFrame(f);
    };
    st.raf = requestAnimationFrame(f);
  }
  function run() {
    resetView();
    st.running = true;
    runningUI(true);
    const steps = build();
    let i = 0, tmr = 0, left = 0, t0 = 0;
    const next = () => {
      if (!st.running || i >= steps.length) return;
      const s = steps[i++];
      st.rate = s.rate;
      s.fn();
      left = s.d;
      t0 = performance.now();
      if (st.running) tmr = window.setTimeout(next, left);
    };
    st.runner = {
      pause() { clearTimeout(tmr); left -= performance.now() - t0; },
      resume() { t0 = performance.now(); tmr = window.setTimeout(next, Math.max(0, left)); },
      stop() { clearTimeout(tmr); },
    };
    next();
    tick();
  }
  function move(from: number, to: number, focusSel: string) {
    const [c] = st.contacts.splice(from, 1);
    st.contacts.splice(to, 0, c);
    renderList([c.id, focusSel]);
    el.live.textContent = fill(S.aria.moved, { name: c.name, pos: to + 1, n: st.contacts.length });
  }

  /* ── events ── */
  el.seg.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-mode]");
    if (b) setMode(b.dataset.mode as Mode);
  });
  el.seg.addEventListener("keydown", (e) => {
    const d = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!d) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === "rtl" && (e.key === "ArrowLeft" || e.key === "ArrowRight");
    const bs = [...el.seg.children] as HTMLElement[];
    let i = bs.findIndex((b) => b.dataset.mode === st.mode);
    i = (i + (rtl ? -d : d) + bs.length) % bs.length;
    setMode(bs[i].dataset.mode as Mode);
    bs[i].focus();
  });
  el.na.addEventListener("click", () => setNA(!st.noAnswer));
  el.list.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches(".sim-name")) return;
    const row = input.closest<HTMLElement>(".sim-row")!, c = byId(row.dataset.id);
    c.name = input.value || "";
    const shown = c.name.trim() || S.contact;
    row.querySelector(".sim-rav")!.firstChild!.nodeValue = initials(shown);
    const nd = el.nodes.querySelector(`.sim-node[data-id="${c.id}"]`);
    if (nd) { nd.querySelector(".sim-av")!.firstChild!.nodeValue = initials(shown); nd.querySelector(".sim-nl b")!.textContent = shown; }
  });
  el.list.addEventListener("focusout", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches(".sim-name")) return;
    const c = byId(input.closest<HTMLElement>(".sim-row")!.dataset.id);
    if (!c.name.trim()) { c.name = S.contact; input.value = c.name; }
    c.name = c.name.trim();
    renderOrbit();
  });
  el.list.addEventListener("keydown", (e) => {
    const target = e.target as HTMLElement;
    if (target.matches(".sim-name") && e.key === "Enter") { e.preventDefault(); target.blur(); return; }
    const g = target.closest(".sim-grip");
    if (!g) return;
    const d = ({ ArrowUp: -1, ArrowDown: 1 } as Record<string, number>)[e.key];
    if (!d) return;
    e.preventDefault();
    const id = g.closest<HTMLElement>(".sim-row")!.dataset.id, from = st.contacts.findIndex((c) => c.id === Number(id)), to = from + d;
    if (to < 0 || to >= st.contacts.length) return;
    move(from, to, ".sim-grip");
  });
  el.list.addEventListener("click", (e) => {
    const target = e.target as Element, row = target.closest<HTMLElement>(".sim-row");
    if (!row) return;
    const c = byId(row.dataset.id);
    if (target.closest(".toggle")) {
      c.on = !c.on;
      renderList([c.id, ".toggle"]);
      el.live.textContent = fill(c.on ? S.aria.isAvailable : S.aria.isBusy, { name: c.name });
    } else if (target.closest(".sim-rm") && st.contacts.length > 1) {
      const i = st.contacts.indexOf(c);
      st.contacts.splice(i, 1);
      const nxt = st.contacts[Math.min(i, st.contacts.length - 1)];
      renderList([nxt.id, ".sim-rm"]);
      el.live.textContent = fill(S.aria.removed, { name: c.name });
    }
  });
  el.list.addEventListener("pointerdown", (e) => {
    const g = (e.target as Element).closest<HTMLElement>(".sim-grip");
    if (!g || e.button !== 0 || el.fs.disabled) return;
    const row = g.closest<HTMLElement>(".sim-row")!, rows = [...el.list.children] as HTMLElement[], from = rows.indexOf(row);
    const rects = rows.map((r) => r.getBoundingClientRect()), step = rects.length > 1 ? rects[1].top - rects[0].top : rects[0].height + 8;
    let to = from;
    const y0 = e.clientY;
    g.setPointerCapture(e.pointerId);
    row.classList.add("drag");
    e.preventDefault();
    const mv = (ev: PointerEvent) => {
      const dy = ev.clientY - y0;
      row.style.transform = `translateY(${dy}px)`;
      to = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / step)));
      rows.forEach((r, j) => {
        if (j === from) return;
        let s = 0;
        if (from < to && j > from && j <= to) s = -step;
        else if (from > to && j < from && j >= to) s = step;
        r.style.transform = s ? `translateY(${s}px)` : "";
      });
    };
    const up = () => {
      g.removeEventListener("pointermove", mv);
      g.removeEventListener("pointerup", up);
      g.removeEventListener("pointercancel", up);
      rows.forEach((r) => (r.style.transform = ""));
      row.classList.remove("drag");
      if (to !== from) move(from, to, ".sim-grip");
    };
    g.addEventListener("pointermove", mv);
    g.addEventListener("pointerup", up);
    g.addEventListener("pointercancel", up);
  });
  el.add.addEventListener("click", () => {
    if (st.contacts.length >= MAX) return;
    const used = new Set(st.contacts.map((c) => c.name));
    const p = POOL.find((x) => !used.has(x.name)) || { name: S.contact, rel: S.family };
    const c = { id: st.nextId++, name: p.name, rel: p.rel, on: true };
    st.contacts.push(c);
    renderList([c.id, ".sim-name"]);
    el.list.querySelector<HTMLInputElement>(`[data-id="${c.id}"] .sim-name`)?.select();
    el.live.textContent = fill(S.aria.added, { name: c.name, n: st.contacts.length, max: MAX });
  });
  el.go.addEventListener("click", () => { run(); el.pause.focus({ preventScroll: true }); });
  el.again.addEventListener("click", () => { run(); el.pause.focus({ preventScroll: true }); });
  el.pause.addEventListener("click", () => {
    if (!st.running || !st.runner) return;
    st.paused = !st.paused;
    el.sim.classList.toggle("is-paused", st.paused);
    if (st.paused) st.runner.pause();
    else st.runner.resume();
    el.pause.querySelector("span")!.textContent = st.paused ? S.resume : S.pause;
    el.pause.querySelector("use")!.setAttribute("href", st.paused ? "#i-play" : "#i-pause");
    el.live.textContent = st.paused ? S.aria.paused : S.aria.resumed;
  });
  el.reset.addEventListener("click", () => {
    if (st.running) { resetView(); el.go.focus({ preventScroll: true }); el.live.textContent = S.aria.stopped; return; }
    st.contacts = DEFAULTS.map((c, i) => ({ id: i + 1, ...c, on: true }));
    st.nextId = 4;
    setMode("cascade");
    setNA(false);
    renderList();
    resetView();
    el.live.textContent = S.aria.resetDone;
  });

  renderList();
  resetView();

  return () => {
    st.running = false;
    st.runner?.stop();
    clearInterval(st.txTimer);
    cancelAnimationFrame(st.raf);
  };
}
