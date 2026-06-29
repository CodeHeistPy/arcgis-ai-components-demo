/**
 * Shared scenario types and agent helpers.
 *
 * Per CLAUDE.md §4: "One config object per scenario, default-exported from
 * config.ts, conforming to a shared `ScenarioConfig` type defined in
 * lib/agents.ts." That contract lives here.
 *
 * Keeping this file dependency-light (no React, no SDK imports) so it's easy
 * to import from anywhere — config files, tests, and Phase 2 custom-agent
 * factories.
 */

/**
 * Which OOB agents the scenario registers on the <arcgis-assistant>.
 *
 * Authoritative list: only these three have public reference pages on
 * developers.arcgis.com (see CLAUDE.md §9). The other `arcgis-assistant-*`
 * elements compiled into the package (layer-filter / layer-query /
 * layer-styling) are internal building blocks — don't mount them.
 */
export type OobAgent = "navigation" | "data-exploration" | "help";

export interface ScenarioConfig {
  /** Folder slug, e.g. "scenario-01-sample". Used for logging and routing. */
  id: string;

  /** Title shown in <ScenarioHeader>. */
  title: string;

  /** One-line subtitle / value statement under the title. */
  subtitle: string;

  /** ArcGIS Online web map item ID. Loaded by <arcgis-map item-id=...>. */
  webmapId: string;

  /**
   * Optional direct feature service URL. Phase 1 doesn't use this — only
   * the Phase 2 custom agent does, for direct FeatureLayer queries.
   */
  featureServiceUrl?: string;

  /** OOB agents to register on the assistant, in registration order. */
  oobAgents: OobAgent[];

  /**
   * First message the assistant displays. Frame the demo and set expectations
   * about what the OOB data-exploration agent can/can't do (CLAUDE.md §5).
   */
  entryMessage: string;

  /**
   * Prompt chips the user can click. Keep tight — see §5 for the constraints
   * on the OOB data-exploration agent (no viz, no symbology, no external data).
   */
  suggestedPrompts: string[];
}
