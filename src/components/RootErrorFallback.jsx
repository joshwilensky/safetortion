// src/components/RootErrorFallback.jsx
export default function RootErrorFallback({ error, onReset }) {
  return (
    <div className='container' style={{ paddingTop: 16 }}>
      <div className='card'>
        <h3>Something went wrong</h3>
        <p className='muted small'>
          An unexpected error occurred. You can try again or reload.
        </p>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {String(error?.message || error)}
        </pre>
        <div className='row' style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className='btn' onClick={onReset}>
            Try again
          </button>
          <button
            className='btn danger'
            onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
