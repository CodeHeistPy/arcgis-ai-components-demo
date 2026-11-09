import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type EsriMap from "@arcgis/core/Map";
import type Geometry from "@arcgis/core/geometry/Geometry";
import type FeatureLayerView from "@arcgis/core/views/layers/FeatureLayerView";
import type { DashboardConfig } from "./agents";

/**
 * Pure helpers for the executive dashboard — layer discovery, stat computation
 * from a feature set, reading the assistant's active filter, and formatting.
 * No React here; the reactive wiring lives in useDashboardStats.ts.
 */

export interface Segment {
  key: string;
  count: number;
  value: number;
}

export interface PortfolioStats {
  count: number;
  totalValue: number;
  avgRisk: number | null;
  highRiskCount: number;
  /** Sum of value where tier == highTier AND percentComplete < earlyCompleteBelow. */
  earlyExposure: number;
  tier: Segment[];
  type: Segment[];
}

type Attrs = Record<string, unknown>;

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const str = (v: unknown): string => (v == null ? "" : String(v));

/**
 * Find the project feature layer in the map by schema — the one whose fields
 * include the configured tier and risk fields. Robust against title changes and
 * against the live-feed / flood layers (which lack these fields).
 */
export async function findProjectLayer(
  map: EsriMap,
  cfg: DashboardConfig,
): Promise<FeatureLayer | null> {
  const candidates = map.allLayers
    .filter((l) => l.type === "feature")
    .toArray() as FeatureLayer[];
  for (const layer of candidates) {
    try {
      await layer.load();
    } catch {
      continue;
    }
    const names = (layer.fields ?? []).map((f) => f.name);
    if (names.includes(cfg.tierField) && names.includes(cfg.riskField)) {
      return layer;
    }
  }
  return null;
}

/** Out-fields the stat queries need. */
export function statOutFields(cfg: DashboardConfig): string[] {
  return [
    cfg.typeField,
    cfg.tierField,
    cfg.riskField,
    cfg.valueField,
    cfg.percentCompleteField,
  ];
}

/** Compute all dashboard stats from a set of feature attributes. */
export function computeStats(rows: Attrs[], cfg: DashboardConfig): PortfolioStats {
  const tierMap = new Map<string, Segment>(
    cfg.tierOrder.map((k) => [k, { key: k, count: 0, value: 0 }]),
  );
  const typeMap = new Map<string, Segment>(
    cfg.typeOrder.map((k) => [k, { key: k, count: 0, value: 0 }]),
  );

  let totalValue = 0;
  let riskSum = 0;
  let riskN = 0;
  let highRiskCount = 0;
  let earlyExposure = 0;

  for (const r of rows) {
    const tier = str(r[cfg.tierField]);
    const type = str(r[cfg.typeField]);
    const value = num(r[cfg.valueField]);
    const risk = r[cfg.riskField];
    const pct = num(r[cfg.percentCompleteField]);

    totalValue += value;
    if (typeof risk === "number" && Number.isFinite(risk)) {
      riskSum += risk;
      riskN += 1;
    }

    const tSeg = tierMap.get(tier);
    if (tSeg) {
      tSeg.count += 1;
      tSeg.value += value;
    }
    const pSeg = typeMap.get(type);
    if (pSeg) {
      pSeg.count += 1;
      pSeg.value += value;
    }

    if (tier === cfg.highTier) {
      highRiskCount += 1;
      if (pct < cfg.earlyCompleteBelow) earlyExposure += value;
    }
  }

  return {
    count: rows.length,
    totalValue,
    avgRisk: riskN ? riskSum / riskN : null,
    highRiskCount,
    earlyExposure,
    tier: [...tierMap.values()],
    type: [...typeMap.values()],
  };
}

export interface EffectiveFilter {
  where: string;
  geometry?: Geometry;
  spatialRelationship?: string;
  distance?: number;
  units?: string;
  active: boolean;
}

/**
 * Read the assistant's active filter off a project layerView. The OOB data-
 * exploration agent sets `layerView.filter` (a FeatureFilter with where +
 * optional geometry) and sometimes dims via `featureEffect.filter`
 * (verified against @arcgis/ai-components 5.0.19). Prefer `filter`, fall back
 * to the featureEffect's filter.
 */
export function effectiveFilter(layerView: FeatureLayerView): EffectiveFilter {
  const f = layerView.filter ?? layerView.featureEffect?.filter ?? null;
  const where = (f?.where ?? "").trim();
  const geometry = f?.geometry ?? undefined;
  const active = Boolean((where && where !== "1=1") || geometry);
  return {
    where: where || "1=1",
    geometry,
    spatialRelationship: f?.spatialRelationship,
    distance: f?.distance ?? undefined,
    units: f?.units ?? undefined,
    active,
  };
}

// ---- formatters -----------------------------------------------------------

/** Compact USD, e.g. 1_720_000_000 -> "$1.72B", 450_000_000 -> "$450M". */
export function formatUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export const formatInt = (n: number): string => n.toLocaleString("en-US");
export const formatRisk = (n: number | null): string =>
  n == null ? "—" : n.toFixed(1);
