// Unified risk flag + gauge for consistent wording/visuals everywhere.
export default function RiskIndicator({
  score = 0,
  level, // optional; inferred from score if omitted
  variant = "full", // "full" | "compact"
  size = 120, // gauge size in px (only for "full")
}) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const lvl = level || (s >= 60 ? "red" : s >= 30 ? "yellow" : "green");
  const label =
    lvl === "red" ? "High risk" : lvl === "yellow" ? "Medium risk" : "Low risk";
  const color =
    lvl === "red" ? "#ff4d6d" : lvl === "yellow" ? "#ffd166" : "#2ecc71";

  if (variant === "compact") {
    // pill with micro gauge + flag + unified label
    return (
      <div className='ri ri-compact' title={`${label} • ${s}`}>
        <MicroGauge score={s} color={color} />
        <Flag color={color} />
        <span className='ri-text'>{label}</span>
        <span className='ri-score'>({s})</span>
      </div>
    );
  }

  // full: larger gauge + flag + single legend
  return (
    <div
      className='ri ri-full'
      role='group'
      aria-label={`Risk ${s} (${label})`}>
      <div className='ri-gauge'>
        <Gauge score={s} color={color} size={size} />
      </div>
      <div className='ri-legend'>
        <Flag color={color} />
        <div className='ri-lines'>
          <div className='ri-line-1'>{label}</div>
          <div className='ri-line-2'>Score {s}</div>
        </div>
      </div>
    </div>
  );
}

/* ------- visuals ------- */

function Flag({ color }) {
  return (
    <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
      <path d='M6 21V4m0 0h9l-1.5 3L18 10H6' fill={color} stroke='none' />
      <path d='M6 21V4' stroke='#aab2ff' strokeWidth='1.5' />
    </svg>
  );
}

function Gauge({ score, color, size }) {
  // semi-circle gauge
  const s = Math.max(0, Math.min(100, score));
  const r = 48;
  const cx = 60;
  const cy = 60;
  const start = 180,
    end = 0;
  const theta = start + (end - start) * (s / 100);
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x0, y0] = toXY(start);
  const [x1, y1] = toXY(end);
  const [xp, yp] = toXY(theta);
  const rail = "#222a60";

  return (
    <svg
      width={size}
      height={size * 0.66}
      viewBox='0 0 120 80'
      aria-hidden='true'>
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
        stroke={rail}
        strokeWidth='10'
        fill='none'
      />
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 ${theta < 90 ? 0 : 1} 1 ${xp} ${yp}`}
        stroke={color}
        strokeWidth='10'
        fill='none'
        strokeLinecap='round'
      />
      <line x1={cx} y1={cy} x2={xp} y2={yp} stroke={color} strokeWidth='2' />
      <circle cx={cx} cy={cy} r='3' fill={color} />
    </svg>
  );
}

function MicroGauge({ score, color }) {
  // tiny arc used inside pills
  const s = Math.max(0, Math.min(100, score));
  const r = 7;
  const cx = 9;
  const cy = 9;
  const start = 180,
    end = 0;
  const theta = start + (end - start) * (s / 100);
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x0, y0] = toXY(start);
  const [x1, y1] = toXY(end);
  const [xp, yp] = toXY(theta);
  return (
    <svg width='22' height='14' viewBox='0 0 18 12' aria-hidden='true'>
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
        stroke='#222a60'
        strokeWidth='3'
        fill='none'
      />
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 ${theta < 90 ? 0 : 1} 1 ${xp} ${yp}`}
        stroke={color}
        strokeWidth='3'
        fill='none'
        strokeLinecap='round'
      />
    </svg>
  );
}
