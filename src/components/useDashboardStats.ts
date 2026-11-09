import { useEffect, useState } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Query from "@arcgis/core/rest/support/Query";
import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayerView from "@arcgis/core/views/layers/FeatureLayerView";
import type FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import type { DashboardConfig } from "../lib/agents";
import {
  computeStats,
  effectiveFilter,
  findProjectLayer,
  statOutFields,
  type PortfolioStats,
} from "../lib/dashboard";

export type DashboardStatus = "loading" | "ready" | "error";

export interface DashboardState {
  overall: PortfolioStats | null;
  current: PortfolioStats | null;
  /** True when the assistant has an active filter narrowing the set. */
  filtered: boolean;
  status: DashboardStatus;
}

const INITIAL: DashboardState = {
  overall: null,
  current: null,
  filtered: false,
  status: "loading",
};

/**
 * Computes portfolio stats from the project feature layer and keeps `current`
 * in sync with the assistant's active filter. `overall` is the unfiltered
 * baseline (queried once); `current` re-queries whenever the OOB agent changes
 * the project layerView's filter / featureEffect (see lib/dashboard.ts and
 * CLAUDE.md §9 for how the agent filters).
 */
export function useDashboardStats(
  mapEl: HTMLArcgisMapElement | null,
  cfg: DashboardConfig | undefined,
): DashboardState {
  const [state, setState] = useState<DashboardState>(INITIAL);

  useEffect(() => {
    if (!mapEl || !cfg) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;
    let handle: { remove: () => void } | undefined;
    setState(INITIAL);

    void (async () => {
      await mapEl.viewOnReady();
      const view = mapEl.view as unknown as MapView | undefined;
      const map = mapEl.map;
      if (cancelled || !view || !map) return;

      const layer = await findProjectLayer(map, cfg);
      if (cancelled) return;
      if (!layer) {
        setState({ ...INITIAL, status: "error" });
        return;
      }

      const layerView = (await view.whenLayerView(
        layer,
      )) as unknown as FeatureLayerView;
      if (cancelled) return;

      const outFields = statOutFields(cfg);
      const rowsOf = (fs: FeatureSet) =>
        fs.features.map((f) => f.attributes as Record<string, unknown>);

      // Baseline (unfiltered), queried once.
      const overallFs = await layer.queryFeatures({
        where: "1=1",
        outFields,
        returnGeometry: false,
        num: 5000,
      });
      if (cancelled) return;
      const overall = computeStats(rowsOf(overallFs), cfg);
      setState({ overall, current: overall, filtered: false, status: "ready" });

      // Recompute `current` honoring the assistant's active filter.
      const recompute = async () => {
        const eff = effectiveFilter(layerView);
        const query = new Query({
          where: eff.where,
          outFields,
          returnGeometry: false,
          num: 5000,
        });
        if (eff.geometry) {
          query.geometry = eff.geometry;
          query.spatialRelationship =
            eff.spatialRelationship as Query["spatialRelationship"];
          if (eff.distance != null) query.distance = eff.distance;
          if (eff.units != null) query.units = eff.units as Query["units"];
        }
        try {
          const fs = await layer.queryFeatures(query);
          if (cancelled) return;
          setState((s) => ({
            ...s,
            current: computeStats(rowsOf(fs), cfg),
            filtered: eff.active,
          }));
        } catch {
          /* transient query failure (e.g. mid-filter) — keep last good stats */
        }
      };

      handle = reactiveUtils.watch(
        () => [
          layerView.filter,
          layerView.filter?.where,
          layerView.featureEffect,
          layerView.featureEffect?.filter?.where,
        ],
        () => {
          void recompute();
        },
      );
    })();

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [mapEl, cfg]);

  return state;
}
