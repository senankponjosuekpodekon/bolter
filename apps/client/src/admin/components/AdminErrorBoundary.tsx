import React from "react";

type Props = { children?: React.ReactNode };

type State = { error: Error | null; info?: React.ErrorInfo };

export default class AdminErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for developer and include component stack
    // We avoid any router hooks here to keep the fallback safe
    // eslint-disable-next-line no-console
    console.error("AdminErrorBoundary captured an error", error, info);
    // Save a compact report in localStorage for easier debugging in the browser
    try {
      const report = {
        time: new Date().toISOString(),
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        componentStack: info?.componentStack ?? null,
      };
      localStorage.setItem("admin_last_error", JSON.stringify(report));
    } catch {
      // no-op
    }
    this.setState({ info });
  }

  clearError = () => this.setState({ error: null, info: undefined });

  renderFallback() {
    const { error, info } = this.state;
    return (
      <div
        style={{
          padding: 20,
          maxWidth: 900,
          margin: "40px auto",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Application error</h1>
        <p>{error?.message ?? "An unexpected error occurred."}</p>
        {info?.componentStack ? (
          <details style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
            <summary>Component stack (click to inspect)</summary>
            <pre style={{ marginTop: 8 }}>{info.componentStack}</pre>
          </details>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{ marginRight: 8 }}
          >
            Reload
          </button>
          <button onClick={this.clearError}>Dismiss</button>
          <button
            onClick={() => {
              try {
                const saved = localStorage.getItem("admin_last_error");
                navigator.clipboard?.writeText(saved ?? "");
                // eslint-disable-next-line no-alert
                alert(
                  "Error report copied to clipboard — you can paste it into an issue."
                );
              } catch {
                // ignore
              }
            }}
            style={{ marginLeft: 8 }}
          >
            Copy report
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.error) return this.renderFallback();
    return this.props.children as React.ReactElement;
  }
}
