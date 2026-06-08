/* ===========================================================
   iCanCall — interactions
   =========================================================== */

/* ---- Header shadow on scroll ---- */
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---- Scroll reveal ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---- FAQ accordion ---- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((other) => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

/* ---- Routing demo animation ---- */
(function routingDemo() {
  const demo = document.getElementById('demo');
  if (!demo) return;
  const status = demo.querySelector('.demo-status .txt');
  const contacts = [...demo.querySelectorAll('.contact')];
  const states = contacts.map((c) => c.querySelector('.state'));

  // which contact answers each loop (cycles so the demo feels alive)
  const answerPlan = [1, 0, 2, 1, 3];
  let planIdx = 0;

  const reset = () => {
    demo.classList.remove('is-connected');
    contacts.forEach((c) => { c.className = 'contact'; });
    states.forEach((s) => { s.textContent = 'Standing by'; });
    status.textContent = 'Incoming call';
    demo.querySelector('.demo-status').classList.remove('done');
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function run() {
    while (true) {
      reset();
      const answerAt = answerPlan[planIdx % answerPlan.length];
      planIdx++;
      await sleep(1100);
      status.textContent = 'Routing\u2026';

      for (let i = 0; i < contacts.length; i++) {
        // ring this contact
        contacts[i].classList.add('is-ringing');
        states[i].textContent = 'Ringing\u2026';
        await sleep(1500);

        if (i === answerAt) {
          contacts[i].classList.remove('is-ringing');
          contacts[i].classList.add('is-connected');
          states[i].textContent = 'Connected \u2713';
          status.textContent = 'Connected';
          demo.classList.add('is-connected');
          break;
        } else {
          contacts[i].classList.remove('is-ringing');
          contacts[i].classList.add('is-missed');
          states[i].textContent = 'No answer';
          await sleep(360);
        }
      }
      await sleep(2600);
    }
  }

  // honor reduced motion: show a connected steady state
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reset();
    contacts[1].classList.add('is-connected');
    states[1].textContent = 'Connected \u2713';
    status.textContent = 'Connected';
    demo.classList.add('is-connected');
  } else {
    run();
  }
})();

/* ---- Interactive circle builder + call simulator ---- */
(function circleBuilder() {
  const listEl = document.getElementById('circle-list');
  if (!listEl) return;

  const palette = [
    'oklch(0.58 0.115 232)', 'oklch(0.62 0.10 198)', 'oklch(0.55 0.11 280)',
    'oklch(0.60 0.12 30)', 'oklch(0.58 0.12 145)', 'oklch(0.55 0.12 330)'
  ];
  let uid = 0;
  const defaults = (Array.isArray(window.IC_DEFAULT_CONTACTS) && window.IC_DEFAULT_CONTACTS.length)
    ? window.IC_DEFAULT_CONTACTS
    : [
        { name: 'Sarah R.', rel: 'Daughter', available: false, timeSlot: 'day' },
        { name: 'David M.', rel: 'Son', available: true, timeSlot: 'day' },
        { name: 'Lena N.', rel: 'Neighbor', available: true, timeSlot: 'always' },
        { name: 'Dr. Patel', rel: 'Care team', available: true, timeSlot: 'night' },
      ];
  let contacts = defaults.map((c) => ({ id: ++uid, name: c.name, rel: c.rel, available: c.available !== false, timeSlot: c.timeSlot || 'always' }));
  let calling = false;
  let mode = 'cascade';

  const ccount = document.getElementById('ccount');
  const form = document.getElementById('add-form');
  const nameIn = document.getElementById('add-name');
  const relIn = document.getElementById('add-rel');
  const screen = document.getElementById('sim-screen');
  let simAvatar = document.getElementById('sim-avatar');
  let simName = document.getElementById('sim-name');
  let simState = document.getElementById('sim-state');
  let simDots = document.getElementById('sim-dots');
  const callBtn = document.getElementById('place-call');
  const simHint = document.querySelector('.sim-hint');

  function rebindScreenRefs() {
    simAvatar = screen.querySelector('#sim-avatar') || document.getElementById('sim-avatar');
    simName = screen.querySelector('#sim-name') || document.getElementById('sim-name');
    simState = screen.querySelector('#sim-state') || document.getElementById('sim-state');
    simDots = screen.querySelector('#sim-dots') || document.getElementById('sim-dots');
  }

  const initials = (n) => n.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colorOf = (i) => palette[i % palette.length];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function render() {
    ccount.textContent = contacts.length;
    if (!contacts.length) {
      listEl.innerHTML = '<div class="circle-empty">Add up to six trusted contacts to build your circle.</div>';
      return;
    }
    listEl.innerHTML = '';
    contacts.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'circle-row';
      row.dataset.id = c.id;

      let actionHtml = '';
      if (mode === 'schedule') {
        actionHtml = `
          <select class="slot-select" data-act="slot" style="background: var(--bg); border: 1px solid var(--line); color: var(--ink-soft); padding: 6px 8px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; outline: none; font-family: var(--font); margin-right: 4px;">
            <option value="day" ${c.timeSlot === 'day' ? 'selected' : ''}>☀️ Day</option>
            <option value="night" ${c.timeSlot === 'night' ? 'selected' : ''}>🌙 Night</option>
            <option value="always" ${c.timeSlot === 'always' ? 'selected' : ''}>⏰ 24/7</option>
          </select>
        `;
      } else {
        actionHtml = `
          <button type="button" class="avail ${c.available ? 'on' : ''}" data-act="avail" aria-pressed="${c.available}" title="Toggle availability">
            <span class="track"></span>
            <span class="lbl">${c.available ? 'Available' : 'Busy'}</span>
          </button>
        `;
      }

      row.innerHTML = `
        <span class="avatar" style="background:${colorOf(i)}">${initials(c.name)}</span>
        <span class="who"><b>${escapeHtml(c.name)}</b><span>${escapeHtml(c.rel) || 'Contact'}</span></span>
        ${actionHtml}
        <span class="row-tools">
          <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up" title="Move up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg></button>
          <button class="icon-btn" data-act="down" ${i === contacts.length - 1 ? 'disabled' : ''} aria-label="Move down" title="Move down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg></button>
          <button class="icon-btn danger" data-act="remove" aria-label="Remove" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/></svg></button>
        </span>`;
      listEl.appendChild(row);
    });
    [...listEl.querySelectorAll('.icon-btn, .avail, .slot-select')].forEach((el) => { el.disabled = calling || el.disabled; });
  }

  function escapeHtml(s) { return (s || '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

  listEl.addEventListener('click', (e) => {
    if (calling) return;
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const row = e.target.closest('.circle-row');
    const id = Number(row.dataset.id);
    const idx = contacts.findIndex((c) => c.id === id);
    const act = btn.dataset.act;
    if (act === 'remove') contacts.splice(idx, 1);
    else if (act === 'avail') contacts[idx].available = !contacts[idx].available;
    else if (act === 'up' && idx > 0) [contacts[idx - 1], contacts[idx]] = [contacts[idx], contacts[idx - 1]];
    else if (act === 'down' && idx < contacts.length - 1) [contacts[idx + 1], contacts[idx]] = [contacts[idx], contacts[idx + 1]];
    render();
  });

  listEl.addEventListener('change', (e) => {
    if (calling) return;
    const select = e.target.closest('.slot-select');
    if (!select) return;
    const row = e.target.closest('.circle-row');
    const id = Number(row.dataset.id);
    const idx = contacts.findIndex((c) => c.id === id);
    contacts[idx].timeSlot = select.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (calling || contacts.length >= 6) return;
    const name = nameIn.value.trim();
    if (!name) return;
    contacts.push({ id: ++uid, name, rel: relIn.value.trim(), available: true, timeSlot: 'always' });
    nameIn.value = ''; relIn.value = '';
    render();
    nameIn.focus();
  });

  function setScreen({ av, avColor, name, state, cls }) {
    screen.className = 'sim-screen' + (cls ? ' ' + cls : '');
    simAvatar.textContent = av;
    simAvatar.style.background = avColor || 'oklch(1 0 0 / 0.16)';
    simAvatar.classList.toggle('ringing', cls === 'ringing-state');
    simName.textContent = name;
    simState.textContent = state;
  }
  function buildDots(n) {
    simDots.innerHTML = '';
    for (let i = 0; i < n; i++) { const d = document.createElement('i'); simDots.appendChild(d); }
  }
  function markDot(i, klass) {
    const d = simDots.children[i];
    if (d) { d.className = ''; d.classList.add(klass); }
  }

  async function placeCall() {
    if (calling) return;
    if (!contacts.length) {
      setScreen({ av: '!', name: 'No contacts', state: 'Add someone to your circle first', cls: 'voicemail' });
      return;
    }
    calling = true;
    callBtn.disabled = true;
    callBtn.style.opacity = '0.6';
    document.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = true; });
    render();

    if (mode === 'menu') await runMenu();
    else if (mode === 'schedule') await runSchedule();
    else await runCascade();

    listEl.querySelectorAll('.circle-row').forEach((r) => r.classList.remove('is-ringing', 'is-missed', 'is-connected'));
    calling = false;
    callBtn.disabled = false;
    callBtn.style.opacity = '';
    document.querySelectorAll('.seg-btn').forEach((b) => { b.disabled = false; });
    render();
    resetSim();
  }

  /* --- cascade: ring each in order until someone answers --- */
  async function runCascade() {
    screen.classList.remove('menu-mode');
    buildDots(contacts.length);
    setScreen({ av: '\u2022', name: 'Connecting\u2026', state: 'Placing your call' });
    await sleep(900);

    let connected = false;
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const row = listEl.querySelector(`.circle-row[data-id="${c.id}"]`);
      markDot(i, 'active');
      row && row.classList.add('is-ringing');
      setScreen({ av: initials(c.name), avColor: colorOf(i), name: c.name, state: `Ringing ${c.rel || 'contact'}\u2026`, cls: 'ringing-state' });
      await sleep(1500);

      if (c.available) {
        row && row.classList.replace('is-ringing', 'is-connected');
        setScreen({ av: initials(c.name), avColor: colorOf(i), name: c.name, state: '\u2713 Connected \u2014 say hello!', cls: 'connected' });
        connected = true;
        break;
      } else {
        row && row.classList.replace('is-ringing', 'is-missed');
        markDot(i, 'done');
        setScreen({ av: initials(c.name), avColor: colorOf(i), name: c.name, state: 'No answer \u2014 trying next\u2026', cls: 'ringing-state' });
        await sleep(550);
      }
    }
    if (!connected) setScreen({ av: '\u2709', name: 'Voicemail', state: 'Message sent \u2014 whole circle alerted', cls: 'voicemail' });
    await sleep(2400);
  }

  /* --- schedule: route based on daytime/nighttime --- */
  async function runSchedule() {
    screen.classList.remove('menu-mode');
    
    // Filter contacts that are active for the simulated schedule time
    const activeContacts = contacts.filter(c => c.timeSlot === scheduleTime || c.timeSlot === 'always');

    if (scheduleTime === 'day') {
      buildDots(activeContacts.length);
      setScreen({ av: '☀️', name: 'Daytime Routing', state: 'Routing to daytime contacts\u2026' });
      await sleep(1000);

      if (activeContacts.length === 0) {
        setScreen({ av: '!', name: 'No daytime contacts', state: 'No contacts active during day', cls: 'voicemail' });
        await sleep(2000);
        return;
      }

      let connected = false;
      for (let i = 0; i < activeContacts.length; i++) {
        const c = activeContacts[i];
        const row = listEl.querySelector(`.circle-row[data-id="${c.id}"]`);
        markDot(i, 'active');
        row && row.classList.add('is-ringing');
        setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: `Ringing ${c.rel || 'contact'} (Daytime)\u2026`, cls: 'ringing-state' });
        await sleep(1500);

        if (c.available) {
          row && row.classList.replace('is-ringing', 'is-connected');
          setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: '\u2713 Connected \u2014 say hello!', cls: 'connected' });
          connected = true;
          break;
        } else {
          row && row.classList.replace('is-ringing', 'is-missed');
          markDot(i, 'done');
          setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: 'No answer \u2014 trying next\u2026', cls: 'ringing-state' });
          await sleep(550);
        }
      }
      if (!connected) setScreen({ av: '\u2709', name: 'Voicemail', state: 'Message sent \u2014 whole circle alerted', cls: 'voicemail' });
      await sleep(2400);
    } else {
      buildDots(activeContacts.length);
      setScreen({ av: '🌙', name: 'Nighttime Routing', state: 'Routing to nighttime contacts\u2026' });
      await sleep(1000);

      if (activeContacts.length === 0) {
        setScreen({ av: '!', name: 'No night contacts', state: 'No contacts active during night', cls: 'voicemail' });
        await sleep(2000);
        return;
      }

      let connected = false;
      for (let i = 0; i < activeContacts.length; i++) {
        const c = activeContacts[i];
        const row = listEl.querySelector(`.circle-row[data-id="${c.id}"]`);
        markDot(i, 'active');
        row && row.classList.add('is-ringing');
        setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: `Ringing ${c.rel || 'contact'} (Nighttime)\u2026`, cls: 'ringing-state' });
        await sleep(1500);

        if (c.available) {
          row && row.classList.replace('is-ringing', 'is-connected');
          setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: '\u2713 Connected \u2014 say hello!', cls: 'connected' });
          connected = true;
          break;
        } else {
          row && row.classList.replace('is-ringing', 'is-missed');
          markDot(i, 'done');
          setScreen({ av: initials(c.name), avColor: colorOf(contacts.indexOf(c)), name: c.name, state: 'No answer \u2014 trying next\u2026', cls: 'ringing-state' });
          await sleep(550);
        }
      }
      if (!connected) setScreen({ av: '\u2709', name: 'Voicemail', state: 'Message sent \u2014 whole circle alerted', cls: 'voicemail' });
      await sleep(2400);
    }
  }

  /* --- menu: caller hears options and picks who to reach --- */
  async function runMenu() {
    screen.classList.remove('menu-mode');
    setScreen({ av: '\u260e', name: 'Welcome', state: 'Listen for the menu\u2026' });
    buildDots(0);
    await sleep(1100);

    const choice = await showMenu();
    if (choice == null) return; // shouldn't happen

    const c = contacts[choice];
    screen.classList.remove('menu-mode');
    const row = listEl.querySelector(`.circle-row[data-id="${c.id}"]`);
    row && row.classList.add('is-ringing');
    setScreen({ av: initials(c.name), avColor: colorOf(choice), name: c.name, state: `Connecting you to ${c.rel || c.name}\u2026`, cls: 'ringing-state' });
    await sleep(1600);

    if (c.available) {
      row && row.classList.replace('is-ringing', 'is-connected');
      setScreen({ av: initials(c.name), avColor: colorOf(choice), name: c.name, state: '\u2713 Connected \u2014 say hello!', cls: 'connected' });
    } else {
      row && row.classList.replace('is-ringing', 'is-missed');
      setScreen({ av: '\u2709', name: `${c.name} is busy`, state: 'Voicemail sent \u2014 they\u2019ve been alerted', cls: 'voicemail' });
    }
    await sleep(2400);
  }

  /* render the tappable caller menu inside the sim screen and await a pick */
  function showMenu() {
    return new Promise((resolve) => {
      screen.className = 'sim-screen menu-mode';
      simAvatar.classList.remove('ringing');
      screen.innerHTML = '<div class="sim-menu" id="sim-menu"></div>';
      const menu = screen.querySelector('#sim-menu');
      const title = document.createElement('div');
      title.className = 'menu-title';
      title.textContent = 'Thanks for calling. Choose who to reach:';
      menu.appendChild(title);
      contacts.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sim-opt';
        b.innerHTML = `<span class="digit">${i + 1}</span><span class="opt-who"><b>Press ${i + 1} \u2014 ${escapeHtml(c.name)}</b><small>${escapeHtml(c.rel) || 'Contact'}</small></span>`;
        b.addEventListener('click', () => { restoreScreen(); resolve(i); }, { once: true });
        menu.appendChild(b);
      });
    });
  }

  /* rebuild the static screen markup after the menu is dismissed */
  function restoreScreen() {
    screen.className = 'sim-screen';
    screen.innerHTML = `
      <span class="num-line">(415) 200-CARE</span>
      <div class="sim-avatar" id="sim-avatar">\u2014</div>
      <div class="sim-name" id="sim-name">Ready</div>
      <div class="sim-state" id="sim-state">Press call to start routing</div>
      <div class="sim-dots" id="sim-dots"></div>`;
    rebindScreenRefs();
  }

  function resetSim() {
    restoreScreen();
    buildDots(0);
    if (mode === 'menu') {
      simName.textContent = 'Caller menu';
      simState.textContent = 'Place a call to hear the options';
      simAvatar.textContent = '\u2630';
    } else if (mode === 'schedule') {
      simName.textContent = scheduleTime === 'day' ? 'Daytime routing' : 'Nighttime routing';
      simState.textContent = scheduleTime === 'day'
        ? 'Calls cascade to family. Press call to start.'
        : 'Calls route to Care Team. Press call to start.';
      simAvatar.textContent = scheduleTime === 'day' ? '☀️' : '🌙';
    } else {
      simName.textContent = 'Ready';
      simState.textContent = 'Press call to start routing';
      simAvatar.textContent = '\u2014';
    }
  }

  callBtn.addEventListener('click', placeCall);

  const timeSelector = document.getElementById('schedule-time-selector');
  let scheduleTime = 'day';
  if (timeSelector) {
    timeSelector.querySelectorAll('.seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (calling) return;
        scheduleTime = b.dataset.time;
        timeSelector.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
        resetSim();
      });
    });
  }

  const modeSelector = document.querySelector('div[aria-label="Routing mode"]');
  const modeBtns = modeSelector.querySelectorAll('.seg-btn');
  modeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      if (calling) return;
      mode = b.dataset.mode;
      modeBtns.forEach((x) => x.classList.toggle('active', x === b));
      if (timeSelector) {
        timeSelector.style.display = mode === 'schedule' ? 'inline-flex' : 'none';
      }
      simHint.textContent = mode === 'menu'
        ? 'Callers pick who to reach. Flip a contact to \u201cBusy\u201d to send them to voicemail.'
        : mode === 'schedule'
        ? 'Daytime calls cascade to family. Nighttime calls route directly to the caregiver.'
        : 'Toggle contacts to \u201cBusy\u201d to see the cascade skip ahead.';
      render();
      resetSim();
    });
  });

  render();
  resetSim();
})();

/* ---- Billing cycle toggle ---- */
(function billingToggle() {
  const toggle = document.getElementById('bill-toggle');
  if (!toggle) return;
  const plans = [...document.querySelectorAll('.plan[data-m-amt]')];

  function apply(cycle) {
    const p = cycle === 'annual' ? 'a' : 'm';
    plans.forEach((plan) => {
      plan.querySelector('.amt').textContent = plan.dataset[p + 'Amt'];
      plan.querySelector('.per').textContent = plan.dataset[p + 'Per'];
      plan.querySelector('.price-yr').textContent = plan.dataset[p + 'Note'];
    });
    toggle.querySelectorAll('.bill-btn').forEach((b) => b.classList.toggle('active', b.dataset.cycle === cycle));
    // carry the chosen billing cycle into onboarding
    document.querySelectorAll('a.plan-select').forEach((a) => {
      a.href = a.href.replace(/billing=(monthly|annual)/, 'billing=' + cycle);
    });
  }

  toggle.querySelectorAll('.bill-btn').forEach((b) => {
    b.addEventListener('click', () => apply(b.dataset.cycle));
  });
})();

/* ---- Year ---- */
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
