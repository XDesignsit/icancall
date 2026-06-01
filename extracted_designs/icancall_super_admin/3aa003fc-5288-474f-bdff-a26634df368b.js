/* iCanCall — Super Admin · Twilio (carrier) usage, billing & cost analytics */

function TwilioView() {
  const T = TWILIO;
  const spendGrowth = (((T.spend - T.spendPrev) / T.spendPrev) * 100).toFixed(1);
  const marginAmt = KPI.mrr - T.spend;            // revenue retained after carrier cost
  const marginPct = ((marginAmt / KPI.mrr) * 100).toFixed(1);
  const totalSpend = T.breakdown.reduce((s, b) => s + b.amt, 0);
  const breakdownSegs = T.breakdown.map((b) => ({ count: b.amt, color: b.color }));
  const maxRegion = Math.max(...T.regions.map((r) => r.spend));
  const u = T.usage;

  const chargeIcon = { usage: 'pulse', recharge: 'card', numbers: 'phone' };
  const chargeTic = { usage: 'tic-paid', recharge: 'tic-refund', numbers: 'tic-paid' };

  return (
    <>
      {/* KPI row */}
      <div className="kpi-row even">
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.96 0.05 22)', color: 'oklch(0.55 0.16 22)' }}><Icon name="cloud" /></span><span className="klbl">Twilio spend · MTD</span></div>
          <div className="kval">{fmtUSD(T.spend)}</div>
          <div className="ksub">+{spendGrowth}% vs last month · {fmtUSD(T.projected)} projected</div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.05 158)', color: 'oklch(0.45 0.13 158)' }}><Icon name="gauge" /></span><span className="klbl">Gross margin</span></div>
          <div className="kval">{marginPct}%</div>
          <div className="ksub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Delta up>healthy</Delta> {fmtUSD(marginAmt)} retained / mo</div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'var(--tint)', color: 'var(--blue-deep)' }}><Icon name="card" /></span><span className="klbl">Account balance</span></div>
          <div className="kval">{fmtUSD(T.balance)}</div>
          <div className="ksub">auto-recharge at {fmtUSD(T.autoRecharge)}</div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.05 285 / 0.5)', color: 'var(--violet)' }}><Icon name="phone" /></span><span className="klbl">Cost per call</span></div>
          <div className="kval">{fmtUSD(T.costPerCall, 3)}</div>
          <div className="ksub">{fmtUSD(T.costPerNumber, 2)} / active number</div>
        </div>
      </div>

      {/* spend trend + cost breakdown */}
      <div className="grid-7-5 section-gap">
        <ChartCard title="Carrier spend" sub="Twilio cost, trailing 12 months"
          right={<span className="badge badge-amber"><span className="d"></span>+{spendGrowth}%</span>}>
          <AreaChart data={T.spendSeries} height={188} stroke="oklch(0.62 0.16 22)" fill="oklch(0.62 0.16 22)" />
          <div className="chart-xaxis">{MONTHS.map((m, i) => <span key={i}>{m}</span>)}</div>
        </ChartCard>

        <ChartCard title="Cost breakdown" sub="By Twilio product · this month">
          <div className="donut-block">
            <Donut segments={breakdownSegs} centerTop={fmtUSD(totalSpend)} centerBottom="spend" />
            <div className="donut-legend">
              {T.breakdown.map((b) => (
                <div className="row" key={b.id}>
                  <span className="sw" style={{ background: b.color }}></span>
                  <span className="nm">{b.label}</span>
                  <span className="ct"><b>{fmtUSD(b.amt)}</b> · {Math.round((b.amt / totalSpend) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* usage this month */}
      <div className="card section-gap">
        <div className="card-head"><div><h2>Usage this month</h2><p>Metered consumption across the Twilio account</p></div></div>
        <div className="card-pad">
          <div className="usage-tiles">
            <div className="mtile"><div className="v">{fmtNum(u.voiceMin)}</div><div className="l">Voice minutes</div><div className="sub2">{fmtNum(u.voiceIn)} in · {fmtNum(u.voiceOut)} out</div></div>
            <div className="mtile"><div className="v">{fmtNum(u.sms)}</div><div className="l">SMS sent</div><div className="sub2">{fmtNum(u.smsAlerts)} alerts · {fmtNum(u.sms2fa)} codes</div></div>
            <div className="mtile"><div className="v">{fmtNum(u.numbers)}</div><div className="l">Active numbers</div><div className="sub2" style={{ color: 'oklch(0.46 0.13 158)' }}>+{u.numbersAdded} added · −{u.numbersReleased} released</div></div>
            <div className="mtile"><div className="v">{fmtNum(u.transcriptions)}</div><div className="l">Transcriptions</div><div className="sub2">{fmtNum(u.recordings)} recordings stored</div></div>
            <div className="mtile"><div className="v">{fmtNum(u.lookups)}</div><div className="l">Lookups</div><div className="sub2">caller-ID on inbound</div></div>
            <div className="mtile"><div className="v">{fmtUSD(T.costPerMin, 3)}</div><div className="l">Cost / voice minute</div><div className="sub2">blended in + out</div></div>
          </div>
        </div>
      </div>

      {/* spend by region + reliability */}
      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head"><div><h2>Spend by number pool</h2><p>Carrier cost per area-code region</p></div></div>
          <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {T.regions.map((r) => (
              <div className="region-row" key={r.code}>
                <span className="code">{r.code}</span>
                <div className="city"><b>{r.city}</b><div className="nums">{r.numbers} numbers</div></div>
                <div className="nums" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>{fmtUSD(r.spend)}</div>
                <div className="conn">
                  <div className="bar"><i style={{ width: (r.spend / maxRegion) * 100 + '%', background: 'linear-gradient(90deg, var(--amber), oklch(0.62 0.16 22))' }} /></div>
                  <span className="pct">{Math.round((r.spend / totalSpend) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Service reliability</h2><p>Twilio API &amp; delivery health</p></div><Badge kind="green">Operational</Badge></div>
          <div className="card-pad">
            <div className="metric-tiles">
              <div className="mtile"><div className="v">{T.reliability.apiSuccess}%</div><div className="l">API success rate</div></div>
              <div className="mtile"><div className="v">{T.reliability.avgLatencyMs}ms</div><div className="l">avg call setup latency</div></div>
            </div>
            <div className="kv" style={{ marginTop: 14 }}><span className="k">Voice call error rate</span><span className="v">{T.reliability.callErrorRate}%</span></div>
            <div className="kv"><span className="k">SMS undelivered</span><span className="v">{T.reliability.smsUndelivered}%</span></div>
            <div className="kv"><span className="k">Balance runway</span><span className="v">≈ {Math.floor(T.balance / (T.spend / 30))} days at current rate</span></div>
            <div className="kv"><span className="k">Next auto-recharge</span><span className="v">{fmtUSD(T.autoRecharge)} when below {fmtUSD(T.autoRecharge)}</span></div>
          </div>
        </div>
      </div>

      {/* recent charges */}
      <div className="card">
        <div className="card-head"><div><h2>Recent Twilio charges</h2><p>Usage &amp; account billing events</p></div><span className="link">Open Twilio console <Icon name="external" style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px' }} /></span></div>
        <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
          {T.charges.map((c) => (
            <div className="txn-row" key={c.id}>
              <span className={'tic ' + chargeTic[c.kind]}><Icon name={chargeIcon[c.kind]} /></span>
              <div className="who"><b>{c.desc}</b><span className="mono">{c.id}</span></div>
              <span className="plan">{c.kind === 'recharge' ? 'Top-up' : c.kind === 'numbers' ? 'Numbers' : 'Metered usage'}</span>
              <span className="when">{c.when}</span>
              <span className="amt">{fmtUSD(c.amt, 2)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { TwilioView });
