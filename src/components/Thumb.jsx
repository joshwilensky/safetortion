import { useMemo } from "react";

export default function Thumb({ item, h = 140, radius = 12 }) {
  const type = (item?.type || "note").toLowerCase();

  const src = useMemo(() => {
    // Prefer explicit blob/data URLs set in metadata
    const m = item?.metadata || {};
    return m.thumbUrl || m.blobUrl || m.dataUrl || null;
  }, [item]);

  if (type === "image" && src) {
    return (
      <div className='thumb' style={{ height: h, borderRadius: radius }}>
        <img src={src} alt='' loading='lazy' />
      </div>
    );
  }

  const icon = iconForType(type);
  const label = labelForType(type);
  return (
    <div
      className='thumb thumb-fallback'
      style={{ height: h, borderRadius: radius }}>
      <div className='thumb-icon' aria-hidden='true'>
        {icon}
      </div>
      <div className='thumb-label'>{label}</div>
    </div>
  );
}

function labelForType(t) {
  if (t === "scan") return "Scan";
  if (t === "image") return "Image";
  if (t === "link") return "Link";
  if (t === "pdf") return "PDF";
  return "Note";
}

function iconForType(t) {
  const s = { width: 28, height: 28, opacity: 0.9 };
  if (t === "image")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <rect x='3' y='5' width='18' height='14' rx='2' fill='#a9b2d0' />
        <circle cx='9' cy='10' r='2' fill='#0b0d20' />
        <path
          d='M7 17l4-4 3 3 3-3 3 3'
          stroke='#0b0d20'
          strokeWidth='1.5'
          fill='none'
        />
      </svg>
    );
  if (t === "link")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path
          d='M10 7h7a3 3 0 0 1 0 6h-3'
          stroke='#a9b2d0'
          strokeWidth='1.8'
          fill='none'
        />
        <path
          d='M14 17H7a3 3 0 1 1 0-6h3'
          stroke='#a9b2d0'
          strokeWidth='1.8'
          fill='none'
        />
      </svg>
    );
  if (t === "pdf")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path
          d='M6 3h9l5 5v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'
          fill='#a9b2d0'
        />
        <path d='M15 3v5h5' fill='#0b0d20' />
      </svg>
    );
  return (
    <svg viewBox='0 0 24 24' style={s}>
      <path
        d='M7 3h10a2 2 0 012 2v9l-6 6H7a2 2 0 01-2-2V5a2 2 0 012-2zm8 13h4l-4 4v-4z'
        fill='#a9b2d0'
      />
    </svg>
  );
}
