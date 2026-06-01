/* iCanCall Dashboard — Routing mode view */

function RoutingView({ line, setLine, showToast }) {
  const setMode = (mode) => {
    if (mode === line.mode) return;
    setLine((l) => ({ ...l, mode }));
    showToast(mode === 'menu' ? 'Switched to Caller Menu' : 'Switched to Call Cascade');
  };

  return (
    <div className="content-inner">
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>How callers connect</h2>
            <p>Choose what happens when someone dials {line.number}. Changes take effect on the next call.</p>
          </div>
        </div>
        <div className="card-pad">
          <div className="mode-cards">
            <div className={`mode-card ${line.mode === 'cascade' ? 'sel' : ''}`} onClick={() => setMode('cascade')}>
              <span className="check"><Icon name="check" /></span>
              <div className="ic"><Icon name="routing" /></div>
              <h4>Call cascade</h4>
              <p>Ring contacts one after another in the order below until someone answers. Best for emergencies — reaching <i>anyone</i> is what matters.</p>
            </div>
            <div className={`mode-card ${line.mode === 'menu' ? 'sel' : ''}`} onClick={() => setMode('menu')}>
              <span className="check"><Icon name="check" /></span>
              <div className="ic"><Icon name="list" /></div>
              <h4>Caller menu</h4>
              <p>Greet callers and let them choose ("Press 1 for Maria, Press 2 for the doctor…"). Best when the right person depends on the situation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Preview &amp; test</h2>
            <p>Place a simulated call to see exactly what {line.person.split(' · ')[0]}'s callers will experience.</p>
          </div>
          <Badge kind="blue">{line.mode === 'menu' ? 'Caller menu' : 'Call cascade'}</Badge>
        </div>
        <div className="card-pad">
          <TestCall line={line} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RoutingView });
