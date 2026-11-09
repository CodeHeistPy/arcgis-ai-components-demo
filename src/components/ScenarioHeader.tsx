import type { ScenarioConfig } from "../lib/agents";
import { getSignedInUsername, signOut } from "../lib/arcgis";

interface Props {
  scenario: ScenarioConfig;
}

/**
 * Top bar — brand mark, scenario title/subtitle, signed-in account, sign-out.
 *
 * Styling lives in index.css (`.app-header*`) so hover/focus states and the
 * responsive collapse work — inline styles can't express those. Kept crisp and
 * enterprise-neutral for customer demos.
 *
 * Phase 1 has no scenario switcher because there's only one scenario. When
 * Scenario 2 lands, drop a <select> next to the title that swaps the
 * activeScenario state in App.tsx.
 */
export function ScenarioHeader({ scenario }: Props) {
  const username = getSignedInUsername();
  // Display name = the part before "@"; initial = its first letter.
  const displayName = username ? username.split("@")[0] : "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <header className="app-header">
      <span className="app-header__mark" aria-hidden="true">
        {/* Simple map-pin glyph — brand-neutral, crisp at small size. */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C7.9 2 4.5 5.3 4.5 9.4c0 5.3 6.2 11.6 7 12.3.3.3.7.3 1 0 .8-.7 7-7 7-12.3C19.5 5.3 16.1 2 12 2Z"
            fill="#fff"
            fillOpacity="0.95"
          />
          <circle cx="12" cy="9.4" r="2.7" fill="#0a7bc0" />
        </svg>
      </span>

      <div className="app-header__titles">
        <div className="app-header__title">{scenario.title}</div>
        <div className="app-header__subtitle" title={scenario.subtitle}>
          {scenario.subtitle}
        </div>
      </div>

      <div className="app-header__right">
        {username && (
          <>
            <div
              className="app-header__user"
              title={username}
            >
              <span className="app-header__avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="app-header__username">{displayName}</span>
            </div>
            <span className="app-header__divider" aria-hidden="true" />
          </>
        )}
        <button
          type="button"
          className="app-header__signout"
          onClick={() => {
            void signOut();
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
