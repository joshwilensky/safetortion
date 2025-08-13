// src/pages/VaultPage.jsx
import { useLocation } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import EvidenceVault from "../components/EvidenceVault.jsx";

function VaultFallback({ error, onReset }) {
  const resetLocal = () => {
    // minimal, targeted cleanup (keeps most user data safe)
    try {
      // Remove only potentially corrupt entries we use
        localStorage.removeItem("vault_ct");
        localStorage.removeItem("safelink_archives");

      // If your archive utils store under a known key, clear it too:
      // localStorage.removeItem("safelink_archives");
    } catch {}
    onReset();
  };
  return (
    <div className='card'>
      <h3>Vault couldn’t render</h3>
      <p className='muted small'>
        A runtime error occurred inside the vault UI.
      </p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {String(error?.message || error)}
      </pre>
      <div className='row' style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className='btn' onClick={onReset}>
          Try again
        </button>
        <button className='btn ghost' onClick={resetLocal}>
          Reset vault cache
        </button>
        <button className='btn danger' onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const location = useLocation(); // changes on navigation; resets boundary
  return (
    <ErrorBoundary resetKeys={[location.key]} fallback={VaultFallback}>
      <EvidenceVault />
    </ErrorBoundary>
  );
}
