// IndexedDB helper for metadata + blobs
const DB_NAME = "safelink-db";
const META = "meta";
const BLOBS = "blobs";
const VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- blobs ----------
export async function idbSet(id, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readwrite");
    tx.objectStore(BLOBS).put(blob, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function idbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readonly");
    const req = tx.objectStore(BLOBS).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
export async function idbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readwrite");
    tx.objectStore(BLOBS).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function idbClearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, "readwrite");
    const req = tx.objectStore(BLOBS).clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// ---------- metadata (array of evidence items stored under key "all") ----------
export async function metaLoadAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META, "readonly");
    const req = tx.objectStore(META).get("all");
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
export async function metaSaveAll(items) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META, "readwrite");
    tx.objectStore(META).put(items, "all");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- migration from localStorage evidence_v1 ----------
export async function migrateLocalStorageToIDB() {
  const raw = localStorage.getItem("evidence_v1");
  if (!raw) return false;
  try {
    const arr = JSON.parse(raw);
    await metaSaveAll(arr);
    localStorage.removeItem("evidence_v1");
    return true;
  } catch {
    return false;
  }
}

// ---------- wipe EVERYTHING ----------
export async function wipeEverything() {
  // Delete the whole database
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
  // Local artifacts
  localStorage.removeItem("enc_salt_b64");
  localStorage.removeItem("enc_hint");
}
