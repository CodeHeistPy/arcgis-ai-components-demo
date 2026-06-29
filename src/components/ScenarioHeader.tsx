import type { ScenarioConfig } from "../lib/agents";
import { signOut } from "../lib/arcgis";

interface Props {
  scenario: ScenarioConfig;
}

/**
 * Slim top bar — title, subtitle, and a sign-out affordance.
 *
 * Phase 1 has no scenario switcher because there's only one scenario.
 * When Scenario 2 lands, drop a <select> next to the title that swaps
 * the activeScenario state in App.tsx.
 */
export function ScenarioHeader({ scenario }: Props) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.25rem",
        background: "#0079c1",
        color: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.2 }}>
          {scenario.title}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            opacity: 0.9,
            marginTop: "0.15rem",
            maxWidth: "70ch",
          }}
        >
          {scenario.subtitle}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
        style={{
          background: "transparent",
          color: "white",
          border: "1px solid rgba(255,255,255,0.5)",
          padding: "0.35rem 0.85rem",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        Sign out
      </button>
    </header>
  );
}
