/* iCanCall onboarding — layout shell, steppers, icons */

const { useState, useEffect, useRef } = React;

/* ---------- Icons ---------- */
const Ico = {
  phone: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5L20 6"/></svg>,
  arrowR: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>,
  arrowL: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5m0 0 6-6m-6 6 6 6"/></svg>,
  shield: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>,
  lock: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
  mail: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>,
  refresh: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v5h-5"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  spark: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  google: (p) => <svg viewBox="0 0 48 48" {...p}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>,
};

function BrandMark({ dark }) {
  return (
    <div className={'obrand' + (dark ? ' on-dark' : '')}>
      <span className="mark"><Ico.phone stroke="#fff" /></span>
      <span>i<b>Can</b>Call</span>
    </div>
  );
}

/* ---------- Vertical stepper (split rail) ---------- */
function VSteps({ stepIndex }) {
  return (
    <div className="vsteps">
      {STEPS.map((s, i) => {
        const cls = i < stepIndex ? 'done' : i === stepIndex ? 'active' : '';
        return (
          <div key={s.key} className={'vstep ' + cls}>
            <span className="vnum">{i < stepIndex ? <Ico.check /> : i + 1}</span>
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Horizontal stepper (centered layout) ---------- */
function HSteps({ stepIndex }) {
  return (
    <div className="hsteps">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className={'hstep-bar' + (i <= stepIndex ? ' filled' : '')} />}
          <div className={'hstep ' + (i < stepIndex ? 'done' : i === stepIndex ? 'active' : '')}>
            <span className="hnum">{i < stepIndex ? <Ico.check /> : i + 1}</span>
            <span className="hlbl">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- Left brand rail (split layout) ---------- */
function Rail({ stepIndex }) {
  return (
    <aside className="rail">
      <div className="rail-head"><BrandMark dark /></div>
      <div className="rail-lede">
        <h2>One number.<br /><span className="accent-line">Always answered.</span></h2>
        <p>You're minutes away from giving your family the certainty of always getting through.</p>
        <VSteps stepIndex={stepIndex} />
      </div>
      <div className="rail-foot">
        <Ico.lock /> Encrypted end to end · Switch plans or cancel anytime
      </div>
    </aside>
  );
}

/* ---------- Shell ---------- */
function Shell({ layout, stepIndex, hideChrome, children }) {
  const split = layout === 'split' && !hideChrome;
  return (
    <div className={'shell ' + (split ? 'split' : 'centered')}>
      {split && <Rail stepIndex={stepIndex} />}
      <div className="content">
        <div className="content-top">
          <BrandMark />
          <div className="signin">Already have an account? <a href="iCanCall Login.html">Sign in</a></div>
        </div>
        {!hideChrome && <HSteps stepIndex={stepIndex} />}
        <div className="content-body">{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Ico, BrandMark, VSteps, HSteps, Rail, Shell });
