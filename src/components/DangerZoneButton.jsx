import { useState } from "react";
import { idbClearAll, wipeEverything } from "../utils/idb.js";
import { useApp } from "../context/AppContext.jsx";
import Modal from "./ui/Modal.jsx";

export default function DangerZoneButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { clearEvidence } = useApp();

  const wipeBlobs = async () => {
    if (
      !confirm(
        "Delete ALL stored blobs (files/images) from this device? Metadata remains."
      )
    )
      return;
    await idbClearAll();
    alert("All blobs wiped from this device.");
  };
  const wipeMetadata = async () => {
    if (!confirm("Clear ALL evidence metadata (keeps blobs in IndexedDB)?"))
      return;
    clearEvidence();
    alert("All metadata cleared.");
  };
  const wipeAll = async () => {
    if (confirmText !== "YES") {
      alert("Type YES to confirm.");
      return;
    }
    await wipeEverything();
    alert("All local data removed. Reloading…");
    location.reload();
  };

  return (
    <>
      <button
        className='btn'
        style={{ background: "var(--danger)" }}
        onClick={() => setOpen(true)}>
        Danger Zone
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size='md'
        labelledBy='dz-title'>
        <div className='modal-head'>
          <h3 id='dz-title' className='modal-title'>
            Danger Zone
          </h3>
          <button
            className='btn modal-close'
            onClick={() => setOpen(false)}
            aria-label='Close'>
            Close
          </button>
        </div>

        <p style={{ opacity: 0.85, marginTop: 4 }}>
          These actions are irreversible on <b>this device</b>.
        </p>

        <div className='card' style={{ marginTop: 12 }}>
          <h4 style={{ margin: "0 0 6px" }}>Wipe Blobs</h4>
          <p className='badge'>
            Deletes all stored files/images (IndexedDB). Metadata stays.
          </p>
          <button className='btn' onClick={wipeBlobs}>
            Wipe Blobs
          </button>
        </div>

        <div className='card' style={{ marginTop: 12 }}>
          <h4 style={{ margin: "0 0 6px" }}>Clear Metadata</h4>
          <p className='badge'>
            Deletes all evidence <i>metadata</i>. Blobs remain.
          </p>
          <button className='btn' onClick={wipeMetadata}>
            Clear Metadata
          </button>
        </div>

        <div
          className='card'
          style={{
            marginTop: 12,
            borderColor: "#5a1a1a",
            background: "#2a1212",
          }}>
          <h4 style={{ margin: "0 0 6px" }}>Wipe EVERYTHING</h4>
          <p className='badge'>
            Deletes <b>all blobs, all metadata, and encryption salt</b> from
            this device.
          </p>
          <label style={{ display: "block", marginTop: 8 }}>
            Type <b>YES</b> to confirm:
            <input
              className='input'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='YES'
              style={{ marginTop: 6, maxWidth: 240 }}
            />
          </label>
          <div
            className='row'
            style={{ justifyContent: "flex-end", marginTop: 10 }}>
            <button className='btn' onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className='btn'
              style={{ background: "var(--danger)" }}
              onClick={wipeAll}>
              Wipe EVERYTHING
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
