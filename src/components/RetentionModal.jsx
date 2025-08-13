import { useState } from "react";
import Modal from "./ui/Modal.jsx";

const OPTIONS = [
  { v: 0, label: "Off" },
  { v: 7, label: "7 days" },
  { v: 30, label: "30 days" },
  { v: 90, label: "90 days" },
];

export default function RetentionModal({
  open,
  valueDays,
  hardDelete = false,
  onCancel,
  onSave,
}) {
  const [days, setDays] = useState(valueDays ?? 0);
  const [hard, setHard] = useState(Boolean(hardDelete));

  const save = () => onSave?.({ days, hard });

  return (
    <Modal open={open} onClose={onCancel} size='sm' labelledBy='ret-title'>
      <div className='modal-head'>
        <h3 id='ret-title' className='modal-title'>
          Data retention
        </h3>
        <button className='btn modal-close' onClick={onCancel}>
          Close
        </button>
      </div>

      <div className='card' style={{ marginBottom: 10 }}>
        {OPTIONS.map((o) => (
          <label key={o.v} className='row' style={{ gap: 8, padding: "6px 0" }}>
            <input
              type='radio'
              name='ret'
              checked={days === o.v}
              onChange={() => setDays(o.v)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      <label className='row' style={{ gap: 8 }}>
        <input
          type='checkbox'
          checked={hard}
          onChange={(e) => setHard(e.target.checked)}
        />
        <span>Delete permanently (skip Recently Deleted)</span>
      </label>

      <div
        className='row'
        style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <button className='btn ghost' onClick={onCancel}>
          Cancel
        </button>
        <button className='btn' onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  );
}
