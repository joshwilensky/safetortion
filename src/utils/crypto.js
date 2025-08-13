// Lightweight AES-GCM crypto helpers for text, JSON, and blobs.
// PBKDF2(SHA-256, 100k) for key derivation. Browser-only (uses WebCrypto).

const enc = new TextEncoder();
const dec = new TextDecoder();

/* ---------- base64 helpers (Uint8Array <-> b64) ---------- */
function toB64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64 || "");
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

/* ---------- key derivation ---------- */
export async function deriveKey(passphrase, saltU8) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(passphrase || "")),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltU8, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* ---------- JSON ---------- */
export async function encryptJSON(obj, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const data = enc.encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    v: 1,
    type: "json",
    iv: toB64(iv),
    salt: toB64(salt),
    ct: toB64(new Uint8Array(ct)),
  };
}

export async function decryptJSON(pkg, passphrase) {
  const iv = fromB64(pkg.iv);
  const salt = fromB64(pkg.salt);
  const ct = fromB64(pkg.ct);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(dec.decode(new Uint8Array(pt)));
}

/* ---------- plain text ---------- */
export async function encryptText(text, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const data = enc.encode(String(text ?? ""));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    v: 1,
    type: "text",
    iv: toB64(iv),
    salt: toB64(salt),
    ct: toB64(new Uint8Array(ct)),
  };
}

export async function decryptText(pkg, passphrase) {
  const iv = fromB64(pkg.iv);
  const salt = fromB64(pkg.salt);
  const ct = fromB64(pkg.ct);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(new Uint8Array(pt));
}

/* ---------- Blob/File (images, etc.) ---------- */
// Returns an encrypted package with mime/name so you can restore it later.
export async function encryptBlob(blobOrFile, passphrase) {
  const blob = blobOrFile;
  const buf = await blob.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buf);
  return {
    v: 1,
    type: "blob",
    iv: toB64(iv),
    salt: toB64(salt),
    ct: toB64(new Uint8Array(ct)),
    mime: blob.type || "application/octet-stream",
    name: blob.name || null,
  };
}

export async function decryptBlob(pkg, passphrase) {
  const iv = fromB64(pkg.iv);
  const salt = fromB64(pkg.salt);
  const ct = fromB64(pkg.ct);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const blob = new Blob([pt], { type: pkg.mime || "application/octet-stream" });
  return { blob, name: pkg.name || null };
}
