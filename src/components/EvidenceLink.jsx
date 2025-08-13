import { useState } from "react";
import { createEvidenceLink, fetchEvidenceLink } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

export default function EvidenceLink() {
  const { addEvidence } = useApp();
  const [label, setLabel] = useState("Safety resources");
  const [target, setTarget] = useState("https://hotline.org/");
  const [linkId, setLinkId] = useState("");
  const [serverPath, setServerPath] = useState("");
  const [events, setEvents] = useState(null);
  const base = import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:8080";

  const create = async () => {
    const { id, url } = await createEvidenceLink({ label, target });
    setLinkId(id);
    setServerPath(url);
    addEvidence({
      type: "note",
      title: "Evidence link created",
      content: `ID: ${id}\nPath: ${url}\nTarget: ${target}`,
      metadata: { kind: "evidence-link", id, target },
    });
  };

  const refresh = async () => {
    if (!linkId) return;
    const data = await fetchEvidenceLink(linkId);
    setEvents(data.events || []);
  };

  const copy = async () => {
    if (!linkId) return;
    await navigator.clipboard.writeText(`${base}${serverPath}`);
    alert("Copied link to clipboard.");
  };

  return (
    <div className='card'>
      <h2>Evidence Link (lawful visitor log)</h2>
      <p className='badge'>
        Use only if advised by a trusted adult or law enforcement.
      </p>
      <div className='grid two'>
        <label>
          <div>Label</div>
          <input
            className='input'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label>
          <div>Redirect to (safe URL)</div>
          <input
            className='input'
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
      </div>
      <div className='row' style={{ justifyContent: "flex-end", marginTop: 8 }}>
        <button className='btn primary' onClick={create}>
          Create link
        </button>
      </div>

      {linkId && (
        <>
          <div style={{ marginTop: 10 }}>
            <div>
              <b>Share this URL:</b>
            </div>
            <code style={{ userSelect: "all" }}>{`${base}${serverPath}`}</code>
            <div className='row' style={{ gap: 8, marginTop: 6 }}>
              <button className='btn' onClick={copy}>
                Copy
              </button>
              <button className='btn' onClick={refresh}>
                Refresh events
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <h4>Visitor events</h4>
            {!events ? (
              <p>No events loaded.</p>
            ) : events.length === 0 ? (
              <p>No clicks recorded yet.</p>
            ) : (
              <table className='table'>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>IP</th>
                    <th>User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => (
                    <tr key={i}>
                      <td>{new Date(ev.at).toLocaleString()}</td>
                      <td>{ev.ip}</td>
                      <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>
                        {ev.ua}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
