// Robust archive utilities for "Recently Deleted" with 10-minute TTL.
// All localStorage access is guarded to avoid crashing the UI.

const KEY = "safelink_archives"; // storage key
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/* ---------- internal helpers ---------- */
function safeLoad() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // sanitize shape
    return data
      .filter(
        (e) => e && typeof e === "object" && e.id && e.item && e.archivedAt
      )
      .map((e) => ({
        id: String(e.id),
        item: e.item,
        archivedAt: Number(e.archivedAt) || Date.now(),
        ttlMs: Number(e.ttlMs) > 0 ? Number(e.ttlMs) : DEFAULT_TTL_MS,
      }));
  } catch {
    // self-heal on corrupt JSON
    try {
      localStorage.removeItem(KEY);
    } catch {}
    return [];
  }
}

function safeSave(list) {
  try {
    const clean = Array.isArray(list) ? list : [];
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // ignore quota/private-mode errors
  }
}

/* ---------- public API ---------- */
export function archiveItems(items, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const list = safeLoad();
  const now = Date.now();
  const toAdd = (Array.isArray(items) ? items : [items])
    .filter(Boolean)
    .map((it) => ({
      id: String(it.id || `${now}_${Math.random().toString(36).slice(2)}`),
      item: it,
      archivedAt: now,
      ttlMs,
    }));
  // dedupe by id (newest wins)
  const map = new Map();
  [...toAdd, ...list].forEach((e) => map.set(e.id, e));
  const out = Array.from(map.values()).sort(
    (a, b) => b.archivedAt - a.archivedAt
  );
  safeSave(out);
  return out;
}

export function listArchives() {
  const list = safeLoad().sort((a, b) => b.archivedAt - a.archivedAt);
  return list;
}

export function restoreArchive(id) {
  const list = safeLoad();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const [entry] = list.splice(idx, 1);
  safeSave(list);
  return entry.item || null;
}

export function purgeArchive(ids) {
  if (!ids || (Array.isArray(ids) && ids.length === 0)) {
    // wipe all
    safeSave([]);
    return [];
  }
  const set = new Set(Array.isArray(ids) ? ids : [ids]);
  const list = safeLoad().filter((e) => !set.has(e.id));
  safeSave(list);
  return list;
}

export function purgeExpired() {
  const list = safeLoad();
  const now = Date.now();
  const keep = list.filter(
    (e) => now - e.archivedAt < (e.ttlMs || DEFAULT_TTL_MS)
  );
  if (keep.length !== list.length) safeSave(keep);
  return keep;
}

export function msRemaining(archivedAt, ttlMs = DEFAULT_TTL_MS) {
  const end = Number(archivedAt || 0) + Number(ttlMs || DEFAULT_TTL_MS);
  return Math.max(0, end - Date.now());
}

export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
