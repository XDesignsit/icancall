/* iCanCall Dashboard — Account owner page */

const ACCT_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Login & security' },
  { id: 'contact', label: 'Contact info' },
  { id: 'billing', label: 'Payment & billing' },
];

function AccountView({ account, setAccount, showToast, tab, setTab }) {
  const a = account;
  const set = (patch) => setAccount((prev) => ({ ...prev, ...patch }));

  const [pwd, setPwd] = React.useState({ cur: '', next: '', conf: '' });
  const savePwd = () => {
    if (!pwd.cur || !pwd.next) return showToast('Enter your current and new password');
    if (pwd.next !== pwd.conf) return showToast('New passwords don\u2019t match');
    setPwd({ cur: '', next: '', conf: '' });
    showToast('Password updated');
  };

  return (
    <div className="content-inner">
      <div className="acct-tabs">
        {ACCT_TABS.map((t) => (
          <button key={t.id} className={`acct-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* PROFILE */}
      {tab === 'profile' && (
        <div className="card">
          <div className="card-head"><div><h2>Profile</h2><p>Your personal details on the iCanCall account</p></div></div>
          <div className="card-pad">
            <div className="acct-photo">
              <span className="big-ava">{initials(a.name)}</span>
              <div className="pmeta">
                <b>{a.name}</b>
                <span>{a.role}</span>
                <div className="pacts">
                  <button className="btn btn-ghost btn-sm" onClick={() => showToast('Photo upload available soon')}><Icon name="camera" /> Change photo</button>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="row2">
                <div><label>Full name</label><input value={a.name} onChange={(e) => set({ name: e.target.value })} /></div>
                <div><label>Preferred name</label><input value={a.preferred} onChange={(e) => set({ preferred: e.target.value })} /></div>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Role on this account</label>
              <select value={a.role} onChange={(e) => set({ role: e.target.value })} style={{ maxWidth: 320 }}>
                {['Primary caregiver', 'Family member', 'Account administrator', 'Care coordinator'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast('Profile saved')}><Icon name="check" /> Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY */}
      {tab === 'security' && (
        <>
          <div className="card section-gap">
            <div className="card-head"><div><h2>Login email</h2><p>Used to sign in and recover your account</p></div></div>
            <div className="card-pad">
              <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
                <label>Email address</label>
                <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button className="btn btn-ghost" onClick={() => showToast('Verification sent to your new email')}>Update email</button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head"><div><h2>Password</h2><p>Choose a strong password you don\u2019t use elsewhere</p></div></div>
            <div className="card-pad">
              <div style={{ maxWidth: 420 }}>
                <div className="field"><label>Current password</label><input type="password" value={pwd.cur} onChange={(e) => setPwd({ ...pwd, cur: e.target.value })} placeholder="••••••••" /></div>
                <div className="field"><label>New password</label><input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="••••••••" /></div>
                <div className="field" style={{ marginBottom: 0 }}><label>Confirm new password</label><input type="password" value={pwd.conf} onChange={(e) => setPwd({ ...pwd, conf: e.target.value })} placeholder="••••••••" /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button className="btn btn-primary" onClick={savePwd}><Icon name="lock" /> Update password</button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head"><div><h2>Two-factor authentication</h2><p>Add an extra layer of security at sign-in</p></div></div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="txt"><b>Text message (SMS) codes</b><p>We\u2019ll text a one-time code to {a.phone} each time you sign in on a new device.</p></div>
                <Toggle on={a.twoFactor} onChange={(v) => { set({ twoFactor: v }); showToast(v ? 'Two-factor enabled' : 'Two-factor disabled'); }} labels={['Off', 'On']} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Active sessions</h2><p>Devices currently signed in to your account</p></div></div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                { dev: 'Chrome · MacBook Pro', loc: 'Oakland, CA', last: 'Active now', cur: true },
                { dev: 'iCanCall app · iPhone 15', loc: 'Oakland, CA', last: '2 hours ago', cur: false },
                { dev: 'Safari · iPad', loc: 'Sacramento, CA', last: 'Yesterday', cur: false },
              ].map((s, i) => (
                <div className="session" key={i}>
                  <span className="sic"><Icon name="device" /></span>
                  <div className="sinfo"><b>{s.dev}</b><span>{s.loc} · {s.last}</span></div>
                  {s.cur ? <Badge kind="green">This device</Badge> : <button className="btn btn-danger-ghost btn-sm" onClick={() => showToast('Signed out of ' + s.dev)}><Icon name="logout" /> Sign out</button>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CONTACT */}
      {tab === 'contact' && (
        <div className="card">
          <div className="card-head"><div><h2>Contact information</h2><p>Where we reach you with call alerts and account notices</p></div></div>
          <div className="card-pad">
            <div className="field">
              <div className="row2">
                <div><label>Mobile phone</label><input value={a.phone} onChange={(e) => set({ phone: e.target.value })} /></div>
                <div><label>Notification email</label><input type="email" value={a.notifyEmail} onChange={(e) => set({ notifyEmail: e.target.value })} /></div>
              </div>
            </div>
            <div className="field"><label>Mailing address</label><input value={a.address} onChange={(e) => set({ address: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row2">
                <div>
                  <label>Time zone</label>
                  <select value={a.timezone} onChange={(e) => set({ timezone: e.target.value })}>
                    {['Pacific (PT)', 'Mountain (MT)', 'Central (CT)', 'Eastern (ET)'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Preferred language</label>
                  <select value={a.language} onChange={(e) => set({ language: e.target.value })}>
                    {['English', 'Spanish', 'Mandarin', 'Tagalog', 'Vietnamese', 'French'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast('Contact info saved')}><Icon name="check" /> Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING */}
      {tab === 'billing' && (
        <>
          <div className="card section-gap">
            <div className="card-head">
              <div><h2>Current plan</h2><p>Billed monthly · renews June 1, 2026</p></div>
              <Badge kind="blue">Pro</Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.03em' }}>$19.99</span>
                <span style={{ color: 'var(--ink-faint)' }}>/ month</span>
                <span style={{ marginLeft: 10 }}><Badge kind="green">Save 17% on annual</Badge></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginTop: 18 }} className="feat-grid">
                {['2 dedicated phone numbers', '6 routable contacts per number', 'Cascade routing + Caller Menu', 'Real-time SMS & email alerts', 'Bilingual greeting options', 'Admin dashboard'].map((f) => (
                  <div className="plan-feat" key={f}><Icon name="check" /> {f}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast('Switched to annual billing — $199/yr')}><Icon name="spark" /> Switch to annual</button>
                <button className="btn btn-ghost" onClick={() => showToast('Opening plan options…')}>Change plan</button>
              </div>
            </div>
          </div>

          {/* ADD-ONS */}
          {(() => {
            const ad = a.addons || { extraNumbers: 0, minuteBlocks: 0 };
            const setAd = (patch) => setAccount((prev) => ({ ...prev, addons: { ...(prev.addons || {}), ...patch } }));
            const numCost = ad.extraNumbers * 6.99;
            const minCost = ad.minuteBlocks * 4.99;
            const total = 19.99 + numCost + minCost;
            const maxBlocks = 10;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div><h2>Add-ons</h2><p>Available on both the Essential and Pro plans</p></div>
                </div>
                <div className="card-pad" style={{ paddingTop: 8 }}>
                  {/* extra numbers */}
                  <div className="addon">
                    <span className="aic"><Icon name="phone" /></span>
                    <div className="abody">
                      <div className="atop"><b>Additional phone number</b><span className="price">$6.99 / mo each</span></div>
                      <p>Add another dedicated iCanCall number for another loved one, each with its own contacts and routing.</p>
                    </div>
                    <div className="actl">
                      <div className="stepper">
                        <button onClick={() => setAd({ extraNumbers: Math.max(0, ad.extraNumbers - 1) })} disabled={ad.extraNumbers === 0} aria-label="Remove one">−</button>
                        <span className="v">{ad.extraNumbers}</span>
                        <button onClick={() => setAd({ extraNumbers: Math.min(8, ad.extraNumbers + 1) })} disabled={ad.extraNumbers === 8} aria-label="Add one">+</button>
                      </div>
                      <span className="sub">{numCost > 0 ? `+$${numCost.toFixed(2)}/mo` : 'Included: base plan'}</span>
                    </div>
                  </div>

                  {/* extra minutes */}
                  <div className="addon">
                    <span className="aic"><Icon name="clock" /></span>
                    <div className="abody">
                      <div className="atop"><b>Extra voice minutes</b><span className="price">$4.99 per 30 min</span></div>
                      <p>Top up talk time in 30-minute blocks. <b>Unused add-on minutes roll over</b> to the next 30-day billing cycle — you never lose what you've paid for.</p>
                    </div>
                    <div className="actl">
                      <div className="rangewrap">
                        <input type="range" className="rng" min={0} max={maxBlocks} step={1} value={ad.minuteBlocks}
                          style={{ '--pct': `${(ad.minuteBlocks / maxBlocks) * 100}%` }}
                          onChange={(e) => setAd({ minuteBlocks: Number(e.target.value) })} />
                      </div>
                      <span className="sub">{ad.minuteBlocks * 30} min · {minCost > 0 ? `+$${minCost.toFixed(2)}/mo` : '$0.00/mo'}</span>
                    </div>
                  </div>

                  <div className="addon-total">
                    <span className="lbl">New monthly total <b>(plan + add-ons)</b></span>
                    <span className="big">${total.toFixed(2)}<span> / mo</span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => showToast('Add-ons updated')}><Icon name="check" /> Save add-ons</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADD-ON MINUTE BALANCE */}
          {(() => {
            const ad = a.addons || {};
            const purchased = (ad.minuteBlocks || 0) * 30;
            const rollover = ad.rolloverMin || 0;
            const total = purchased + rollover;
            const used = Math.min(ad.usedMin || 0, total);
            const remaining = Math.max(0, total - used);
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const low = total > 0 && remaining <= total * 0.15;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div><h2>Add-on minutes</h2><p>Top-up talk time on top of your plan&rsquo;s included minutes</p></div>
                  {total > 0 && <Badge kind={low ? 'amber' : 'green'}>{low ? 'Running low' : 'Rolls over'}</Badge>}
                </div>
                <div className="card-pad">
                  {total === 0 ? (
                    <div className="mb-empty">
                      <span className="ic"><Icon name="clock" /></span>
                      <div>
                        <b>No add-on minutes yet</b>
                        <p>Add extra voice minutes above and they&rsquo;ll show up here. Unused minutes roll over each cycle, so you never lose what you&rsquo;ve paid for.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-top">
                        <div className="big">{remaining}<span> min remaining</span></div>
                        <div className="mb-meta">{used} of {total} add-on min used &middot; renews June 1, 2026</div>
                      </div>
                      <div className="usage-bar bigbar" style={{ marginTop: 14 }}><i className={low ? 'warn' : ''} style={{ width: pct + '%' }} /></div>
                      <div className="mb-stats">
                        <div className="mb-stat"><span className="mb-ic"><Icon name="plus" /></span><div><b>{purchased} min</b><span>This cycle&rsquo;s top-up{ad.minuteBlocks ? ` · ${ad.minuteBlocks} × 30 min` : ''}</span></div></div>
                        <div className="mb-stat"><span className="mb-ic"><Icon name="refresh" /></span><div><b>{rollover} min</b><span>Rolled over from last cycle</span></div></div>
                        <div className="mb-stat"><span className="mb-ic"><Icon name="phone" /></span><div><b>{used} min</b><span>Used this cycle</span></div></div>
                      </div>
                      <p className="mb-note"><Icon name="check" /> Plan minutes are used first; add-on minutes kick in only after those run out. Remaining add-on minutes roll over automatically.</p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="card section-gap">
            <div className="card-head">
              <div><h2>Payment method</h2><p>Charged on the 1st of each month</p></div>
            </div>
            <div className="card-pad">
              <div className="card-on-file">
                <span className="card-brand">{a.card.brand.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="cnum">•••• •••• •••• {a.card.last4}</div>
                  <div className="cexp">Expires {a.card.exp}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => showToast('Opening secure card form…')}><Icon name="card" /> Update card</button>
              </div>
              <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
                <label>Billing address</label>
                <input value={a.billingAddr} onChange={(e) => set({ billingAddr: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast('Billing details saved')}><Icon name="check" /> Save changes</button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head"><div><h2>Billing history</h2><p>Visa ending {a.card.last4}</p></div></div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[['May 1, 2026', 'Pro · monthly', '$19.99'], ['Apr 1, 2026', 'Pro · monthly', '$19.99'], ['Mar 1, 2026', 'Pro · monthly', '$19.99']].map(([d, desc, amt]) => (
                <div className="invoice" key={d}>
                  <div className="l"><b>{d}</b><span>{desc}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="amt">{amt}</span>
                    <button className="btn btn-soft btn-sm"><Icon name="download" /> Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head"><div><h2>Cancel subscription</h2><p>Your numbers stay active until the end of the billing period</p></div></div>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <button className="btn btn-danger-ghost" onClick={() => showToast('We\u2019d hate to see you go — contact support to cancel')}>Cancel iCanCall Pro</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { AccountView });
