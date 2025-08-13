export default function RiskGauge({ score = 0, size = 120 }) {
  const s = Math.max(0, Math.min(100, score));
  const level = s >= 60 ? "red" : s >= 30 ? "yellow" : "green";

  const r = 48; // radius
  const cx = 60,
    cy = 60; // center
  const start = 180,
    end = 0; // semi-circle
  const theta = start + (end - start) * (s / 100);
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const [x0, y0] = toXY(start);
  const [x1, y1] = toXY(end);
  const [xp, yp] = toXY(theta);

  const arcPath = `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  const rail = "#222a60";
  const col =
    level === "red" ? "#ff4d6d" : level === "yellow" ? "#ffd166" : "#2ecc71";

  return (
    <svg
      width={size}
      height={size * 0.66}
      viewBox='0 0 120 80'
      aria-label={`Risk score ${s}`}>
      {/* rail */}
      <path d={arcPath} stroke={rail} strokeWidth='10' fill='none' />
      {/* progress (mask by clipping angle) */}
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 ${theta < 90 ? 0 : 1} 1 ${xp} ${yp}`}
        stroke={col}
        strokeWidth='10'
        fill='none'
        strokeLinecap='round'
      />
      {/* tick/needle */}
      <line x1={cx} y1={cy} x2={xp} y2={yp} stroke={col} strokeWidth='2' />
      {/* center dot */}
      <circle cx={cx} cy={cy} r='3' fill={col} />
      {/* label */}
      <text x='60' y='74' textAnchor='middle' fontSize='10' fill='#b7c0ff'>
        {level.toUpperCase()} • {s}
      </text>
    </svg>
  );
}
