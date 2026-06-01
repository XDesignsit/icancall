/* iCanCall — Super Admin · System health & call reliability */

function Ring({ pct, color = 'var(--green)', size = 40 }) {
  const r = (size - 6) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const len = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--tint)" strokeWidth="5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${len} ${circ - len}`} />
    </svg>
  );
}

function HealthView() {
  const maxVol = Math.max(...HEALTH.callVolume);
  return (
    <>
      <div className="health-tiles section-gap">
        <div className="htile">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.05 158)', color: 'oklch(0.45 0.13 158)' }}><Icon name="server" /></span><Ring pct={HEALTH.uptime} /></div>
          <div className="v">{HEALTH.uptime}%</div>
          <div className="l">Platform uptime · 30d</div>
        </div>
        <div className="htile">
          <div className="top"><span className="ic" style={{ background: 'var(--tint)', color: 'var(--blue-deep)' }}><Icon name="phone" /></span><Ring pct={HEALTH.connectRate} color="var(--blue)" /></div>
          <div className="v">{HEALTH.connectRate}%</div>
          <div className="l">Call connection rate</div>
        </div>
        <div className="htile">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.02 255)', color: 'var(--blue-deep)' }}><Icon name="voicemail" /></span><Ring pct={HEALTH.voicemailRate * 5} color="var(--teal-deep)" /></div>
          <div className="v">{HEALTH.voicemailRate}%</div>
          <div className="l">Calls ending in voicemail</div>
        </div>
        <div className="htile">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.96 0.06 75)', color: 'oklch(0.5 0.13 60)' }}><Icon name="alert" /></span><Ring pct={HEALTH.missedAlertRate} color="var(--amber)" /></div>
          <div className="v">{HEALTH.missedAlertRate}%</div>
          <div className="l">Missed calls that alerted</div>
        </div>
      </div>

      <div className="grid-7-5 section-gap">
        <div className="card">
          <div className="card-head"><div><h2>Call volume</h2><p>{fmtNum(HEALTH.callsLast30)} calls routed · last 14 days</p></div><Badge kind="green">Healthy</Badge></div>
          <div className="card-pad">
            <div className="vol-bars">
              {HEALTH.callVolume.map((v, i) => (
                <div className="vb" key={i} style={{ height: (v / maxVol) * 100 + '%' }} title={v + ' calls'}></div>
              ))}
            </div>
            <div className="chart-xaxis" style={{ marginTop: 8 }}><span>14 days ago</span><span>7 days ago</span><span>Today</span></div>
          </div>
        </div>

        <ChartCard title="Connection trend" sub="Daily connect rate · 7 days"
          right={<span className="badge badge-green"><span className="d"></span>{HEALTH.connectRate}%</span>}>
          <AreaChart data={HEALTH.connectTrend} height={150} stroke="var(--green)" fill="var(--green)" />
          <div className="metric-tiles" style={{ marginTop: 14 }}>
            <div className="mtile"><div className="v">{HEALTH.avgRingMs}s</div><div className="l">avg time to connect</div></div>
            <div className="mtile"><div className="v">{HEALTH.missedAlertRate}%</div><div className="l">alert delivery</div></div>
          </div>
        </ChartCard>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div><h2>Number pools by region</h2><p>Connection health per area code</p></div></div>
          <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {HEALTH.regions.map((r) => (
              <div className="region-row" key={r.code}>
                <span className="code">{r.code}</span>
                <div className="city"><b>{r.city}</b><div className="nums">{r.numbers} numbers</div></div>
                <div className="nums" style={{ textAlign: 'right' }}>{r.numbers} live</div>
                <div className="conn">
                  <div className="bar"><i style={{ width: r.connect + '%' }} /></div>
                  <span className="pct">{r.connect}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Recent incidents</h2><p>Last 30 days · all resolved</p></div><Badge kind="green">0 active</Badge></div>
          <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {HEALTH.incidents.map((inc) => {
              const col = { amber: { bg: 'oklch(0.96 0.06 75)', fg: 'oklch(0.5 0.13 60)' }, green: { bg: 'oklch(0.95 0.05 158)', fg: 'oklch(0.45 0.13 158)' } }[inc.kind];
              return (
                <div className="incident" key={inc.id}>
                  <span className="idot" style={{ background: col.bg, color: col.fg }}><Icon name={inc.kind === 'green' ? 'check' : 'alert'} /></span>
                  <div className="ibody"><b>{inc.title}</b><p>{inc.detail}</p></div>
                  <span className="iwhen">{inc.when}</span>
                </div>
              );
            })}
            <div className="incident">
              <span className="idot" style={{ background: 'oklch(0.95 0.05 158)', color: 'oklch(0.45 0.13 158)' }}><Icon name="shield" /></span>
              <div className="ibody"><b>Carrier failover tested</b><p>Monthly DR drill passed · secondary route verified</p></div>
              <span className="iwhen">May 1 · ok</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { HealthView, Ring });
