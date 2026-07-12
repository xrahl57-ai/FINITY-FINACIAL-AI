import React, { Component, ErrorInfo, ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught rendering error in Finity:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "30px", background: "#fef2f2", color: "#991b1b", fontFamily: "monospace", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ maxWidth: "600px", background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #fee2e2", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Finity Render Engine Error</h2>
            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "16px" }}>The UI failed to render due to a client-side JavaScript crash. See the crash trace below:</p>
            <pre style={{ background: "#f3f4f6", padding: "12px", borderRadius: "6px", fontSize: "12px", overflowX: "auto", color: "#1f2937", border: "1px solid #e5e7eb" }}>
              {this.state.error && this.state.error.toString()}
              {"\n\n"}
              {this.state.error && this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

