import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import Modal from "./ui/Modal.jsx";

export default function PanicButton() {
  const [open, setOpen] = useState(false);
  const { addEvidence } = useApp();

  const handleQuickSave = () => {
    addEvidence({
      type: "note",
      title: "Panic marker",
      content: "Immediate help flow triggered.",
    });
    setOpen(false);
    alert(
      "Saved a panic marker in your Evidence Vault. Breathe. Next: block & preserve."
    );
  };

  return (
    <>
      <button
        className='btn'
        style={{ background: "var(--danger)" }}
        onClick={() => setOpen(true)}>
        I’m being threatened
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size='sm'
        labelledBy='panic-title'>
        <div className='modal-head'>
          <h3 id='panic-title' className='modal-title'>
            Immediate Steps
          </h3>
          <button
            className='btn modal-close'
            onClick={() => setOpen(false)}
            aria-label='Close'>
            Close
          </button>
        </div>

        <ol style={{ marginTop: 4, paddingLeft: 18, lineHeight: 1.5 }}>
          <li>
            <b>DON'T PAY</b> and <b>DON'T SEND</b> more.
          </li>
          <li>
            <b>PRESERVE</b> evidence (screenshots, usernames, receipts).
          </li>
          <li>
            <b>BLOCK</b> the account after preserving.
          </li>
        </ol>

        <div
          className='row'
          style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button className='btn' onClick={() => setOpen(false)}>
            Close
          </button>
          <button className='btn primary' onClick={handleQuickSave}>
            Quick-Save Marker
          </button>
        </div>
      </Modal>
    </>
  );
}
