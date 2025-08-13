import { useState } from "react";
import Modal from "./ui/Modal.jsx";

export default function EncryptionModal({
  open,
  mode = "lock",
  count = 0,
  onCancel,
  onSubmit,
}) {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const isLock = mode === "lock";

  const go = () => {
    if (!pass) return;
    onSubmit?.(pass);
    setPass("");
  };

  return (
    <Modal open={open} onClose={onCancel} size='sm' labelledBy='enc-title'>
      <div className='modal-head'>
        <h3 id='enc-title' className='modal-title'>
          {isLock ? "Lock vault" : "Unlock vault"}
        </h3>
        <button className='btn modal-close' onClick={onCancel}>
          Close
        </button>
      </div>
      <p className='muted'>
        {isLock
          ? `Encrypt ${count} item(s) with a passphrase. Keep it safe — there’s no recovery.`
          : `Enter your passphrase to decrypt the vault.`}
      </p>
      <label>
        <div style={{ marginBottom: 6 }}>Passphrase</div>
        <input
          className='input'
          type={show ? "text" : "password"}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
      </label>
      <label className='row' style={{ gap: 8, marginTop: 8 }}>
        <input
          type='checkbox'
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
        />{" "}
        Show
      </label>
      <div
        className='row'
        style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <button className='btn ghost' onClick={onCancel}>
          Cancel
        </button>
        <button className='btn' onClick={go} disabled={!pass}>
          {isLock ? "Lock" : "Unlock"}
        </button>
      </div>
    </Modal>
  );
}
