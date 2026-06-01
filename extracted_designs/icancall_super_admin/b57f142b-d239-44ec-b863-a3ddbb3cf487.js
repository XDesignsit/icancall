/* iCanCall — Super Admin · Accounts table + Account detail */

const { useState: useStateAc, useMemo: useMemoAc } = React;

const STATUS_META_AC = {
  active:    { kind: 'green', label: 'Active' },
  past_due:  { kind: 'amber', label: 'Past due' },
  suspended: { kind: 'rose',  label: 'Suspended' },
  canceled:  { kind: 'gray',  label: 'Canceled' },
};
const planName = (p) => (p === 'pro' ? 'Pro' : 'Essential');

/* ===================== ACCOUNTS TABLE ===================== */
function AccountsView({ openAccount }) {
  const [q, setQ] = useStateAc('');
  const [plan, setPlan] = useStateAc('all');
  const [status, setStatus] = useStateAc('all');
  const [sort, setSort] = useStateAc({ key: 'last', dir: 'desc' });

  const rows = useMemoAc(() => {
    let r = ACCOUNTS.filter((a) => {
      if (plan !== 'all' && a.plan !== plan) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (!(a.owner.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || a.id.toLowerCase().includes(s) || a.city.toLowerCase().includes(s))) return false;
      }
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    r = [...r].sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (sort.key === 'owner') return va.localeCompare(vb) * dir;
      if (sort.key === 'last') { va = a.calls30; vb = b.calls30; } // proxy recency by activity
      return (va - vb) * dir;
    });
    return r;
  }, [q, plan, status, sort]);

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  const arrow = (key) => sort.key === key ? <span className="arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span> : null;

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input placeholder="Search by name, email, account ID, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All plans</option>
          <option value="pro">Pro</option>
          <option value="essential">Essential</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="past_due">Past due</option>
          <option value="suspended">Suspended</option>
          <option value="canceled">Canceled</option>
        </select>
        <button className="btn btn-ghost"><Icon name="download" /> Export</button>
      </div>

      <div className="atable-wrap">
        <table className="atable">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('owner')}>Account {arrow('owner')}</th>
              <th className="col-opt">Plan</th>
              <th>Status</th>
              <th className="num col-opt">Numbers</th>
              <th className="num sortable" onClick={() => toggleSort('calls30')}>Calls 30d {arrow('calls30')}</th>
              <th className="num sortable" onClick={() => toggleSort('mrr')}>MRR {arrow('mrr')}</th>
              <th className="col-opt">Last active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const sm = STATUS_META_AC[a.status];
              return (
                <tr key={a.id} onClick={() => openAccount(a.id)}>
                  <td>
                    <div className="acct-cell">
                      <span className="ava" style={{ background: a.color }}>{initials(a.owner)}</span>
                      <div className="who"><b>{a.owner}</b><span>{a.email}</span></div>
                    </div>
                  </td>
                  <td className="col-opt"><Badge kind={a.plan === 'pro' ? 'blue' : 'gray'}>{planName(a.plan)}</Badge></td>
                  <td><Badge kind={sm.kind}>{sm.label}</Badge></td>
                  <td className="num col-opt mono">{a.numbers}</td>
                  <td className="num mono">{a.calls30}</td>
                  <td className="num mrr">{a.mrr ? fmtUSD(a.mrr, 2) : '—'}</td>
                  <td className="col-opt" style={{ color: 'var(--ink-faint)' }}>{a.last}</td>
                  <td className="num"><button className="row-act" onClick={(e) => { e.stopPropagation(); openAccount(a.id); }} aria-label="Open"><Icon name="more" /></button></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-faint)' }}>No accounts match those filters.</td></tr>
            )}
          </tbody>
        </table>
        <div className="table-foot">
          <span>Showing <b style={{ color: 'var(--ink)' }}>{rows.length}</b> of {fmtNum(KPI.accounts)} accounts</span>
          <div className="pager">
            <button className="active">1</button><button>2</button><button>3</button><button>…</button><button>31</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===================== ACCOUNT DETAIL ===================== */
function AccountDetailView({ accountId, onBack, showToast }) {
  const a = ACCOUNTS.find((x) => x.id === accountId) || ACCOUNTS[0];
  const sm = STATUS_META_AC[a.status];
  const [modal, setModal] = useStateAc(null); // 'plan' | 'refund' | 'suspend'
  const [newPlan, setNewPlan] = useStateAc(a.plan);
  const [refundAmt, setRefundAmt] = useStateAc(a.mrr ? a.mrr.toFixed(2) : '12.99');

  const price = a.plan === 'pro' ? (a.billing === 'annual' ? '$199/yr' : '$19.99/mo') : (a.billing === 'annual' ? '$129/yr' : '$12.99/mo');
  const totalMin = a.lines.reduce((s, l) => s + l.minutesUsed, 0);
  const minPct = Math.min(100, Math.round((a.minutesUsed / a.minutesCap) * 100));

  const openCustomer = () => {
    if (a.isHero) window.location.href = 'iCanCall Dashboard.html';
    else showToast('Launching secure impersonation session…');
  };

  // synth invoice history
  const unit = a.plan === 'pro' ? (a.billing === 'annual' ? 199 : 19.99) : (a.billing === 'annual' ? 129 : 12.99);
  const invoices = [
    { id: '#IC-' + a.id.slice(-4) + '-06', when: a.billing === 'annual' ? a.joined : 'May 2, 2025', amt: unit, paid: a.status !== 'past_due' },
    { id: '#IC-' + a.id.slice(-4) + '-05', when: 'Apr 2, 2025', amt: unit, paid: true },
    { id: '#IC-' + a.id.slice(-4) + '-04', when: 'Mar 2, 2025', amt: unit, paid: true },
  ];

  return (
    <>
      <button className="back-link" onClick={onBack}><Icon name="up" style={{ transform: 'rotate(-90deg)' }} /> All accounts</button>

      <div className="acct-hero section-gap">
        <span className="big-ava" style={{ background: a.color }}>{initials(a.owner)}</span>
        <div className="hmeta">
          <div className="name">
            <h1>{a.owner}</h1>
            <Badge kind={sm.kind}>{sm.label}</Badge>
            <Badge kind={a.plan === 'pro' ? 'blue' : 'gray'}>{planName(a.plan)}</Badge>
          </div>
          <div className="email">{a.email} · <span className="mono" style={{ color: 'var(--ink-faint)' }}>{a.id}</span></div>
          <div className="facts">
            <div className="f">Joined<b>{a.joined}</b></div>
            <div className="f">Last active<b>{a.last}</b></div>
            <div className="f">Location<b>{a.city} ({a.area})</b></div>
            <div className="f">Billing<b>{price}</b></div>
          </div>
        </div>
        <div className="h-acts">
          <button className="btn btn-primary" onClick={openCustomer}><Icon name="eye" /> Open as customer</button>
          <button className="btn btn-ghost" onClick={() => { setNewPlan(a.plan); setModal('plan'); }}><Icon name="swap" /> Change plan</button>
          <button className="btn btn-ghost" onClick={() => setModal('refund')}><Icon name="refund" /> Issue refund</button>
          <button className="btn btn-danger-ghost" onClick={() => setModal('suspend')}><Icon name="ban" /> {a.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
        </div>
      </div>

      <div className="mini-stats section-gap">
        <div className="ministat"><div className="v">{a.mrr ? fmtUSD(a.mrr, 2) : '$0'}</div><div className="l">Monthly revenue</div></div>
        <div className="ministat"><div className="v">{a.numbers}</div><div className="l">Active numbers</div></div>
        <div className="ministat"><div className="v">{a.calls30}</div><div className="l">Calls · 30 days</div></div>
        <div className="ministat"><div className="v">{a.connect ? a.connect + '%' : '—'}</div><div className="l">Connection rate</div></div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head"><div><h2>Subscription</h2><p>Plan &amp; billing</p></div></div>
          <div className="card-pad">
            <div className="kv"><span className="k">Plan</span><span className="v">{planName(a.plan)}</span></div>
            <div className="kv"><span className="k">Billing cycle</span><span className="v">{a.billing === 'annual' ? 'Annual' : 'Monthly'}</span></div>
            <div className="kv"><span className="k">Price</span><span className="v">{price}</span></div>
            <div className="kv"><span className="k">Recognized MRR</span><span className="v">{a.mrr ? fmtUSD(a.mrr, 2) : '$0.00'}</span></div>
            <div className="kv"><span className="k">Lifetime value</span><span className="v">{fmtUSD(a.ltv)}</span></div>
            <div className="kv"><span className="k">Next renewal</span><span className="v">{a.next}</span></div>
            <div className="kv"><span className="k">Payment method</span><span className="v mono">Visa ···· 4242</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Usage</h2><p>This billing period</p></div></div>
          <div className="card-pad">
            <div className="kv"><span className="k">Voice minutes used</span><span className="v">{a.minutesUsed} / {a.minutesCap} min</span></div>
            <div className="usage-bar" style={{ marginTop: 6 }}><i className={minPct > 85 ? 'warn' : ''} style={{ width: minPct + '%' }} /></div>
            <div className="kv" style={{ marginTop: 10 }}><span className="k">Calls (30 days)</span><span className="v">{a.calls30}</span></div>
            <div className="kv"><span className="k">Connection rate</span><span className="v">{a.connect ? a.connect + '%' : '—'}</span></div>
            <div className="kv"><span className="k">Voicemail rate</span><span className="v">{a.vmRate}%</span></div>
            <div className="kv"><span className="k">Trusted contacts</span><span className="v">{a.contacts} across {a.numbers} {a.numbers > 1 ? 'lines' : 'line'}</span></div>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div><h2>Managed lines</h2><p>Numbers &amp; routing this account oversees</p></div></div>
        <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
          {a.lines.map((l, i) => {
            const cap = a.plan === 'pro' ? 60 : 30;
            const pct = Math.min(100, Math.round((l.minutesUsed / cap) * 100));
            return (
              <div className="line-card" key={i}>
                <span className="ava" style={{ background: i % 2 ? 'var(--blue)' : 'var(--teal-deep)' }}><Icon name="phone" style={{ width: 19, height: 19 }} /></span>
                <div className="li">
                  <b>{l.label}</b>
                  <div className="p">{l.person} · <Badge kind={l.mode === 'menu' ? 'blue' : 'gray'}>{l.mode === 'menu' ? 'Caller Menu' : 'Cascade'}</Badge> · {l.contacts} contacts</div>
                  <div className="num">{l.number}</div>
                </div>
                <div className="lmeta">
                  <div className="min">{l.minutesUsed} / {cap} min</div>
                  <div className="bar"><i style={{ width: pct + '%' }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h2>Billing history</h2><p>Recent invoices</p></div><span className="link">Download all</span></div>
        <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
          {invoices.map((inv, i) => (
            <div className="invoice" key={i}>
              <div className="l"><b>{inv.id}</b><span>{inv.when}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Badge kind={inv.paid ? 'green' : 'amber'}>{inv.paid ? 'Paid' : 'Failed'}</Badge>
                <span className="amt">{fmtUSD(inv.amt, 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- modals ---- */}
      {modal === 'plan' && (
        <Modal title="Change plan" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setModal(null); showToast(`Plan changed to ${planName(newPlan)}`); }}>Save changes</button>
          </>}>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: 16 }}>Switch the plan for <b>{a.owner}</b>. Proration is applied automatically on the next invoice.</p>
          <div className="mode-cards">
            {['essential', 'pro'].map((p) => (
              <div key={p} className={'mode-card' + (newPlan === p ? ' sel' : '')} onClick={() => setNewPlan(p)}>
                <div className="check"><Icon name="check" /></div>
                <div className="ic"><Icon name={p === 'pro' ? 'users' : 'user'} /></div>
                <h4>{planName(p)}</h4>
                <p>{p === 'pro' ? '2 numbers · 6 contacts · 60 min' : '1 number · 3 contacts · 30 min'}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'refund' && (
        <Modal title="Issue refund" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setModal(null); showToast(`Refunded ${fmtUSD(Number(refundAmt), 2)} to ${a.owner}`); }}>Issue refund</button>
          </>}>
          <div className="field"><label>Refund amount (USD)</label><input value={refundAmt} onChange={(e) => setRefundAmt(e.target.value.replace(/[^\d.]/g, ''))} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Reason</label>
            <select defaultValue="goodwill"><option value="goodwill">Goodwill credit</option><option value="billing_error">Billing error</option><option value="downgrade">Downgrade adjustment</option><option value="cancellation">Cancellation</option></select>
          </div>
        </Modal>
      )}

      {modal === 'suspend' && (
        <Modal title={a.status === 'suspended' ? 'Reactivate account' : 'Suspend account'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className={'btn ' + (a.status === 'suspended' ? 'btn-primary' : 'btn-danger-ghost')} onClick={() => { setModal(null); showToast(a.status === 'suspended' ? `${a.owner} reactivated` : `${a.owner} suspended`); }}>
              {a.status === 'suspended' ? 'Reactivate' : 'Suspend account'}
            </button>
          </>}>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            {a.status === 'suspended'
              ? <>Restore service for <b>{a.owner}</b>. Their numbers and routing will resume immediately.</>
              : <>Suspending <b>{a.owner}</b> will pause all {a.numbers} number{a.numbers > 1 ? 's' : ''} and stop call routing. The account can be reactivated anytime.</>}
          </p>
        </Modal>
      )}
    </>
  );
}

Object.assign(window, { AccountsView, AccountDetailView, STATUS_META_AC, planName });
