/* iCanCall Dashboard — Greetings & notification settings */

function SettingsView({ line, setLine, showToast }) {
  const s = line.settings || {};
  const set = (patch) => setLine((l) => ({ ...l, settings: { ...(l.settings || {}), ...patch } }));

  // sensible defaults per line
  const greeting = s.greeting ?? `Hi, you've reached ${line.person.split(' · ')[0]}. ${line.mode === 'menu' ? "Please choose who you'd like to reach." : 'Hold on while we connect you.'}`;
  const bilingual = s.bilingual ?? true;
  const language2 = s.language2 ?? 'Spanish';
  const notifSMS = s.notifSMS ?? true;
  const notifEmail = s.notifEmail ?? true;
  const notifMissed = s.notifMissed ?? true;
  const notifWeekly = s.notifWeekly ?? false;

  return (
    <div className="content-inner">
      {/* greeting */}
      <div className="card section-gap">
        <div className="card-head"><div><h2>Greeting</h2><p>What callers hear when they dial {line.number}</p></div></div>
        <div className="card-pad">
          <div className="field">
            <label>Greeting message</label>
            <textarea rows={3} value={greeting} onChange={(e) => set({ greeting: e.target.value })} />
          </div>
          <div className="set-row" style={{ paddingTop: 4 }}>
            <div className="txt">
              <b>Bilingual greeting</b>
              <p>Play the greeting in a second language after English. Recommended for caregivers and multilingual families.</p>
            </div>
            <Toggle on={bilingual} onChange={(v) => set({ bilingual: v })} labels={['Off', 'On']} />
          </div>
          {bilingual && (
            <div className="field" style={{ marginTop: 16, marginBottom: 0, maxWidth: 260 }}>
              <label>Second language</label>
              <select value={language2} onChange={(e) => set({ language2: e.target.value })}>
                {['Spanish', 'Mandarin', 'Tagalog', 'Vietnamese', 'French', 'Korean'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* notifications */}
      <div className="card">
        <div className="card-head"><div><h2>Notifications</h2><p>How you're alerted about calls on this line</p></div></div>
        <div className="card-pad" style={{ paddingTop: 4 }}>
          <div className="set-row">
            <div className="txt"><b>SMS alerts</b><p>Text Maria the moment a call comes through, including who answered.</p></div>
            <Toggle on={notifSMS} onChange={(v) => set({ notifSMS: v })} labels={['Off', 'On']} />
          </div>
          <div className="set-row">
            <div className="txt"><b>Email alerts</b><p>Send a copy of every call notification to your inbox.</p></div>
            <Toggle on={notifEmail} onChange={(v) => set({ notifEmail: v })} labels={['Off', 'On']} />
          </div>
          <div className="set-row">
            <div className="txt"><b>Missed-call alerts</b><p>Get notified immediately if no one in the circle answers.</p></div>
            <Toggle on={notifMissed} onChange={(v) => set({ notifMissed: v })} labels={['Off', 'On']} />
          </div>
          <div className="set-row">
            <div className="txt"><b>Weekly safety report</b><p>A Monday summary of all call activity across this line.</p></div>
            <Toggle on={notifWeekly} onChange={(v) => set({ notifWeekly: v })} labels={['Off', 'On']} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => showToast('Settings saved')}><Icon name="check" /> Save changes</button>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsView });
