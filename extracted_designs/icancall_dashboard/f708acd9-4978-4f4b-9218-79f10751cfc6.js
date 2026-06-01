/* iCanCall Dashboard — Overview / home view */

function StatCard({ icon, iconBg, iconColor, val, lbl, trend, trendDir }) {
  return (
    <div className="stat">
      <div className="ic" style={{ background: iconBg, color: iconColor }}><Icon name={icon} /></div>
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
      {trend && <div className={`trend trend-${trendDir}`}>{trend}</div>}
    </div>
  );
}

function OverviewView({ lines, log, line, setView, setActiveLineId }) {
  const allCalls = Object.values(log).flat();
  const totalThisWeek = allCalls.length;
  const missed = allCalls.filter((c) => c.status !== 'connected').length;
  const connectRate = Math.round(((totalThisWeek - missed) / totalThisWeek) * 100);
  const totalContacts = lines.reduce((s, l) => s + l.contacts.length, 0);

  const recent = (log[line.id] || []).slice(0, 5);

  return (
    <div className="content-inner">
      <div className="stat-grid section-gap">
        <StatCard icon="phone" iconBg="var(--tint)" iconColor="var(--blue-deep)" val={totalThisWeek} lbl="Calls this week" trend="▲ 18% vs last week" trendDir="up" />
        <StatCard icon="check" iconBg="oklch(0.95 0.05 158)" iconColor="oklch(0.45 0.13 158)" val={`${connectRate}%`} lbl="Connected on first try" trend="▲ 6%" trendDir="up" />
        <StatCard icon="alert" iconBg="oklch(0.96 0.05 22)" iconColor="var(--rose)" val={missed} lbl="Missed → alerted" trend="▼ 2 vs last week" trendDir="down" />
        <StatCard icon="contacts" iconBg="oklch(0.96 0.04 285)" iconColor="var(--violet)" val={totalContacts} lbl="Trusted contacts" trend={`across ${lines.length} numbers`} trendDir="up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }} className="ov-cols">
        {/* lines status */}
        <div className="card">
          <div className="card-head"><div><h2>Your numbers</h2><p>{lines.length} of 2 included on Pro</p></div></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.map((l) => {
              return (
                <div key={l.id} className="crow" style={{ cursor: 'pointer' }} onClick={() => { setActiveLineId(l.id); setView('contacts'); }}>
                  <Avatar name={l.person} color={l.color} size={42} radius="11px" />
                  <div className="info">
                    <b>{l.label}</b>
                    <div className="rel">{l.person}</div>
                    <div className="tel">{l.number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge kind={l.mode === 'menu' ? 'blue' : 'amber'}>{l.mode === 'menu' ? 'Caller menu' : 'Cascade'}</Badge>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-faint)', marginTop: 6 }}>{l.contacts.length} contacts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* recent activity */}
        <div className="card">
          <div className="card-head">
            <div><h2>Recent calls</h2><p>{line.label}</p></div>
            <button className="btn btn-soft btn-sm" onClick={() => setView('log')}>View all</button>
          </div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {recent.map((c) => {
              const m = STATUS_META[c.status];
              return (
                <div className="logrow" key={c.id} style={{ gridTemplateColumns: '40px 1fr auto' }}>
                  <div className={`dir ${m.dirCls}`}><Icon name={c.status === 'voicemail' ? 'voicemail' : c.status === 'missed' ? 'alert' : 'in'} /></div>
                  <div className="who"><b>{c.routed}</b><span>{c.caller} · {c.when}</span></div>
                  <Badge kind={m.badge.replace('badge-', '')}>{m.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px){ .ov-cols{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

Object.assign(window, { OverviewView, StatCard });
