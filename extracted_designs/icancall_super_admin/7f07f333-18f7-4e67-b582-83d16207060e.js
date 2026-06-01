/* iCanCall — Super Admin · Overview (analytics) */

function Delta({ children, up }) {
  return (
    <span className={'delta ' + (up ? 'up' : 'down')}>
      <Icon name={up ? 'trendUp' : 'trendDown'} />{children}
    </span>
  );
}

function ChartCard({ title, sub, right, children }) {
  return (
    <div className="card chart-card">
      <div className="card-head">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        {right}
      </div>
      <div className="card-pad">{children}</div>
    </div>
  );
}

function OverviewView({ openAccount }) {
  const mrrGrowth = (((KPI.mrr - KPI.mrrPrev) / KPI.mrrPrev) * 100).toFixed(1);
  const acctGrowth = (((KPI.accounts - KPI.accountsPrev) / KPI.accountsPrev) * 100).toFixed(1);
  const essCount = PLAN_SPLIT.find((p) => p.id === 'essential').count;
  const proCount = PLAN_SPLIT.find((p) => p.id === 'pro').count;
  const essPlan = PLAN_SPLIT.find((p) => p.id === 'essential');
  const proPlan = PLAN_SPLIT.find((p) => p.id === 'pro');
  const essPct = Math.round((essCount / (essCount + proCount)) * 100);

  return (
    <>
      {/* KPI hero row */}
      <div className="kpi-row">
        <div className="kpi hero">
          <div className="top">
            <span className="ic"><Icon name="dollar" /></span>
            <span className="klbl">Monthly recurring revenue</span>
          </div>
          <div className="kval">{fmtUSD(KPI.mrr)}</div>
          <div className="ksub">Net of churn &amp; contraction</div>
          <div className="hero-chart"><AreaChart data={MRR_SERIES} height={54} stroke="#fff" fill="#ffffff" /></div>
          <div className="hero-foot">
            <span className="arr">ARR <b>{fmtUSD(KPI.arr)}</b></span>
            <Delta up>{mrrGrowth}% MoM</Delta>
          </div>
        </div>

        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'var(--tint)', color: 'var(--blue-deep)' }}><Icon name="accounts" /></span><span className="klbl">Total accounts</span></div>
          <div className="kval">{fmtNum(KPI.accounts)}</div>
          <div className="ksub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Delta up>{acctGrowth}%</Delta> · {KPI.accountsNew} new</div>
        </div>

        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.04 198)', color: 'var(--teal-deep)' }}><Icon name="phone" /></span><span className="klbl">Active numbers</span></div>
          <div className="kval">{fmtNum(KPI.activeNumbers)}</div>
          <div className="ksub">across {fmtNum(KPI.accounts - 44)} live lines</div>
        </div>

        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.04 198)', color: 'var(--teal-deep)' }}><Icon name="accounts" /></span><span className="klbl">Subscribers by plan</span></div>
          <div className="plan-compare">
            <div className="pc"><b>{fmtNum(essCount)}</b><span>Essential</span><span className="pc-bill">{essPlan.billing[0].count + '\u00A0mo'}</span><span className="pc-bill">{essPlan.billing[1].count + '\u00A0yr'}</span></div>
            <div className="pc-div"></div>
            <div className="pc"><b>{fmtNum(proCount)}</b><span>Pro</span><span className="pc-bill">{proPlan.billing[0].count + '\u00A0mo'}</span><span className="pc-bill">{proPlan.billing[1].count + '\u00A0yr'}</span></div>
          </div>
          <div className="kpi-split"><i style={{ width: essPct + '%', background: 'var(--teal-deep)' }}></i><i style={{ width: (100 - essPct) + '%', background: 'var(--blue)' }}></i></div>
        </div>
      </div>

      {/* MRR growth + plan split */}
      <div className="grid-7-5 section-gap">
        <ChartCard title="Revenue growth" sub="MRR, trailing 12 months"
          right={<span className="badge badge-green"><span className="d"></span>+{mrrGrowth}%</span>}>
          <AreaChart data={MRR_SERIES} height={180} />
          <div className="chart-xaxis">{MONTHS.map((m, i) => <span key={i}>{m}</span>)}</div>
        </ChartCard>

        <ChartCard title="Plan mix" sub="Essential vs Pro · by billing cycle">
          <div className="donut-block">
            <Donut segments={PLAN_BILLING_BY_COUNT} centerTop={fmtNum(PLAN_SPLIT.reduce((s, p) => s + p.count, 0))} centerBottom="subscribers" />
            <div className="donut-legend">
              {PLAN_SPLIT.map((p) => (
                <div className="lg-group" key={p.id}>
                  <div className="row">
                    <span className="sw" style={{ background: p.color }}></span>
                    <span className="nm">{p.name}</span>
                    <span className="ct"><b>{p.count}</b> · {fmtUSD(p.mrr)}/mo</span>
                  </div>
                  <div className="lg-sub">
                    {p.billing.map((b) => (
                      <div className="srow" key={b.id}>
                        <span className="sw sm" style={{ background: b.color }}></span>
                        <span className="bn">{b.label}</span>
                        <span className="bc">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* signups + status */}
      <div className="grid-2 section-gap">
        <ChartCard title="New signups" sub="Per month, trailing 12 months">
          <Bars data={SIGNUP_SERIES} height={170} />
          <div className="chart-xaxis">{MONTHS.map((m, i) => <span key={i}>{m}</span>)}</div>
        </ChartCard>

        <div className="card">
          <div className="card-head"><div><h2>Account status</h2><p>Lifecycle breakdown</p></div></div>
          <div className="card-pad">
            {STATUS_SPLIT.map((s) => {
              const total = STATUS_SPLIT.reduce((a, b) => a + b.count, 0);
              const pct = Math.round((s.count / total) * 100);
              const col = { green: 'var(--green)', blue: 'var(--blue)', amber: 'var(--amber)', rose: 'var(--rose)' }[s.kind];
              return (
                <div className="feat-line" key={s.id}>
                  <div className="lab">
                    <span className="nm"><span className="sw" style={{ background: col }}></span>{s.label}</span>
                    <span className="v">{s.count} <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>· {pct}%</span></span>
                  </div>
                  <HBar pct={pct} color={col} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature adoption */}
      <div className="sec-title"><h2>Feature usage</h2><span className="sub">How the trusted-circle features are being used</span></div>
      <div className="grid-3 section-gap">
        <div className="card">
          <div className="card-head"><div><h2>Routing mode</h2><p>Cascade vs Caller Menu</p></div></div>
          <div className="card-pad">
            {FEATURES.routing.map((r) => (
              <div className="feat-line" key={r.id}>
                <div className="lab">
                  <span className="nm"><span className="sw" style={{ background: r.color }}></span>{r.label}</span>
                  <span className="v">{r.pct}%</span>
                </div>
                <HBar pct={r.pct} color={r.color} />
              </div>
            ))}
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: 4 }}>Caller Menu remains the most chosen routing style for new lines.</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Voicemail</h2><p>Fallback coverage</p></div></div>
          <div className="card-pad">
            <div className="metric-tiles">
              <div className="mtile"><div className="v">{FEATURES.voicemailEnabledPct}%</div><div className="l">lines with voicemail enabled</div></div>
              <div className="mtile"><div className="v">{FEATURES.voicemailOfCallsPct}%</div><div className="l">of calls end in voicemail</div></div>
            </div>
            <div className="feat-line" style={{ marginTop: 16 }}>
              <div className="lab"><span className="nm">Coverage</span><span className="v">{FEATURES.voicemailEnabledPct}%</span></div>
              <HBar pct={FEATURES.voicemailEnabledPct} color="var(--blue)" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Trusted circle size</h2><p>Avg {FEATURES.avgContacts} contacts / circle</p></div></div>
          <div className="card-pad">
            <div className="histo">
              {FEATURES.contactsDist.map((c) => {
                const max = Math.max(...FEATURES.contactsDist.map((x) => x.pct));
                return (
                  <div className="col" key={c.n}>
                    <div className="bar" style={{ height: (c.pct / max) * 100 + '%' }}></div>
                    <span className="n">{c.n}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: 10 }}>Contacts per circle — most families add 3–6.</p>
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div><h2>Newest accounts</h2><p>Latest signups</p></div><span className="link" onClick={() => openAccount(null, 'accounts')}>View all</span></div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
            <div className="feed">
              {RECENT_SIGNUPS.map((a) => (
                <div className="feed-row" key={a.id} onClick={() => openAccount(a.id)}>
                  <Avatar name={a.owner} color={a.color} size={38} />
                  <div className="info"><b>{a.owner}</b><span>{a.city} · joined {a.joined}</span></div>
                  <div className="meta">
                    <Badge kind={a.plan === 'pro' ? 'blue' : 'gray'}>{a.plan === 'pro' ? 'Pro' : 'Essential'}</Badge>
                    <div className="when">{a.last}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Needs attention</h2><p>Past-due &amp; failed payments</p></div><span className="link" onClick={() => openAccount(null, 'revenue')}>Billing</span></div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
            <div className="feed">
              {PAST_DUE.map((a) => (
                <div className="feed-row" key={a.id} onClick={() => openAccount(a.id)}>
                  <Avatar name={a.owner} color={a.color} size={38} />
                  <div className="info"><b>{a.owner}</b><span>{a.id} · {fmtUSD(a.mrr, 2)}/mo</span></div>
                  <div className="meta"><Badge kind="amber">Past due</Badge><div className="when">{a.next}</div></div>
                </div>
              ))}
              {PAST_DUE.length === 0 && <p style={{ color: 'var(--ink-faint)', padding: '14px 0' }}>All accounts in good standing.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { OverviewView, Delta, ChartCard });
