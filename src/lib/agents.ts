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

/**
 * A live operational layer added to the map for real-time context (severe
 * weather, earthquakes, wildfires, etc.). These are added client-side in
 * ScenarioShell and surfaced in the Layer List widget.
 *
 * ⚠️ IMPORTANT (CLAUDE.md §9): a layer added in code this way is **visual
 * context only** — it is NOT in the web map's AI vector embeddings, so the
 * assistant can't reason over it. Users can see it and toggle it, but can't
 * ask questions about it. To make a live feed assistant-queryable, add it to
 * the web map in ArcGIS Online, populate its metadata, and re-generate
 * embeddings (watch the wide-schema 504 gotcha).
 */
export interface LiveFeed {
  /** Layer title shown in the Layer List widget. */
  title: string;

  /** Full REST URL to a single FeatureServer layer (…/FeatureServer/<id>). */
  url: string;

  /**
   * Whether the layer starts visible. Default to `false` so the demo opens
   * clean and the presenter toggles feeds on deliberately.
   */
  visible?: boolean;

  /** One-line note on which risk driver this feed complements (for docs). */
  note?: string;
}

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

  /**
   * Optional live operational layers (real-time weather/hazard feeds) added to
   * the map for visual context and toggled via the Layer List widget. Visual
   * only — not in the assistant's embeddings (see {@link LiveFeed}).
   */
  liveFeeds?: LiveFeed[];

  /**
   * Optional executive-dashboard config. When present, ScenarioShell renders a
   * reactive KPI band + insights rail driven by the project feature layer. The
   * field names must match the layer's schema exactly (CLAUDE.md §2) — the
   * dashboard queries the layer directly, honoring the assistant's active
   * filter so the numbers track the current query.
   */
  dashboard?: DashboardConfig;
}

/**
 * Field mappings + display config for the executive dashboard. Kept scenario-
 * specific (field names vary per layer) so the dashboard components stay
 * generic. See {@link ScenarioConfig.dashboard}.
 */
export interface DashboardConfig {
  /** Categorical "project type" field (e.g. "project_type"). */
  typeField: string;
  /** Stored risk-tier string field (e.g. "risk_tier"). */
  tierField: string;
  /** Numeric composite risk score field (e.g. "composite_risk"). */
  riskField: string;
  /** Numeric contract/dollar value field (e.g. "contract_value"). */
  valueField: string;
  /** Numeric 0–100 progress field (e.g. "percent_complete"). */
  percentCompleteField: string;

  /** Tier values in display order, low→high (e.g. ["Low","Medium","High"]). */
  tierOrder: string[];
  /** Hex color per tier value. */
  tierColors: Record<string, string>;
  /** The tier value that counts as "high risk" for KPIs (e.g. "High"). */
  highTier: string;

  /** Project-type values in display order. */
  typeOrder: string[];
  /** Hex color per type value (cycled if short). */
  typeColors?: Record<string, string>;

  /**
   * "Early-construction exposure" KPI = sum of value where tier == highTier AND
   * percentComplete < this threshold. Set to the schedule break you want to
   * headline (e.g. 50).
   */
  earlyCompleteBelow: number;
}
