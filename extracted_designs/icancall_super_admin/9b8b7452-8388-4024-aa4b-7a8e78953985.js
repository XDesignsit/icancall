/* iCanCall — Super Admin · lightweight SVG charts
   Pure data-viz (no decorative drawing). All scale via viewBox. */

const { useId: useIdC } = React;

/* smooth-ish area + line chart */
function AreaChart({ data, height = 150, stroke = 'var(--blue)', fill = 'var(--blue)', dp = 0, fmt }) {
  const gid = (useIdC ? useIdC() : 'g' + Math.random().toString(36).slice(2));
  const W = 600, H = height, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const n = data.length;
  const x = (i) => pad + (i * (W - pad * 2)) / (n - 1);
  const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2 - 14);
  const pts = data.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${(W - pad).toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={stroke} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* vertical bars with optional highlighted last bar */
function Bars({ data, labels, height = 150, color = 'var(--blue)', highlight = true }) {
  const W = 600, H = height, pad = 6, gap = 0.34;
  const max = Math.max(...data) || 1;
  const n = data.length;
  const bw = (W - pad * 2) / n;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {data.map((v, i) => {
        const h = (v / max) * (H - pad * 2 - 4);
        const isLast = i === n - 1;
        return (
          <rect key={i} x={pad + i * bw + (bw * gap) / 2} y={H - pad - h}
            width={bw * (1 - gap)} height={Math.max(h, 1)} rx="3"
            fill={highlight && isLast ? color : 'var(--tint-2)'} />
        );
      })}
    </svg>
  );
}

/* donut for plan / status split */
function Donut({ segments, size = 168, thickness = 22, centerTop, centerBottom }) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--tint)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.count / total) * circ;
          const dash = `${len} ${circ - len}`;
          const el = (
            <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color || 'var(--blue)'}
              strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={-offset}
              strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <b>{centerTop}</b>
        <span>{centerBottom}</span>
      </div>
    </div>
  );
}

/* tiny inline sparkline */
function Spark({ data, width = 88, height = 30, stroke = 'var(--green)' }) {
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const x = (i) => (i * width) / (data.length - 1);
  const y = (v) => height - 3 - ((v - min) / span) * (height - 6);
  const d = data.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* horizontal labelled progress row */
function HBar({ pct, color = 'var(--blue)' }) {
  return (
    <div className="hbar"><i style={{ width: pct + '%', background: color }} /></div>
  );
}

Object.assign(window, { AreaChart, Bars, Donut, Spark, HBar });
