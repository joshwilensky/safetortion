import { useState } from "react";
import Modal from "./ui/Modal.jsx";

export default function ConfirmClearAllModal({
  open,
  count = 0,
  onCancel,
  onConfirm,
}) {
  const [ack, setAck] = useState(false);
  const [mode, setMode] = useState("archive"); // "archive" | "delete"

  const resetAndClose = () => {
    setAck(false);
    setMode("archive");
    onCancel?.();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      size='sm'
      labelledBy='clearall-title'
      describedBy='clearall-desc'>
      <div className='modal-head'>
        <h3 id='clearall-title' className='modal-title'>
          Clear all evidence
        </h3>
        <button
          className='btn modal-close'
          onClick={resetAndClose}
          aria-label='Close'>
          Close
        </button>
      </div>

      <div className='warn-row'>
        <WarnIcon />
        <div id='clearall-desc'>
          <p className='danger-text'>
            <b>{count}</b> item(s) will be removed from the local vault.
          </p>
          <ul className='warn-list'>
            <li>Choose how you want to remove them:</li>
          </ul>
        </div>
      </div>

      <div className='card' style={{ marginBottom: 10 }}>
        <label className='row' style={{ gap: 8 }}>
          <input
            type='radio'
            name='mode'
            checked={mode === "archive"}
            onChange={() => setMode("archive")}
          />
          <div>
            <div>
              <b>Move to Recently Deleted (recommended)</b>
            </div>
            <div className='muted'>
              Undo available for 10 minutes. Auto-purges afterward.
            </div>
          </div>
        </label>
        <hr style={{ borderColor: "#232a62", margin: "10px 0" }} />
        <label className='row' style={{ gap: 8 }}>
          <input
            type='radio'
            name='mode'
            checked={mode === "delete"}
            onChange={() => setMode("delete")}
          />
          <div>
            <div>
              <b>Delete permanently</b>
            </div>
            <div className='muted'>
              No undo. Items are erased from this device immediately.
            </div>
          </div>
        </label>
      </div>

      <label className='ack-row'>
        <input
          type='checkbox'
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span>I understand this action affects only my local device.</span>
      </label>

      <div className='row' style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className='btn ghost' onClick={resetAndClose}>
          Cancel
        </button>
        <button
          className='btn'
          style={{ background: "var(--danger)" }}
          disabled={!ack}
          onClick={() => onConfirm?.(mode)}>
          {mode === "archive"
            ? "Move to Recently Deleted"
            : "Delete Permanently"}
        </button>
      </div>
    </Modal>
  );
}

function WarnIcon() {
  return (
    <svg width='28' height='28' viewBox='0 0 24 24' aria-hidden='true'>
      <circle cx='12' cy='12' r='10' fill='#2a1212' stroke='#5a1a1a' />
      <path d='M12 7v7' stroke='#ff4d6d' strokeWidth='2' />
      <circle cx='12' cy='17' r='1.2' fill='#ff4d6d' />
    </svg>
  );
}
