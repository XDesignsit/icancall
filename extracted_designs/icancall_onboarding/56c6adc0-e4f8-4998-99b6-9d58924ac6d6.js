/* iCanCall onboarding — step screens */

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

/* ============ shared nav row ============ */
function StepNav({ onBack, onNext, nextLabel, nextDisabled, backLabel }) {
  return (
    <div className="step-nav">
      {onBack && <button className="btn-text" onClick={onBack}><Ico.arrowL /> {backLabel || 'Back'}</button>}
      <span className="spacer" />
      <button className="btn btn-primary btn-lg" disabled={nextDisabled} onClick={onNext}>
        {nextLabel || 'Continue'} <Ico.arrowR />
      </button>
    </div>
  );
}

/* ============ STEP 1 — Plan ============ */
function PlanStep({ data, set, onNext, onBack }) {
  const { plan, billing } = data;
  return (
    <div className="panel">
      <span className="step-eyebrow">Step 2 of 4 · Choose a plan</span>
      <h1>Pick the plan that fits your family.</h1>
      <p className="sub">Both plans include cascade routing, the caller menu, and 24/7 reliability. Switch or cancel anytime.</p>

      <div className="bill-toggle">
        <button className={billing === 'monthly' ? 'active' : ''} onClick={() => set({ billing: 'monthly' })}>Monthly</button>
        <button className={billing === 'annual' ? 'active' : ''} onClick={() => set({ billing: 'annual' })}>Annual <em>Save 17%</em></button>
      </div>

      <div className="plan-cards">
        {PLANS.map((p) => {
          const price = p[billing];
          const sel = plan === p.id;
          return (
            <button key={p.id} className={'plan-card' + (sel ? ' sel' : '')} onClick={() => set({ plan: p.id })}>
              <span className="radio" />
              <span className="pname">{p.name}{p.tag && <span className="ptag">{p.tag}</span>}</span>
              <span className="pprice">
                <b>{price.label}</b>
                <span>{price.per}</span>
                {billing === 'annual' && <span className="yearly">{price.note}</span>}
              </span>
              <span className="pdesc">{p.desc}</span>
              <ul className="plan-feats">
                {p.feats.map((f, i) => <li key={i}><Ico.check /> {f}</li>)}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="trust-row"><Ico.shield /> No setup fees · Switch plans or cancel anytime</div>
      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

/* ============ STEP 2 — Account ============ */
function AccountStep({ data, set, onNext, onBack }) {
  const a = data.account;
  const [touched, setTouched] = useStateS({});
  const strength = passwordStrength(a.password);
  const s = STRENGTH[strength];

  const errs = {
    name: a.name.trim().length < 2 ? 'Please enter your name' : '',
    email: !validEmail(a.email) ? 'Enter a valid email address' : '',
    password: a.password.length < 8 ? 'Use at least 8 characters' : '',
  };
  const valid = !errs.name && !errs.email && !errs.password;
  const upd = (k, v) => set({ account: { ...a, [k]: v } });
  const show = (k) => touched[k] && errs[k];

  const submit = () => {
    if (valid) onNext();
    else setTouched({ name: 1, email: 1, password: 1 });
  };

  return (
    <div className="panel">
      <span className="step-eyebrow">Step 1 of 4 · Your account</span>
      <h1>Let's set up your account.</h1>
      <p className="sub">This is the account that manages the number and trusted circle. Your family doesn't need an account.</p>

      <button className="btn btn-google btn-block" style={{ marginTop: 22 }} onClick={onNext}>
        <Ico.google /> Continue with Google
      </button>
      <div className="auth-divider">or sign up with email</div>

      <div className="field">
        <label>Full name</label>
        <div className="input-icon">
          <Ico.user className="ico" />
          <input className={'input' + (show('name') ? ' error' : '')} placeholder="Maria Delgado"
            value={a.name} onChange={(e) => upd('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: 1 }))} />
        </div>
        <div className={'field-err' + (show('name') ? ' show' : '')}>{errs.name}</div>
      </div>

      <div className="field">
        <label>Email address</label>
        <div className="input-icon">
          <Ico.mail className="ico" />
          <input className={'input' + (show('email') ? ' error' : '')} type="email" placeholder="you@example.com"
            value={a.email} onChange={(e) => upd('email', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: 1 }))} />
        </div>
        <div className={'field-err' + (show('email') ? ' show' : '')}>{errs.email}</div>
      </div>

      <div className="field">
        <label>Create a password</label>
        <div className="input-icon">
          <Ico.lock className="ico" />
          <input className={'input' + (show('password') ? ' error' : '')} type="password" placeholder="At least 8 characters"
            value={a.password} onChange={(e) => upd('password', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: 1 }))} />
        </div>
        {a.password && (
          <>
            <div className="pw-meter"><i style={{ width: s.w, background: s.color }} /></div>
            <div className="pw-note">Password strength: {s.label || '—'}</div>
          </>
        )}
        <div className={'field-err' + (show('password') ? ' show' : '')}>{errs.password}</div>
      </div>

      <StepNav onBack={onBack} onNext={submit} nextLabel="Continue" />
    </div>
  );
}

/* ============ STEP 3 — Number ============ */
function NumberStep({ data, set, onNext, onBack }) {
  const need = planById(data.plan).numbers;
  const selected = data.numbers;
  const [area, setArea] = useStateS('415');
  const [results, setResults] = useStateS([]);
  const [loading, setLoading] = useStateS(true);
  const [spin, setSpin] = useStateS(false);

  const load = (ac) => {
    setLoading(true);
    setSpin(true);
    // simulate the backend Twilio lookup latency
    setTimeout(() => {
      setResults(fetchNumbers(ac, 6));
      setLoading(false);
      setTimeout(() => setSpin(false), 120);
    }, 650);
  };

  useEffectS(() => { load(area); /* initial */ }, []); // eslint-disable-line

  const isSel = (n) => selected.some((x) => x.number === n.number);
  const full = selected.length >= need;

  const toggle = (n) => {
    if (isSel(n)) set({ numbers: selected.filter((x) => x.number !== n.number) });
    else if (!full) set({ numbers: [...selected, n] });
  };
  const remove = (n) => set({ numbers: selected.filter((x) => x.number !== n.number) });

  const search = () => { const ac = area.replace(/\D/g, '').slice(0, 3); if (ac.length === 3) load(ac); };

  return (
    <div className="panel wide">
      <span className="step-eyebrow">Step 3 of 4 · Your number</span>
      <h1>{need > 1 ? `Choose your ${need} numbers.` : 'Choose your number.'}</h1>
      <p className="sub">Numbers are provided through our carrier network. Search any area code to find one that's local — or memorable.</p>

      <div className="num-need">
        <Ico.phone />
        <span>Your <b>{planById(data.plan).name}</b> plan includes <b>{need} number{need > 1 ? 's' : ''}</b>. You've selected <b>{selected.length} of {need}</b>.</span>
      </div>

      {selected.length > 0 && (
        <div className="selected-nums">
          {selected.map((n) => (
            <span key={n.number} className="num-chip">
              {n.number}
              <button className="x" onClick={() => remove(n)} aria-label="Remove"><Ico.x /></button>
            </span>
          ))}
        </div>
      )}

      <div className="search-bar">
        <div className="area-wrap">
          <span className="prefix">Area code</span>
          <input className="input" inputMode="numeric" maxLength={3} placeholder="415"
            value={area}
            onChange={(e) => setArea(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onKeyDown={(e) => e.key === 'Enter' && search()} />
        </div>
        <button className="btn btn-ghost" onClick={search} disabled={area.replace(/\D/g, '').length !== 3}>
          <Ico.search /> Search
        </button>
      </div>
      <div className="area-suggest">
        {AREA_SUGGESTIONS.map((a) => (
          <button key={a.code} className="area-pill" onClick={() => { setArea(a.code); load(a.code); }}>
            {a.code} · {a.city}
          </button>
        ))}
      </div>

      <div className="results-head">
        <span className="rh-title">Available in <b>({area || '—'})</b></span>
        <button className={'refresh-btn' + (spin ? ' spin' : '')} onClick={() => load(area)} disabled={loading}>
          <Ico.refresh /> Show more
        </button>
      </div>

      {loading ? (
        <div className="results-loading">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : results.length ? (
        <div className="num-grid">
          {results.map((n) => {
            const sel = isSel(n);
            const disabled = !sel && full;
            return (
              <button key={n.id} className={'num-opt' + (sel ? ' sel' : '') + (disabled ? ' disabled' : '')} onClick={() => toggle(n)}>
                <span className="tick">{sel && <Ico.check />}</span>
                <span className="nlabel">
                  <span className="nnum">{n.number}</span>
                  {n.memorable && <span className="memorable">{n.memorable}</span>}
                  {!n.memorable && <span className="nmeta">Local number</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="num-empty"><Ico.search /><div>No numbers found for that area code. Try another.</div></div>
      )}

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" nextDisabled={selected.length !== need} />
    </div>
  );
}

/* ============ STEP 4 — Payment ============ */
function PaymentStep({ data, set, onNext, onBack }) {
  const plan = planById(data.plan);
  const price = plan[data.billing];
  const p = data.payment;
  const [touched, setTouched] = useStateS(false);

  const upd = (k, v) => set({ payment: { ...p, [k]: v } });
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };

  const cardOk = p.card.replace(/\s/g, '').length >= 15;
  const expOk = /^\d{2}\/\d{2}$/.test(p.exp);
  const cvcOk = p.cvc.length >= 3;
  const nameOk = p.name.trim().length > 1;
  const valid = cardOk && expOk && cvcOk && nameOk;

  const submit = () => { if (valid) onNext(); else setTouched(true); };
  const err = (ok) => touched && !ok;

  return (
    <div className="panel">
      <span className="step-eyebrow">Step 4 of 4 · Confirm</span>
      <h1>Add your payment details.</h1>
      <p className="sub">Add a payment method to activate your number and complete signup.</p>

      <div className="trial-banner">
        <span className="ti"><Ico.check /></span>
        <div>
          <b>{price.label}{price.per}, billed {data.billing === 'annual' ? 'annually' : 'monthly'}</b>
          <p>Renews automatically. Switch plans or cancel anytime from your dashboard.</p>
        </div>
      </div>

      <div className="field">
        <label>Name on card</label>
        <input className={'input' + (err(nameOk) ? ' error' : '')} placeholder="Maria Delgado"
          value={p.name} onChange={(e) => upd('name', e.target.value)} />
      </div>
      <div className="field">
        <label>Card number</label>
        <div className="card-field">
          <input className={'input' + (err(cardOk) ? ' error' : '')} inputMode="numeric" placeholder="1234 5678 9012 3456"
            value={p.card} onChange={(e) => upd('card', fmtCard(e.target.value))} style={{ fontFamily: 'var(--mono)' }} />
          <span className="brand-ico"><span /><span /></span>
        </div>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Expiry</label>
          <input className={'input' + (err(expOk) ? ' error' : '')} inputMode="numeric" placeholder="MM/YY"
            value={p.exp} onChange={(e) => upd('exp', fmtExp(e.target.value))} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="field">
          <label>CVC</label>
          <input className={'input' + (err(cvcOk) ? ' error' : '')} inputMode="numeric" placeholder="123"
            value={p.cvc} onChange={(e) => upd('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="order-sum">
        <div className="os-row"><span>{plan.name} plan · {data.billing === 'annual' ? 'Annual' : 'Monthly'}</span><b>{price.label}{price.per}</b></div>
        <div className="os-row"><span>{plan.numbers} phone number{plan.numbers > 1 ? 's' : ''}</span><span>Included</span></div>
        <div className="os-row total"><span>Due today</span><span>{price.label}</span></div>
      </div>

      <div className="trust-row"><Ico.lock /> Secured with bank-level encryption. We never store your card details.</div>
      <StepNav onBack={onBack} onNext={submit} nextLabel="Confirm & activate" />
    </div>
  );
}

/* ============ STEP 5 — Success ============ */
function SuccessStep({ data }) {
  const plan = planById(data.plan);
  const contactCap = plan.id === 'pro' ? 6 : 3;
  const shown = Math.min(contactCap, 4);
  const ownerFirst = (data.account.name || 'You').trim().split(/\s+/)[0];

  return (
    <div className="panel">
      <div className="success-wrap">
        <div className="success-mark"><Ico.check /></div>
        <h1>You're all set, {ownerFirst}!</h1>
        <p className="sub">Your {plan.name} plan is active and your {plan.numbers > 1 ? 'numbers are' : 'number is'} live. One last thing: build your trusted circle so calls always reach someone.</p>

        <div className="next-card">
          <div className="nc-head">
            <span className="num-badge">{data.numbers[0] ? data.numbers[0].number : '(415) 555-0100'}</span>
            <span className="nc-ttl"><span style={{ whiteSpace: 'nowrap' }}>{data.numbers.length > 1 ? 'Your iCanCall numbers' : 'Your iCanCall number'}</span><span>{data.numbers.length > 1 ? `+${data.numbers.length - 1} more · ` : ''}Ready to receive calls</span></span>
          </div>

          <div className="circle-preview">
            <div className="cp-label">Set up your circle · up to {contactCap} contacts</div>
            <div className="cp-slots">
              <div className="cp-slot filled">
                <span className="ava" style={{ background: 'var(--blue)' }}>{initials(data.account.name)}</span>
                <span className="cp-who"><b>{data.account.name || 'You'}</b><span>Account owner · you</span></span>
                <span className="cp-order">Added</span>
              </div>
              {Array.from({ length: shown - 1 }).map((_, i) => (
                <div key={i} className="cp-slot">
                  <span className="ava empty"><Ico.plus /></span>
                  <span className="cp-who"><b>Add a trusted contact</b><span>Family, neighbor, caregiver or doctor</span></span>
                  <span className="cp-order">#{i + 2}</span>
                </div>
              ))}
              {contactCap > shown && <div className="pw-note" style={{ textAlign: 'center' }}>+ {contactCap - shown} more slots in your dashboard</div>}
            </div>
          </div>
        </div>

        <div className="success-actions">
          <a className="btn btn-primary btn-lg btn-block" href="iCanCall Dashboard.html">Go to dashboard <Ico.arrowR /></a>
          <span className="sa-note">A confirmation has been sent to {data.account.email || 'your email'}.</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StepNav, PlanStep, AccountStep, NumberStep, PaymentStep, SuccessStep });
