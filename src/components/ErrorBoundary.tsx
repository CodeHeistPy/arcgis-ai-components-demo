import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Catch-all error boundary so a crash in the map or assistant surfaces as
 * readable text instead of a blank screen — critical for live demo prep,
 * matches the §11 guidance: "Surface errors verbosely in dev, gracefully
 * in demo."
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          padding: "1.5rem",
          margin: "1rem",
          background: "#fff",
          border: "1px solid #b3261e",
          borderRadius: 6,
          color: "#2b2b2b",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.85rem",
          maxHeight: "calc(100% - 2rem)",
          overflow: "auto",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: "#b3261e",
            marginBottom: "0.5rem",
            fontFamily: "system-ui, sans-serif",
            fontSize: "1rem",
          }}
        >
          The app crashed during render.
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>{this.state.error.name}:</strong> {this.state.error.message}
        </div>
        {this.state.error.stack && (
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {this.state.error.stack}
          </pre>
        )}
      </div>
    );
  }
}
