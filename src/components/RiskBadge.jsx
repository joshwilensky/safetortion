export default function RiskBadge({ level, score }) {
  const color =
    level === "red" ? "#ff4d6d" : level === "yellow" ? "#ffd166" : "#2ecc71";
  const label =
    level === "red"
      ? "High risk"
      : level === "yellow"
      ? "Medium risk"
      : "Low risk";

  return (
    <div className='risk-badge' title={`${label} • Score ${score}`}>
      <Flag color={color} />
      <span style={{ color, fontWeight: 700 }}>{label}</span>
      <span className='risk-score'>({score})</span>
    </div>
  );
}

function Flag({ color }) {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      aria-hidden='true'
      style={{ flex: "0 0 auto" }}>
      <path d='M6 21V4m0 0h9l-1.5 3L18 10H6' fill={color} stroke='none' />
      <path d='M6 21V4' stroke='#aab2ff' strokeWidth='1.5' />
    </svg>
  );
}
