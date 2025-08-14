import { wipeEverything } from "../utils/idb.js";

export default function DangerZone() {
  const nuke = async () => {
    if (
      !confirm(
        "This will delete ALL evidence metadata, ALL blobs, and encryption salt from THIS device. Type YES to confirm."
      )
    )
      return;
    const answer = prompt("Type YES to confirm:");
    if (answer !== "YES") return;
    await wipeEverything();
    alert("All local data removed. Reload the app.");
    location.reload();
  };
  return (
    <div
      className='card'
      style={{ borderColor: "#5a1a1a", background: "#2a1212" }}>
      <h3>Danger Zone</h3>
      <p>
        Deletes everything stored by BocaSafe on this device. This cannot be
        undone.
      </p>
      <button
        className='btn'
        style={{ background: "var(--danger)" }}
        onClick={nuke}>
        Wipe EVERYTHING
      </button>
    </div>
  );
}
