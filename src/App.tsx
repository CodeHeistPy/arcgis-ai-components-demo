import { useState } from "react";
import { AuthGate } from "./components/AuthGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScenarioHeader } from "./components/ScenarioHeader";
import { ScenarioShell } from "./components/ScenarioShell";
import scenarioOne from "./scenarios/scenario-01-sample/config";

/**
 * App is intentionally thin. Per CLAUDE.md §4, all scenario-specific copy
 * lives in the scenario's config.ts — App only chooses which config is active
 * and threads it through the shell.
 *
 * Only one scenario exists in the template, so there's no scenario switcher
 * yet. When you add a second scenario, ScenarioHeader gets a dropdown and
 * `activeScenario` becomes state driven by it.
 */
export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeScenario, _setActiveScenario] = useState(scenarioOne);

  return (
    <ErrorBoundary>
      <AuthGate>
        <div className="app-shell">
          <ScenarioHeader scenario={activeScenario} />
          <ErrorBoundary>
            <ScenarioShell scenario={activeScenario} />
          </ErrorBoundary>
        </div>
      </AuthGate>
    </ErrorBoundary>
  );
}
