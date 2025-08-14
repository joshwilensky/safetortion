import { useRef, useState } from "react";
import Modal from "./ui/Modal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "./ui/ToastProvider.jsx";
import { encryptJSON, decryptJSON } from "../utils/crypto.js";
import { listArchives, purgeArchive, archiveItems } from "../utils/archive.js";

export default function BackupModal({
  open,
  onClose,
  onExported,
  onImported,
  itemsInTrash = 0,
}) {
  const { evidence, addEvidence, clearEvidence } = useApp();
  const toast = useToast();

  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const fileRef = useRef(null);

  const makePackage = () => {
    return {
      v: 1,
      createdAt: Date.now(),
      app: "bocasafe",
      evidence,
      // capture recently-deleted items (by item only; we'll re-archive on import)
      archives: listArchives().map((a) => a.item),
      settings: {
        retention_days: Number(localStorage.getItem("retention_days") || 0),
        retention_hard: localStorage.getItem("retention_hard") === "1",
      },
    };
  };

  const exportNow = async () => {
    if (!pass) return;
    const pkg = makePackage();
    const enc = await encryptJSON(pkg, pass);
    const blob = new Blob([JSON.stringify(enc)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `safelink_backup_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.slvault`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.show({ message: "Backup exported.", variant: "success" });
    onExported?.();
  };

  const importNow = async () => {
    if (!pass) return;
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const enc = JSON.parse(text);
      const data = await decryptJSON(enc, pass);
      if (!data?.evidence) throw new Error("Bad file");
      // replace evidence
      clearEvidence();
      data.evidence.forEach((it) => addEvidence(it));
      // reset Recently Deleted
      purgeArchive();
      if (Array.isArray(data.archives) && data.archives.length) {
        archiveItems(data.archives);
      }
      // restore settings
      if (data.settings) {
        localStorage.setItem(
          "retention_days",
          String(data.settings.retention_days || 0)
        );
        localStorage.setItem(
          "retention_hard",
          data.settings.retention_hard ? "1" : "0"
        );
      }
      toast.show({ message: "Backup restored.", variant: "success" });
      onImported?.();
    } catch (e) {
      toast.show({
        message: "Import failed. Wrong passphrase or corrupt file.",
        variant: "error",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} size='sm' labelledBy='bk-title'>
      <div className='modal-head'>
        <h3 id='bk-title' className='modal-title'>
          Backup / Restore
        </h3>
        <button className='btn modal-close' onClick={onClose}>
          Close
        </button>
      </div>

      <div className='card'>
        <b>Passphrase</b>
        <div className='row' style={{ gap: 8, marginTop: 6 }}>
          <input
            className='input'
            type={show ? "text" : "password"}
            placeholder='Required for export & import'
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <label className='row' style={{ gap: 6 }}>
            <input
              type='checkbox'
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Show
          </label>
        </div>
      </div>

      <div className='grid two' style={{ marginTop: 10 }}>
        <div className='card'>
          <b>Export backup</b>
          <p className='muted small' style={{ marginTop: 6 }}>
            Saves your vault ({evidence.length} items) and Recently Deleted (
            {itemsInTrash}).
          </p>
          <button className='btn' onClick={exportNow} disabled={!pass}>
            Export .slvault
          </button>
        </div>

        <div className='card'>
          <b>Restore backup</b>
          <p className='muted small' style={{ marginTop: 6 }}>
            Replaces current vault. Requires the same passphrase used for
            export.
          </p>
          <input
            type='file'
            ref={fileRef}
            accept='.slvault,application/json'
            className='input'
          />
          <button className='btn' onClick={importNow} disabled={!pass}>
            Import
          </button>
        </div>
      </div>
    </Modal>
  );
}
