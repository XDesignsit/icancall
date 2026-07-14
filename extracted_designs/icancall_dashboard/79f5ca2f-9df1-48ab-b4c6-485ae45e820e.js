/* iCanCall Dashboard — app shell */

const NAV = [
  { group: 'Manage', items: [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'contacts', label: 'Contacts', icon: 'contacts' },
    { id: 'routing', label: 'Routing', icon: 'routing' },
  ]},
  { group: 'Activity', items: [
    { id: 'log', label: 'Call log', icon: 'log', badge: true },
  ]},
  { group: 'Configure', items: [
    { id: 'settings', label: 'Greetings & alerts', icon: 'settings' },
    { id: 'account', label: 'Account & billing', icon: 'user' },
  ]},
];

const TITLES = {
  overview: ['Overview', 'Welcome back, Maria'],
  contacts: ['Contacts', 'Manage who can be reached'],
  routing: ['Routing', 'Choose how callers connect'],
  log: ['Call log', 'Every call, including missed attempts'],
  settings: ['Greetings & alerts', 'Greeting and notification settings'],
  account: ['Account', 'Profile, security and billing'],
};

const LINE_SCOPED = { overview: false, contacts: true, routing: true, log: true, settings: true, account: false };

function App() {
  const [lines, setLines] = React.useState(INITIAL_LINES);
  const [activeLineId, setActiveLineId] = React.useState('mom');
  const [log] = React.useState(INITIAL_LOG);
  const [view, setView] = React.useState('contacts');
  const [acctTab, setAcctTab] = React.useState('profile');
  const [account, setAccount] = React.useState({
    name: 'Maria Delgado', preferred: 'Maria', role: 'Primary caregiver',
    email: 'maria.delgado@email.com', notifyEmail: 'maria.delgado@email.com',
    phone: '(415) 555-0192', address: '482 Linden Ave, Oakland, CA 94607',
    timezone: 'Pacific (PT)', language: 'English', twoFactor: true,
    card: { brand: 'Visa', last4: '4242', exp: '08 / 27' },
    billingAddr: '482 Linden Ave, Oakland, CA 94607',
    addons: { extraNumbers: 1, minuteBlocks: 2, usedMin: 41, rolloverMin: 18 },
  });
  const [toast, setToast] = React.useState(null);
  const [switchOpen, setSwitchOpen] = React.useState(false);
  const switchRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (switchRef.current && !switchRef.current.contains(event.target)) {
        setSwitchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const [sideOpen, setSideOpen] = React.useState(false);
  const toastTimer = React.useRef(null);

  const line = lines.find((l) => l.id === activeLineId) || lines[0];
  const setLine = (updater) => setLines((prev) => prev.map((l) => l.id === activeLineId ? updater(l) : l));

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const missedCount = (log[activeLineId] || []).filter((c) => c.status !== 'connected').length;

  const go = (v) => { setView(v); setSideOpen(false); };

  const signOut = () => { showToast('Signing out…'); setTimeout(() => { window.location.href = 'iCanCall Login.html'; }, 750); };

  const [t1, t2] = TITLES[view];

  return (
    <div className="dash">
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="mark"><Icon name="shield" width="18" height="18" stroke="#fff" /></span>
          <span>i<b>Can</b>Call</span>
        </div>

        {NAV.map((grp) => (
          <React.Fragment key={grp.group}>
            <div className="nav-group-label">{grp.group}</div>
            <div className="nav">
              {grp.items.map((it) => (
                <button key={it.id} className={`nav-item ${view === it.id ? 'active' : ''}`} onClick={() => go(it.id)}>
                  <Icon name={it.icon} />
                  {it.label}
                  {it.badge && missedCount > 0 && <span className="badge-dot">{missedCount}</span>}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}

        <div className="sidebar-foot">
          <div className="plan-card">
            <div className="row">
              <span className="pill">Pro plan</span>
              <span style={{ fontSize: '0.78rem', color: 'oklch(0.82 0.02 225)' }}>{lines.length}/2 numbers</span>
            </div>
            <button className="upgrade" onClick={() => { setAcctTab('billing'); go('account'); }}>Manage plan</button>
          </div>
          <button className="signout-row" onClick={signOut}>
            <Icon name="logout" width="18" height="18" /> Sign out
          </button>
        </div>
      </aside>

      <div className={`scrim ${sideOpen ? 'show' : ''}`} onClick={() => setSideOpen(false)}></div>

      <div className="main">
        <div className="topbar">
          <button className="iconbtn menu-btn" onClick={() => setSideOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <div className="page-title">
            <h1>{t1}</h1>
            <p>{LINE_SCOPED[view] ? line.label + ' · ' + line.person : t2}</p>
          </div>
          <div className="topbar-spacer"></div>

          {/* number switcher */}
          <div ref={switchRef} className={`numswitch ${switchOpen ? 'open' : ''}`}>
            <button className="numswitch-btn" onClick={() => setSwitchOpen((o) => !o)}>
              <span className="ava" style={{ background: line.color }}>{initials(line.person)}</span>
              <span className="meta"><b>{line.label}</b><span>{line.number}</span></span>
              <span className="chev"><Icon name="chev" width="16" height="16" /></span>
            </button>
            {switchOpen && (
              <div className="numswitch-menu">
                {lines.map((l) => (
                  <div key={l.id} className={`numswitch-opt ${l.id === activeLineId ? 'sel' : ''}`} onClick={() => { setActiveLineId(l.id); setSwitchOpen(false); }}>
                    <span className="ava" style={{ background: l.color }}>{initials(l.person)}</span>
                    <span className="meta"><b>{l.label}</b><span>{l.number}</span></span>
                    {l.id === activeLineId && <span className="tick"><Icon name="check" width="17" height="17" /></span>}
                  </div>
                ))}
                <button className="add-num" onClick={() => { setSwitchOpen(false); showToast('Add-a-number is available on Pro — contact support'); }}>
                  <Icon name="plus" width="16" height="16" /> Add another number
                </button>
              </div>
            )}
          </div>

          <button className="iconbtn" onClick={() => go('log')} aria-label="Notifications">
            <Icon name="bell" />
            {missedCount > 0 && <span className="dot"></span>}
          </button>
          <div className="user-chip clickable" onClick={() => go('account')}>
            <span className="ava">MD</span>
            <span className="who"><b>Maria Delgado</b><span>Account owner</span></span>
          </div>
          <button className="iconbtn signout-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
        </div>

        <div className="content">
          {view === 'overview' && <OverviewView lines={lines} log={log} line={line} setView={go} setActiveLineId={setActiveLineId} />}
          {view === 'contacts' && <ContactsView line={line} setLine={setLine} showToast={showToast} />}
          {view === 'routing' && <RoutingView line={line} setLine={setLine} showToast={showToast} />}
          {view === 'log' && <CallLogView line={line} log={log} />}
          {view === 'settings' && <SettingsView line={line} setLine={setLine} showToast={showToast} />}
          {view === 'account' && <AccountView account={account} setAccount={setAccount} showToast={showToast} tab={acctTab} setTab={setAcctTab} />}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
