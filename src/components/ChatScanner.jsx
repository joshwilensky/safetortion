import { useMemo, useState } from "react";
import { computeRisk } from "../utils/risk.js";
import RiskBadge from "./RiskBadge.jsx";
import { useApp } from "../context/AppContext.jsx";
import RiskGauge from "./RiskGauge.jsx";
import RiskIndicator from "./RiskIndicator.jsx";

export default function ChatScanner() {
  const { addEvidence } = useApp();
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  const result = useMemo(() => computeRisk(text), [text]);

  const saveAsEvidence = () => {
    if (!text.trim()) return alert("Paste a message first.");
    const id = addEvidence({
      type: "note",
      title: `Scanned chat (${result.level} • ${result.score})`,
      content: text,
      metadata: { kind: "scan", risk: result },
    });
    setShow(true);
    alert("Saved to Evidence Vault.");
    return id;
  };

  return (
    <section className='card'>
      <h2>Scan a Chat / Message</h2>
      <p className='badge'>
        Paste a message to check for sextortion red flags. This is a heuristic,
        not a verdict.
      </p>

      <textarea
        className='input'
        rows={8}
        placeholder='Paste the message or chat here…'
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setShow(true);
        }}
      />

      {show && (
        <div className='scan-result'>
          <div
            className='row'
            style={{ justifyContent: "space-between", alignItems: "center" }}>
            <RiskBadge level={result.level} score={result.score} />
            <button className='btn' onClick={saveAsEvidence}>
              Save to Vault
            </button>
          </div>
          <div
            className='row'
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}>
            {" "}
            <RiskIndicator
              score={result.score}
              level={result.level}
              variant='full'
              size={120}
            />
            {" "}
            {/* <button className='btn' onClick={saveAsEvidence}>
              Save to Vault
            </button> */}
            {" "}
          </div>
          <SignalsList signals={result.signals} />
          <NextSteps level={result.level} />
        </div>
      )}
      {/* <div
        className='row'
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
        <div className='row' style={{ alignItems: "center", gap: 12 }}>
          <RiskBadge level={result.level} score={result.score} />
          <RiskGauge score={result.score} size={120} />
        </div>
        <button className='btn' onClick={saveAsEvidence}>
          Save to Vault
        </button>
      </div> */}
    </section>
  );
}

function SignalsList({ signals }) {
  if (!signals?.length) {
    return (
      <p style={{ opacity: 0.8, marginTop: 10 }}>
        No strong signals detected. If you feel unsafe, trust your instincts.
      </p>
    );
  }
  return (
    <div style={{ marginTop: 10 }}>
      <h4 style={{ margin: "0 0 6px" }}>Signals found</h4>
      <div className='chips'>
        {signals.map((s, i) => (
          <span className='chip' key={i} title={`+${s.weight} points`}>
            {s.label}
          </span>
        ))}
      </div>
      <div className='snippets'>
        {signals.map((s, i) => (
          <div className='snippet' key={i}>
            <span className='badge'>example</span> <em>…{s.snippet}…</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextSteps({ level }) {
  const danger = level === "red";
  const caution = level === "yellow";
  return (
    <div className='card' style={{ marginTop: 12 }}>
      <h4 style={{ margin: "0 0 6px" }}>Suggested next steps</h4>
      <ol style={{ paddingLeft: 18, lineHeight: 1.5 }}>
        {danger && (
          <li>
            <b>Do not pay</b> or send more content.
          </li>
        )}
        {(danger || caution) && (
          <li>Preserve evidence: screenshots, usernames, profile links.</li>
        )}
        {(danger || caution) && (
          <li>
            Report the account on the platform and block after saving proof.
          </li>
        )}
        <li>
          If you feel unsafe, talk to a trusted adult or local authorities.
        </li>
      </ol>
    </div>
  );
}
