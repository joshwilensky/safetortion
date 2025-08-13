export default function PlatformIcon({
  id,
  size = 20,
  color = "#a9b2d0",
  className = "",
}) {
  const s = { width: size, height: size, display: "inline-block" };
  switch (id) {
    case "instagram":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <rect x='3.5' y='3.5' width='17' height='17' rx='5' />
          <circle cx='12' cy='12' r='4.2' />
          <circle cx='17.5' cy='6.5' r='1.2' fill={color} stroke='none' />
        </svg>
      );
    case "x":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='2'>
          <path d='M4 4l16 16M20 4L4 20' />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.8'>
          <path d='M14 4v8.5a4.5 4.5 0 1 1-4.5-4.5' />
          <path d='M14 6c.7 2.1 2.6 3.7 4.9 4' />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox='0 0 24 24' style={s} className={className} fill={color}>
          <path d='M13 10h3V7h-3V5.5A2.5 2.5 0 0 1 15.5 3H18v3h-2.5a.5.5 0 0 0-.5.5V7h3v3h-3v11h-3V10z' />
        </svg>
      );
    case "snapchat":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <path d='M7 9c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.7.7 3.1 2 3.9-1 .7-2.3 1.1-3.7 1.2-.2.8-.8 1.9-3.3 1.9s-3.1-1.1-3.3-1.9c-1.4-.1-2.7-.5-3.7-1.2 1.3-.8 2-2.2 2-3.9z' />
        </svg>
      );
    case "reddit":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <circle cx='12' cy='12' r='6.5' />
          <circle cx='9.5' cy='12' r='1.2' fill={color} stroke='none' />
          <circle cx='14.5' cy='12' r='1.2' fill={color} stroke='none' />
          <path d='M9 15c1.2 1 4.8 1 6 0' />
          <path d='M14.5 7l1-3 3 1' />
        </svg>
      );
    case "youtube":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <rect x='3' y='7' width='18' height='10' rx='3' />
          <path d='M11 10l4 2-4 2z' fill={color} stroke='none' />
        </svg>
      );
    case "discord":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <rect x='4' y='6' width='16' height='12' rx='4' />
          <circle cx='10' cy='12' r='1.3' fill={color} stroke='none' />
          <circle cx='14' cy='12' r='1.3' fill={color} stroke='none' />
        </svg>
      );
    case "telegram":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <path d='M20 4L4 11l6 2 2 6 3-5 5-10z' />
        </svg>
      );
    case "linkedin":
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <rect x='3' y='8' width='4' height='12' />
          <circle cx='5' cy='5' r='2' />
          <rect x='10' y='8' width='11' height='12' />
          <path d='M10 12h11' />
        </svg>
      );
    default:
      return (
        <svg
          viewBox='0 0 24 24'
          style={s}
          className={className}
          fill='none'
          stroke={color}
          strokeWidth='1.6'>
          <circle cx='12' cy='12' r='9' />
          <path d='M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18' />
        </svg>
      );
  }
}
