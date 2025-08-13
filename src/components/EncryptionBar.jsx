import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { deriveKey } from "../utils/crypto.js";

function strengthScore(pw) {
  let s = 0;
  if (!pw) return 0;
  if (pw.length >= 12) s += 2;
  if (pw.length >= 16) s += 2;
  if (/[A-Z]/.test(pw)) s += 1;
  if (/[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 2;
  return Math.min(8, s);
}
function strengthLabel(n) {
  return [
    "very weak",
    "weak",
    "weak",
    "okay",
    "good",
    "strong",
    "strong",
    "very strong",
    "excellent",
  ][n];
}

export default function EncryptionBar() {
  const { encKey, setEncKey, saltB64, setSaltB64 } = useApp();
  const [pass, setPass] = useState("");
  const [hint, setHint] = useState(
    () => localStorage.getItem("enc_hint") || ""
  );
  const score = useMemo(() => strengthScore(pass), [pass]);

  const handleEnable = async () => {
    if (!pass) return alert("Enter a passphrase first.");
    const { key, saltB64: sb } = await deriveKey(pass, saltB64 || undefined);
    setEncKey(key);
    if (!saltB64) {
      localStorage.setItem("enc_salt_b64", sb);
      setSaltB64(sb);
    }
    if (hint) localStorage.setItem("enc_hint", hint);
    setPass("");
    alert("Encryption enabled. New files will be stored encrypted.");
  };

  const handleDisable = () => {
    setEncKey(null);
    alert(
      "Encryption disabled for NEW files. Existing encrypted files remain encrypted."
    );
  };

  return (
    <div className='row' style={{ gap: 8, flexWrap: "wrap" }}>
      <span className='badge'>
        {encKey ? "Encryption: ON" : "Encryption: OFF"}
      </span>
      {!encKey && (
        <>
          <input
            className='input'
            placeholder='Set passphrase (remember this!)'
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type='password'
            style={{ maxWidth: 240 }}
          />
          <div
            className='pill'
            title='Password strength'
            style={{ minWidth: 110, textAlign: "center" }}>
            {strengthLabel(score)}
          </div>
          <input
            className='input'
            placeholder='Optional passphrase hint (stored locally)'
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <button className='btn' onClick={handleEnable}>
            Enable
          </button>
        </>
      )}
      {encKey && (
        <>
          <button className='btn' onClick={handleDisable}>
            Disable
          </button>
          {hint && (
            <span className='badge' title='Hint is stored locally'>
              hint: {hint}
            </span>
          )}
        </>
      )}
    </div>
  );
}
