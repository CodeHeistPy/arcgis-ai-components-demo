import type { ScenarioConfig } from "../../lib/agents";
import { ENTRY_MESSAGE, SUGGESTED_PROMPTS } from "./prompts";

/**
 * Sample scenario config — wired into <ScenarioShell> via App.tsx.
 *
 * ⚠️ TEMPLATE: this is a starting point. To point the app at YOUR data:
 *   1. Set VITE_WEBMAP_ID in .env.local to your web map's item ID.
 *   2. Edit the title / subtitle below to describe your scenario.
 *   3. Tune ENTRY_MESSAGE and SUGGESTED_PROMPTS in ./prompts.ts.
 *
 * To add more scenarios, copy this folder (see CLAUDE.md §7) and give each its
 * own config object.
 */
const scenarioOne: ScenarioConfig = {
  id: "scenario-01-sample",
  title: "Sample Scenario",
  subtitle:
    "Describe your dataset here — what the records represent and the key metric.",
  // Set VITE_WEBMAP_ID in .env.local. The fallback is intentionally a
  // placeholder so a misconfigured env fails loudly rather than loading
  // someone else's map.
  webmapId: import.meta.env.VITE_WEBMAP_ID || "REPLACE_WITH_YOUR_WEBMAP_ITEM_ID",
  featureServiceUrl: import.meta.env.VITE_FEATURE_SERVICE_URL,
  oobAgents: ["navigation", "data-exploration", "help"],
  entryMessage: ENTRY_MESSAGE,
  suggestedPrompts: [...SUGGESTED_PROMPTS],
};

export default scenarioOne;
