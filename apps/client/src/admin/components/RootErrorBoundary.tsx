import React from "react";

type State = { error: Error | null };

// Use an explicit children prop type to avoid the empty `{}` lint rule
export class RootErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  State
> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // keep the console error for developer debugging
    // We avoid any react-router hooks here to keep the fallback safe outside Router
    // and ensure it does not call useLocation or other hooks.
     
    console.error("Unhandled error caught by RootErrorBoundary", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Application error</h1>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {String(
              this.state.error?.message ?? "An unexpected error occurred"
            )}
          </p>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ marginRight: 8 }}
            >
              Reload
            </button>
            <button onClick={() => window.history.back()}>Go back</button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default RootErrorBoundary;
