// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  componentDidUpdate(prev) {
    // reset when any reset key changes
    const a = (this.props.resetKeys || []).join("|");
    const b = (prev.resetKeys || []).join("|");
    if (a !== b && this.state.error) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const Fallback = this.props.fallback;
    if (Fallback)
      return (
        <Fallback
          error={error}
          onReset={() => this.setState({ error: null })}
        />
      );

    // default fallback
    return (
      <div className='card'>
        <h3>Something went wrong</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {String(error?.message || error)}
        </pre>
        <div className='row' style={{ justifyContent: "flex-end" }}>
          <button
            className='btn'
            onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button
            className='btn danger'
            onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
