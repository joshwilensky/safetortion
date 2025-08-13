import { useState } from "react";
import Modal from "./ui/Modal.jsx";
import EncryptionBar from "./EncryptionBar.jsx"; // if you re-add later

export default function EncryptionMenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className='btn ghost' onClick={() => setOpen(true)}>
        Encryption
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size='sm'
        labelledBy='enc-title'>
        <div className='modal-head'>
          <h3 id='enc-title' className='modal-title'>
            Encryption
          </h3>
          <button
            className='btn modal-close'
            onClick={() => setOpen(false)}
            aria-label='Close'>
            Close
          </button>
        </div>
        <p style={{ opacity: 0.8 }}>
          Set a passphrase to encrypt new files on this device.
        </p>
        <div style={{ marginTop: 8 }}>
          <EncryptionBar />
        </div>
      </Modal>
    </>
  );
}
