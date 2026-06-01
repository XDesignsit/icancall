/* iCanCall — Super Admin · Revenue & billing */

function RevenueView({ openAccount }) {
  const mrrGrowth = (((KPI.mrr - KPI.mrrPrev) / KPI.mrrPrev) * 100).toFixed(1);
  const net = MRR_MOVEMENT.reduce((s, m) => s + m.amt, 0);
  const maxAbs = Math.max(...MRR_MOVEMENT.map((m) => Math.abs(m.amt)));
  const planMrrTotal = PLAN_SPLIT.reduce((s, p) => s + p.mrr, 0);

  return (
    <>
      <div className="kpi-row even">
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'var(--tint)', color: 'var(--blue-deep)' }}><Icon name="dollar" /></span><span className="klbl">MRR</span></div>
          <div className="kval">{fmtUSD(KPI.mrr)}</div>
          <div className="ksub"><Delta up>{mrrGrowth}% MoM</Delta></div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.04 198)', color: 'var(--teal-deep)' }}><Icon name="trendUp" /></span><span className="klbl">ARR</span></div>
          <div className="kval">{fmtUSD(KPI.arr)}</div>
          <div className="ksub">annualized run-rate</div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.95 0.05 285 / 0.5)', color: 'var(--violet)' }}><Icon name="user" /></span><span className="klbl">ARPA</span></div>
          <div className="kval">{fmtUSD(KPI.arpa, 2)}</div>
          <div className="ksub">avg revenue / paying account</div>
        </div>
        <div className="kpi">
          <div className="top"><span className="ic" style={{ background: 'oklch(0.96 0.05 22)', color: 'var(--rose)' }}><Icon name="trendDown" /></span><span className="klbl">Logo churn</span></div>
          <div className="kval">{KPI.churnLogo}%</div>
          <div className="ksub">NRR <b style={{ color: 'var(--ink)' }}>{KPI.nrr}%</b></div>
        </div>
      </div>

      <div className="grid-7-5 section-gap">
        <ChartCard title="MRR trend" sub="Trailing 12 months"
          right={<span className="badge badge-green"><span className="d"></span>+{mrrGrowth}%</span>}>
          <AreaChart data={MRR_SERIES} height={190} />
          <div className="chart-xaxis">{MONTHS.map((m, i) => <span key={i}>{m}</span>)}</div>
        </ChartCard>

        <div className="card">
          <div className="card-head"><div><h2>MRR movement</h2><p>This month · net {net >= 0 ? '+' : ''}{fmtUSD(net)}</p></div></div>
          <div className="card-pad">
            <div className="movement" style={{ position: 'relative' }}>
              <div className="move-mid"></div>
              {MRR_MOVEMENT.map((m) => {
                const w = (Math.abs(m.amt) / maxAbs) * 50;
                return (
                  <div className="move-row" key={m.label}>
                    <span className="ml">{m.label}</span>
                    <div className="track">
                      <i className={m.kind} style={m.kind === 'pos' ? { width: w + '%' } : { width: w + '%' }} />
                    </div>
                    <span className={'mv ' + m.kind}>{m.amt >= 0 ? '+' : '−'}{fmtUSD(Math.abs(m.amt))}</span>
                  </div>
                );
              })}
            </div>
            <div className="addon-total" style={{ marginTop: 14 }}>
              <span className="lbl">Net new MRR</span>
              <span className="big" style={{ color: 'oklch(0.46 0.13 158)' }}>+{fmtUSD(net)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <ChartCard title="Revenue by plan" sub="MRR by plan &amp; billing cycle">
          <div className="donut-block">
            <Donut segments={PLAN_BILLING_BY_MRR} centerTop={fmtUSD(planMrrTotal)} centerBottom="MRR" />
            <div className="donut-legend">
              {PLAN_SPLIT.map((p) => (
                <div className="lg-group" key={p.id}>
                  <div className="row">
                    <span className="sw" style={{ background: p.color }}></span>
                    <span className="nm">{p.name}</span>
                    <span className="ct"><b>{fmtUSD(p.mrr)}</b> · {Math.round((p.mrr / planMrrTotal) * 100)}%</span>
                  </div>
                  <div className="lg-sub">
                    {p.billing.map((b) => (
                      <div className="srow" key={b.id}>
                        <span className="sw sm" style={{ background: b.color }}></span>
                        <span className="bn">{b.label}</span>
                        <span className="bc">{fmtUSD(b.mrr)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <div className="card">
          <div className="card-head"><div><h2>Needs collection</h2><p>Past-due &amp; failed payments</p></div><Badge kind="amber">{PAST_DUE.length} flagged</Badge></div>
          <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 10 }}>
            {PAST_DUE.map((a) => (
              <div className="duerow" key={a.id}>
                <span className="ava" style={{ background: a.color }}>{initials(a.owner)}</span>
                <div className="di"><b>{a.owner}</b><span>{a.id} · {a.next}</span></div>
                <span className="amt" style={{ fontWeight: 700 }}>{fmtUSD(a.mrr, 2)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => openAccount(a.id)}>Review</button>
              </div>
            ))}
            <div className="duerow">
              <span className="ava" style={{ background: 'var(--ink-faint)' }}>SM</span>
              <div className="di"><b>Sofia Martinez</b><span>Retry scheduled · tomorrow</span></div>
              <span className="amt" style={{ fontWeight: 700 }}>$10.75</span>
              <button className="btn btn-ghost btn-sm">Retry now</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h2>Recent transactions</h2><p>Payments, refunds &amp; failures</p></div><span className="link">View ledger</span></div>
        <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
          {TRANSACTIONS.map((t) => (
            <div className="txn-row" key={t.id}>
              <span className={'tic tic-' + t.kind}><Icon name={t.kind === 'paid' ? 'check' : t.kind === 'failed' ? 'alert' : 'refund'} /></span>
              <div className="who"><b>{t.acct}</b><span className="mono">{t.id}</span></div>
              <span className="plan">{t.plan}</span>
              <span className="when">{t.when}</span>
              <span className={'amt' + (t.kind === 'refund' ? ' refund' : '')}>{t.kind === 'refund' ? '−' : ''}{fmtUSD(t.amt, 2)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { RevenueView });
