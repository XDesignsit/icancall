/* iCanCall Dashboard — live test-call simulator */

function TestCall({ line }) {
  const [screen, setScreen] = React.useState({ cls: '', av: '\u2014', avColor: null, name: 'Ready to test', state: 'Run a test call to preview routing', ring: false });
  const [dots, setDots] = React.useState(0);
  const [activeDots, setActiveDots] = React.useState({}); // idx -> 'active'|'done'
  const [menu, setMenu] = React.useState(null); // array of contacts when in menu pick
  const [running, setRunning] = React.useState(false);
  const cancelled = React.useRef(false);
  const resolveMenu = React.useRef(null);

  const contacts = line.contacts;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  React.useEffect(() => () => { cancelled.current = true; }, []);
  // reset when line or mode changes
  React.useEffect(() => { reset(); /* eslint-disable-next-line */ }, [line.id, line.mode]);

  function reset() {
    cancelled.current = true;
    setMenu(null); setDots(0); setActiveDots({}); setRunning(false);
    setScreen({ cls: '', av: line.mode === 'menu' ? '\u2630' : '\u2014', avColor: null,
      name: line.mode === 'menu' ? 'Caller menu' : 'Ready to test',
      state: line.mode === 'menu' ? 'Run a test call to hear the options' : 'Run a test call to preview routing', ring: false });
  }

  async function ringConnect(c, idx) {
    setScreen({ cls: 'ring-state', av: initials(c.name), avColor: c.color, name: c.name, state: `Ringing ${c.rel || 'contact'}\u2026`, ring: true });
    await sleep(1500);
    if (cancelled.current) return false;
    if (c.available) {
      setScreen({ cls: 'connected', av: initials(c.name), avColor: c.color, name: c.name, state: '\u2713 Connected', ring: false });
      return true;
    }
    return false;
  }

  async function runCascade() {
    setDots(contacts.length); setActiveDots({});
    setScreen({ cls: '', av: '\u2022', name: 'Connecting\u2026', state: 'Placing the call', ring: false });
    await sleep(800);
    let done = false;
    for (let i = 0; i < contacts.length; i++) {
      if (cancelled.current) return;
      setActiveDots((d) => ({ ...d, [i]: 'active' }));
      const c = contacts[i];
      const ok = await ringConnect(c, i);
      if (cancelled.current) return;
      if (ok) { done = true; break; }
      setActiveDots((d) => ({ ...d, [i]: 'done' }));
      setScreen({ cls: 'ring-state', av: initials(c.name), avColor: c.color, name: c.name, state: 'No answer \u2014 trying next\u2026', ring: false });
      await sleep(500);
    }
    if (!done && !cancelled.current) setScreen({ cls: 'voicemail', av: '\u2709', name: 'Voicemail', state: 'Message sent \u2014 everyone alerted', ring: false });
  }

  function waitForPick() {
    return new Promise((res) => { resolveMenu.current = res; });
  }

  async function runMenu() {
    setDots(0); setActiveDots({});
    setScreen({ cls: '', av: '\u260e', name: 'Welcome', state: 'Listen for the menu\u2026', ring: false });
    await sleep(900);
    if (cancelled.current) return;
    setMenu(contacts);
    setScreen({ cls: 'menu', av: '', name: '', state: '', ring: false });
    const idx = await waitForPick();
    if (cancelled.current || idx == null) return;
    setMenu(null);
    const c = contacts[idx];
    setScreen({ cls: 'ring-state', av: initials(c.name), avColor: c.color, name: c.name, state: `Connecting to ${c.rel || c.name}\u2026`, ring: true });
    await sleep(1500);
    if (cancelled.current) return;
    if (c.available) setScreen({ cls: 'connected', av: initials(c.name), avColor: c.color, name: c.name, state: '\u2713 Connected', ring: false });
    else setScreen({ cls: 'voicemail', av: '\u2709', name: `${c.name} is busy`, state: 'Sent to voicemail \u2014 alerted', ring: false });
  }

  async function run() {
    if (running || !contacts.length) return;
    cancelled.current = false;
    setRunning(true);
    if (line.mode === 'menu') await runMenu(); else await runCascade();
    if (!cancelled.current) { await sleep(2200); }
    setRunning(false);
    reset();
  }

  const pick = (i) => { if (resolveMenu.current) { resolveMenu.current(i); resolveMenu.current = null; } };

  return (
    <div className="simwrap">
      <div className={`sim-phone ${screen.cls === 'connected' ? 'connected' : ''} ${screen.cls === 'voicemail' ? 'voicemail' : ''} ${menu ? 'menu' : ''}`}>
        {menu ? (
          <div className="sim-menu">
            <div className="t">Thanks for calling. Choose who to reach:</div>
            {menu.map((c, i) => (
              <button className="sim-opt" key={c.id} onClick={() => pick(i)}>
                <span className="digit">{i + 1}</span>
                <span><b>Press {i + 1} — {c.name}</b><small>{c.rel || 'Contact'}</small></span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <span className="numline">{line.number}</span>
            <div className={`sim-ava ${screen.ring ? 'ring' : ''}`} style={{ background: screen.avColor || undefined }}>{screen.av}</div>
            <div className="sim-name">{screen.name}</div>
            <div className="sim-state">{screen.state}</div>
            {dots > 0 && (
              <div className="sim-dots">
                {Array.from({ length: dots }).map((_, i) => (
                  <i key={i} className={activeDots[i] || ''} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sim-side">
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6 }}>
            {line.mode === 'menu' ? 'MENU ORDER' : 'CASCADE ORDER'}
          </div>
          {contacts.map((c, i) => (
            <div className="preview-row" key={c.id}>
              <span className="dg">{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: '0.86rem', display: 'block' }}>{c.name}</b>
                <span style={{ fontSize: '0.76rem', color: 'var(--ink-faint)' }}>{c.rel}</span>
              </div>
              {!c.available && <span className="badge badge-gray"><span className="d"></span>Busy</span>}
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={run} disabled={running || !contacts.length}>
          <Icon name="phone" /> {running ? 'Calling\u2026' : 'Run a test call'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { TestCall });
