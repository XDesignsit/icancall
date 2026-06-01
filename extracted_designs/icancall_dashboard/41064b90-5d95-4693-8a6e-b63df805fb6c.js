/* iCanCall Dashboard — Call log view */

function CallLogView({ line, log }) {
  const [filter, setFilter] = React.useState('all');
  const calls = log[line.id] || [];
  const counts = {
    all: calls.length,
    connected: calls.filter((c) => c.status === 'connected').length,
    missed: calls.filter((c) => c.status === 'missed').length,
    voicemail: calls.filter((c) => c.status === 'voicemail').length,
  };
  const shown = filter === 'all' ? calls : calls.filter((c) => c.status === filter);

  const pills = [
    ['all', 'All'], ['connected', 'Connected'], ['missed', 'Missed'], ['voicemail', 'Voicemail'],
  ];

  return (
    <div className="content-inner">
      <div className="logtools">
        <div className="filter-pills">
          {pills.map(([k, lbl]) => (
            <button key={k} className={`fpill ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
              {lbl} <span style={{ opacity: 0.7 }}>{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="topbar-spacer"></div>
        <button className="btn btn-ghost btn-sm"><Icon name="download" /> Export CSV</button>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h2>Call history</h2><p>Every call to {line.number}, including missed attempts</p></div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <div className="log">
            {shown.map((c) => {
              const m = STATUS_META[c.status];
              return (
                <div className="logrow" key={c.id}>
                  <div className={`dir ${m.dirCls}`}><Icon name={c.status === 'voicemail' ? 'voicemail' : c.status === 'missed' ? 'alert' : 'in'} /></div>
                  <div className="who"><b>{c.caller}</b><span>incoming call</span></div>
                  <div className="routed"><b>{c.routed}</b>{c.rel}</div>
                  <div className="dur">{c.dur}</div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge kind={m.badge.replace('badge-', '')}>{m.label}</Badge>
                    <div className="when" style={{ marginTop: 5 }}>{c.when}</div>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-faint)', fontSize: '0.9rem' }}>
                No {filter} calls on this line.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CallLogView });
