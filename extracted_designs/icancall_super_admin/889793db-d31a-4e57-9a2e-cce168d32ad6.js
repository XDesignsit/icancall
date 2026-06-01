/* iCanCall — Super Admin · app shell, nav, routing, tweaks */

const { useState: useStateApp, useEffect: useEffectApp } = React;

const ADMIN_NAV = [
  { group: 'Analytics', items: [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'revenue',  label: 'Revenue & billing', icon: 'dollar' },
    { id: 'health',   label: 'Reliability', icon: 'pulse' },
    { id: 'twilio',   label: 'Twilio', icon: 'cloud' },
  ] },
  { group: 'Customers', items: [
    { id: 'accounts', label: 'Accounts', icon: 'accounts' },
  ] },
];

const ADMIN_TITLES = {
  overview: ['Overview', 'Platform analytics · last 30 days'],
  accounts: ['Accounts', 'All customer accounts'],
  account:  ['Account detail', 'Customer record'],
  revenue:  ['Revenue & billing', 'MRR, plans & collections'],
  health:   ['Reliability', 'Call & system health'],
  twilio:   ['Twilio', 'Carrier usage, billing & cost analytics'],
};

const ADMIN_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "range": "30d"
}/*EDITMODE-END*/;

function AdminApp() {
  const [t, setTweak] = useTweaks(ADMIN_TWEAK_DEFAULTS);
  const [view, setView] = useStateApp('overview');
  const [selId, setSelId] = useStateApp(null);
  const [sideOpen, setSideOpen] = useStateApp(false);
  const [toast, setToast] = useStateApp('');
  const [range, setRange] = useStateApp(ADMIN_TWEAK_DEFAULTS.range);

  useEffectApp(() => { if (t.range) setRange(t.range); }, [t.range]);

  const showToast = (m) => { setToast(m); clearTimeout(window.__atoast); window.__atoast = setTimeout(() => setToast(''), 2600); };

  const go = (v) => { setView(v); setSideOpen(false); const el = document.querySelector('.content'); if (el) el.scrollTop = 0; };
  const openAccount = (id, dest) => {
    if (dest) { go(dest); return; }
    if (id) { setSelId(id); go('account'); }
  };

  const sel = ACCOUNTS.find((a) => a.id === selId);
  const [t1, t2] = view === 'account' && sel ? ['Account detail', sel.owner] : ADMIN_TITLES[view];

  return (
    <div className={'dash' + (t.density === 'compact' ? ' compact' : '')}>
      <div className={'scrim' + (sideOpen ? ' show' : '')} onClick={() => setSideOpen(false)}></div>

      <aside className={'sidebar' + (sideOpen ? ' open' : '')}>
        <div className="brand">
          <span className="mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"/></svg></span>
          <span>i<b>Can</b>Call</span>
        </div>
        <div className="admin-id">
          <span className="pill">Super Admin</span>
          <span className="env"><span className="d"></span>Production</span>
        </div>

        {ADMIN_NAV.map((grp) => (
          <div key={grp.group}>
            <div className="nav-group-label">{grp.group}</div>
            <div className="nav">
              {grp.items.map((it) => (
                <button key={it.id} className={'nav-item ' + (view === it.id || (view === 'account' && it.id === 'accounts') ? 'active' : '')} onClick={() => go(it.id)}>
                  <Icon name={it.icon} />{it.label}
                  {it.id === 'revenue' && PAST_DUE.length > 0 && <span className="badge-dot">{PAST_DUE.length}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sidebar-foot">
          <div className="admin-footchip">
            <span className="ava">AV</span>
            <div className="who"><b>Alex Vance</b><span>Platform owner</span></div>
            <button className="out" aria-label="Sign out" onClick={() => showToast('Signing out…')}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="iconbtn menu-btn" onClick={() => setSideOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <div className="page-title"><h1>{t1}</h1><p>{t2}</p></div>
          <div className="topbar-spacer"></div>
          <div className="gsearch">
            <Icon name="search" />
            <input placeholder="Search accounts…" onKeyDown={(e) => { if (e.key === 'Enter') go('accounts'); }} onFocus={() => { if (view !== 'accounts' && view !== 'account') go('accounts'); }} />
          </div>
          <div className="range-seg">
            {['30d', '90d', '12mo'].map((r) => (
              <button key={r} className={range === r ? 'active' : ''} onClick={() => { setRange(r); setTweak('range', r); }}>{r}</button>
            ))}
          </div>
          <button className="iconbtn" aria-label="Alerts"><Icon name="bell" /><span className="dot"></span></button>
        </div>

        <div className="content">
          <div className="content-inner wide">
            {view === 'overview' && <OverviewView openAccount={openAccount} />}
            {view === 'accounts' && <AccountsView openAccount={openAccount} />}
            {view === 'account' && <AccountDetailView accountId={selId} onBack={() => go('accounts')} showToast={showToast} />}
            {view === 'revenue' && <RevenueView openAccount={openAccount} />}
            {view === 'health' && <HealthView />}
            {view === 'twilio' && <TwilioView />}
          </div>
        </div>
      </div>

      <Toast msg={toast} />

      <TweaksPanel>
        <TweakSection label="Display" />
        <TweakRadio label="Density" value={t.density} options={['comfortable', 'compact']} onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Default period" />
        <TweakRadio label="Range" value={t.range} options={['30d', '90d', '12mo']} onChange={(v) => setTweak('range', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
