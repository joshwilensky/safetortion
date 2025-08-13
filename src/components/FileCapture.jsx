import { useState } from "react";
import { sha256, imageDHashFromFile } from "../utils/hash.js";
import { idbSet } from "../utils/idb.js";
import { useApp } from "../context/AppContext.jsx";
import { encryptBlob } from "../utils/crypto.js";

export default function FileCapture() {
  const { addEvidence, encKey } = useApp();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  const onFiles = async (files) => {
    setBusy(true);
    try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const sha = await sha256(arrayBuffer);

        let dhash = null,
          width = null,
          height = null,
          type = "file";
        if (file.type.startsWith("image/")) {
          try {
            dhash = await imageDHashFromFile(file);
            const dims = await getImageDims(file);
            width = dims.width;
            height = dims.height;
            type = "image";
          } catch {}
        }

        // Encrypt (if enabled) before storing
        let blobToStore = new Blob([arrayBuffer], { type: file.type });
        let ivB64 = null;
        let encrypted = false;
        if (encKey) {
          const enc = await encryptBlob(encKey, blobToStore);
          blobToStore = enc.blob;
          ivB64 = enc.ivB64;
          encrypted = true;
        }

        const id = addEvidence({
          type,
          title: file.name,
          content: "",
          metadata: {
            mime: file.type,
            size: file.size,
            sha256: sha,
            dhash,
            width,
            height,
            encrypted,
            ivB64,
          },
        });
        await idbSet(id, blobToStore);

        setLast({ id, name: file.name, sha, dhash, encrypted });
      }
      alert(
        "Saved file(s) to Evidence Vault with hashes" +
          (encKey ? " (encrypted)" : "") +
          "."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleInput = (e) => {
    const files = Array.from(e.target.files || []);
    onFiles(files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    onFiles(files);
  };

  return (
    <div
      className='card'
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}>
      <h2>Add Files / Screenshots</h2>
      <p className='badge'>
        {/* Images compute dHash + SHA-256. Other files get SHA-256.{" "} */}
        {encKey ? "Encryption ON" : "Encryption OFF"}
      </p>
      <div className='row' style={{ gap: 8, marginBottom: 10 }}>
        <input id='file-input' type='file' multiple onChange={handleInput} />
      </div>
      <div style={dropZoneStyle}>Drag & drop files here</div>
      {busy && <p>Processing…</p>}
      {last && (
        <div style={{ marginTop: 10 }}>
          <div>
            <b>Last saved:</b> {last.name}{" "}
            {last.encrypted ? <span className='badge'>encrypted</span> : null}
          </div>
          <div>
            <span className='badge'>sha256</span> <code>{last.sha}</code>
          </div>
          {last.dhash && (
            <div>
              <span className='badge'>dHash</span> <code>{last.dhash}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const dropZoneStyle = {
  border: "1px dashed #2b3268",
  borderRadius: 12,
  padding: 18,
  textAlign: "center",
  background: "#0e1230",
};

function getImageDims(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = reject;
    img.src = url;
  });
}
