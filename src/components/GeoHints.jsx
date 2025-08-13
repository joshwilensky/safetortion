import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fetchEvidenceLink } from "../utils/api.js";
import { idbGet } from "../utils/idb.js";
import { readGPS } from "../utils/exif.js";

export default function GeoHints() {
  const { evidence } = useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]); // [{...h, color, reason}]

  const refresh = async () => {
    setLoading(true);
    const raw = [];

    // 1) IP logs from Evidence Link notes
    const linkNotes = evidence.filter(
      (e) => e.metadata?.kind === "evidence-link" && e.metadata?.id
    );
    for (const note of linkNotes) {
      try {
        const data = await fetchEvidenceLink(note.metadata.id);
        (data?.events || []).forEach((evt) => {
          const g = evt.geo || {};
          if (isNum(g.lat) && isNum(g.lon)) {
            raw.push({
              type: "ip",
              lat: g.lat,
              lon: g.lon,
              city: g.city || null,
              region: g.region || null,
              country: g.country || null,
              at: evt.at,
              sourceId: note.metadata.id,
            });
          }
        });
      } catch {}
    }

    // 2) EXIF GPS from uploaded images
    const images = evidence.filter((e) => e.type === "image");
    for (const img of images) {
      try {
        const blob = await idbGet(img.id);
        if (!blob) continue;
        const gps = await readGPS(blob);
        if (gps)
          raw.push({
            type: "exif",
            lat: gps.lat,
            lon: gps.lon,
            at: img.createdAt,
            sourceId: img.id,
          });
      } catch {}
    }

    // Cluster by rounded coords (~1–3km), compute metrics
    const clusters = summarizeClusters(raw, 2);

    // Build deduped rows (newest first) with color + reason
    const seen = new Set();
    const dedup = [];
    for (const h of raw.sort((a, b) => (b.at || 0) - (a.at || 0))) {
      const key = clusterKey(h.lat, h.lon, 2);
      if (seen.has(key)) continue;
      seen.add(key);

      const { count, hasExif, newestAt } = clusters.get(key) || {
        count: 1,
        hasExif: false,
        newestAt: h.at,
      };
      const { color, reason } = gradeHint({
        type: h.type,
        at: newestAt,
        count,
        hasExif,
      });

      dedup.push({
        ...h,
        lat: round(h.lat, 3),
        lon: round(h.lon, 3), // display rounded
        color,
        reason,
        count,
      });
    }

    setRows(dedup);
    setLoading(false);
  };

  return (
    <div className='card' style={{ marginTop: 10 }}>
      <div
        className='row'
        style={{ justifyContent: "space-between", alignItems: "center" }}>
        <b>Geo hints (approximate)</b>
        <button className='btn' onClick={refresh} disabled={loading}>
          {loading ? "Scanning…" : "Find hints"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p style={{ opacity: 0.85, marginTop: 8 }}>
          No geo hints yet. Use the Evidence Link to log IP (on click) or
          original photos with EXIF.
        </p>
      ) : (
        <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
          {rows.map((h, i) => (
            <li
              key={i}
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
              <Flag color={h.color} title={h.reason} />
              <span className='badge'>
                {h.type === "ip" ? "IP log" : "EXIF"}
              </span>
              <span>
                {h.city ? `${h.city}, ` : ""}
                {h.region ? `${h.region}, ` : ""}
                {h.country || ""}
              </span>
              <code style={{ opacity: 0.8 }}>
                {h.lat}, {h.lon}
              </code>
              <span style={{ opacity: 0.7, marginLeft: 4 }}>
                {h.at ? new Date(h.at).toLocaleString() : ""}
                {h.count > 1 ? ` • ${h.count} hits near here` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className='badge' style={{ marginTop: 8 }}>
        Safety note: these are coarse locations for reporting. Don’t confront or
        dox anyone.
      </p>
    </div>
  );
}

/* ----- helpers ----- */

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}
function round(n, p) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}
function clusterKey(lat, lon, places) {
  return `${round(lat, places)},${round(lon, places)}`;
}

/** Summarize clusters keyed by rounded coords */
function summarizeClusters(arr, places = 2) {
  const map = new Map();
  for (const h of arr) {
    if (!isNum(h.lat) || !isNum(h.lon)) continue;
    const key = clusterKey(h.lat, h.lon, places);
    const cur = map.get(key) || { count: 0, hasExif: false, newestAt: 0 };
    cur.count += 1;
    if (h.type === "exif") cur.hasExif = true;
    if ((h.at || 0) > cur.newestAt) cur.newestAt = h.at || 0;
    map.set(key, cur);
  }
  return map;
}

/** Assign red / yellow / green with a short reason */
function gradeHint({ type, at, count, hasExif }) {
  const days = at ? (Date.now() - at) / (1000 * 60 * 60 * 24) : Infinity;

  // Strong signals
  if (hasExif && days <= 30)
    return { color: "red", reason: "Precise EXIF GPS within last 30 days" };
  if (count >= 3 && days <= 14)
    return { color: "red", reason: "3+ corroborating hits in last 14 days" };

  // Medium
  if (hasExif)
    return { color: "yellow", reason: "EXIF GPS present (older than 30 days)" };
  if (count >= 2 || days <= 14)
    return { color: "yellow", reason: "Recent or multiple IP hits" };

  // Weak
  return { color: "green", reason: "Single, older, or coarse hint" };
}

/** Small colored flag SVG */
function Flag({ color = "green", title = "" }) {
  const fill =
    color === "red" ? "#ff4d6d" : color === "yellow" ? "#ffcc00" : "#27c93f";
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      aria-label={`${color} flag`}
      title={title}>
      <path d='M5 3v18' stroke='#a9b2d0' strokeWidth='1.8' />
      <path d='M6 4h10l-2 3 2 3H6z' fill={fill} stroke='none' />
    </svg>
  );
}
