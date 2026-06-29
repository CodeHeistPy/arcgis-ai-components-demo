import { useEffect, useState, type ReactNode } from "react";
import { checkSignInStatus, signIn } from "../lib/arcgis";

interface Props {
  children: ReactNode;
}

type State =
  | { kind: "checking" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; username: string }
  | { kind: "error"; message: string };

/**
 * Sign-in wall.
 *
 * Per CLAUDE.md §3, the demo audience must be a named user of an ArcGIS Online
 * org with AI assistants enabled. We block the app until that's true — better
 * than showing a map that silently fails at the LLM call step (§9).
 *
 * Per CLAUDE.md §4, no <form> tags — sign-in is a button onClick.
 */
export function AuthGate({ children }: Props) {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line no-console
      console.log("[AuthGate] checking sign-in status…");
      const result = await checkSignInStatus();
      // eslint-disable-next-line no-console
      console.log("[AuthGate] sign-in status:", result);
      if (cancelled) return;
      setState(
        result
          ? { kind: "signed-in", username: result.username }
          : { kind: "signed-out" },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "signed-in") return <>{children}</>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.4rem", color: "#0079c1" }}>
        ArcGIS AI Components Demo
      </h1>
      <p
        style={{
          maxWidth: "44ch",
          color: "#555",
          marginTop: "0.5rem",
          lineHeight: 1.5,
        }}
      >
        Sign in with a named ArcGIS Online user that has AI assistants enabled
        and access to the configured web map.
      </p>

      {state.kind === "checking" && (
        <p style={{ color: "#999" }}>Checking sign-in status…</p>
      )}

      {state.kind === "signed-out" && (
        <button
          type="button"
          onClick={() => {
            void signIn().catch((err: unknown) => {
              setState({
                kind: "error",
                message:
                  err instanceof Error ? err.message : "Sign-in failed.",
              });
            });
          }}
          style={{
            marginTop: "1rem",
            padding: "0.65rem 1.4rem",
            background: "#0079c1",
            color: "white",
            border: 0,
            borderRadius: 4,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Sign in with ArcGIS
        </button>
      )}

      {state.kind === "error" && (
        <p style={{ color: "#b3261e", marginTop: "1rem" }}>
          {state.message} — check that VITE_ARCGIS_OAUTH_APP_ID is set and
          that <code>http://localhost:5173</code> is a registered redirect URI.
        </p>
      )}
    </div>
  );
}
