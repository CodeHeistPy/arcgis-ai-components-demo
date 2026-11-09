import { useEffect, useRef, useState } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Query from "@arcgis/core/rest/support/Query";
import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
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
  /** True when "sync to map view" is on and `current` reflects the extent. */
  viewSynced: boolean;
  status: DashboardStatus;
}

const INITIAL: DashboardState = {
  overall: null,
  current: null,
  filtered: false,
  viewSynced: false,
  status: "loading",
};

/**
 * Computes portfolio stats from the project feature layer and keeps `current`
 * in sync with two lenses:
 *  - the assistant's active filter (layerView.filter / featureEffect), and
 *  - optionally the map's current extent, when `syncView` is on ("sync to map
 *    view"): `current` then reflects only the projects visible on screen, so an
 *    exec can pan/zoom to a region and read its numbers without typing.
 *
 * `overall` is the unfiltered portfolio baseline (queried once) and stays the
 * anchor every widget scales against. The two lenses compound: an active query
 * AND a synced extent together narrow `current` to "matching projects in view".
 *
 * Robustness note: React StrictMode (and HMR) remount the <arcgis-map>,
 * destroying the first view + layers, so a long-held layer reference can go
 * stale and queries throw `load:instance-destroyed`. We resolve the live,
 * connected element and prefer the resolved (loaded) layer instance, re-finding
 * it by schema only if it was destroyed. See lib/dashboard.ts and CLAUDE.md §9.
 */
export function useDashboardStats(
  mapEl: HTMLArcgisMapElement | null,
  cfg: DashboardConfig | undefined,
  syncView = false,
): DashboardState {
  const [state, setState] = useState<DashboardState>(INITIAL);
  const syncViewRef = useRef(syncView);
  const recomputeRef = useRef<(() => Promise<boolean>) | null>(null);

  // Toggling the map-view lens re-reads the current extent immediately. The map
  // can still be (re)loading when the toggle fires (StrictMode/HMR remounts the
  // <arcgis-map> and aborts the first web-map load), so retry briefly until the
  // recompute actually resolves the layer + view and updates.
  useEffect(() => {
    syncViewRef.current = syncView;
    let cancelled = false;
    let tries = 0;
    const attempt = async () => {
      if (cancelled) return;
      const ok = await recomputeRef.current?.();
      if (!ok && !cancelled && tries++ < 20) {
        setTimeout(attempt, 150);
      }
    };
    void attempt();
    return () => {
      cancelled = true;
    };
  }, [syncView]);

  useEffect(() => {
    if (!mapEl || !cfg) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;
    const handles: Array<{ remove: () => void }> = [];
    setState(INITIAL);

    // The CURRENT, usable <arcgis-map>. React StrictMode (and HMR) leave several
    // recompute closures alive, each having captured a different element — some
    // detached / half-torn-down. Rather than trust the captured `mapEl`, pick
    // the connected element with a ready view (with an extent) from the document
    // (this app renders a single map), so every closure resolves to the good one.
    const liveEl = (): HTMLArcgisMapElement | null => {
      const els = Array.from(
        document.querySelectorAll("arcgis-map"),
      ) as HTMLArcgisMapElement[];
      const connected = els.filter((e) => e.isConnected);
      return (
        connected.find(
          (e) => (e.view as unknown as MapView | undefined)?.extent,
        ) ??
        connected.find((e) => e.view) ??
        (mapEl && mapEl.isConnected ? mapEl : null)
      );
    };
    const liveView = (): MapView | undefined =>
      liveEl()?.view as unknown as MapView | undefined;

    const outFields = statOutFields(cfg);
    const rowsOf = (fs: FeatureSet) =>
      fs.features.map((f) => f.attributes as Record<string, unknown>);

    void (async () => {
      const el0 = liveEl() ?? mapEl;
      await el0.viewOnReady();
      const setupView = liveView();
      const setupMap = liveEl()?.map;
      if (cancelled || !setupView || !setupMap) return;

      const layer0 = await findProjectLayer(setupMap, cfg);
      if (cancelled) return;
      if (!layer0) {
        setState({ ...INITIAL, status: "error" });
        return;
      }
      const layerView0 = (await setupView.whenLayerView(
        layer0,
      )) as unknown as FeatureLayerView;
      if (cancelled) return;

      // The loaded project layer on the live map, found by schema each call (the
      // captured `layer0` can be a destroyed instance from a torn-down mount).
      // Fall back to the resolved instance only if it is still valid.
      const liveLayer = (): FeatureLayer | null => {
        const map = liveEl()?.map;
        const found = map?.allLayers.find(
          (l) =>
            l.type === "feature" &&
            ((l as FeatureLayer).fields ?? []).some((f) => f.name === cfg.tierField) &&
            ((l as FeatureLayer).fields ?? []).some((f) => f.name === cfg.riskField),
        ) as FeatureLayer | undefined;
        if (found && !found.destroyed) return found;
        return layer0 && !layer0.destroyed ? layer0 : null;
      };
      const liveLayerView = (layer: FeatureLayer): FeatureLayerView | null => {
        if (layerView0 && !layerView0.destroyed && layerView0.layer === layer) {
          return layerView0;
        }
        const lv = liveView()?.layerViews?.find((x) => x.layer === layer) as
          | unknown
          | undefined;
        return (lv as FeatureLayerView | undefined) ?? null;
      };

      // Baseline (unfiltered portfolio), queried once — the anchor for every
      // "of overall" comparison and every bar's scale.
      const baseLayer = liveLayer();
      if (!baseLayer) return;
      const overallFs = await baseLayer.queryFeatures({
        where: "1=1",
        outFields,
        returnGeometry: false,
        num: 5000,
      });
      if (cancelled) return;
      const overall = computeStats(rowsOf(overallFs), cfg);
      setState({
        overall,
        current: overall,
        filtered: false,
        viewSynced: false,
        status: "ready",
      });

      // Recompute `current` honoring the assistant's filter and, when the
      // map-view lens is on, the current extent.
      // Returns true once it has resolved the layer + view and updated state;
      // false while the map is not ready yet (so callers can retry).
      const recompute = async (): Promise<boolean> => {
        const layer = liveLayer();
        const view = liveView();
        if (!layer || !view) return false;
        const lv = liveLayerView(layer);
        const eff = lv
          ? effectiveFilter(lv)
          : ({ where: "1=1", active: false } as ReturnType<typeof effectiveFilter>);
        const syncing = syncViewRef.current && !!view.extent;
        const query = new Query({
          where: eff.where,
          outFields,
          returnGeometry: false,
          num: 5000,
        });
        if (syncing) {
          // Map-view lens takes the geometry slot: "matching projects in view".
          // (A query carries one geometry; the where-clause still compounds, so
          // an active attribute query AND the extent narrow together.)
          query.geometry = view.extent;
          query.spatialRelationship = "intersects";
        } else if (eff.geometry) {
          query.geometry = eff.geometry;
          query.spatialRelationship =
            eff.spatialRelationship as Query["spatialRelationship"];
          if (eff.distance != null) query.distance = eff.distance;
          if (eff.units != null) query.units = eff.units as Query["units"];
        }
        try {
          const fs = await layer.queryFeatures(query);
          if (cancelled) return false;
          setState((s) => ({
            ...s,
            current: computeStats(rowsOf(fs), cfg),
            filtered: eff.active,
            viewSynced: syncing,
          }));
          return true;
        } catch {
          /* transient query failure (e.g. mid-filter) — keep last good stats */
          return false;
        }
      };

      recomputeRef.current = recompute;

      // Lens 1: the assistant's filter / featureEffect.
      handles.push(
        reactiveUtils.watch(
          () => [
            layerView0.filter,
            layerView0.filter?.where,
            layerView0.featureEffect,
            layerView0.featureEffect?.filter?.where,
          ],
          () => void recompute(),
        ),
      );

      // Lens 2: the map extent. Recompute only when the view settles
      // (`stationary`) and only while the lens is on — so numbers never jiggle
      // mid-pan, and the assistant moving the map on its own does nothing unless
      // the exec has opted into view-sync.
      handles.push(
        reactiveUtils.watch(
          () => setupView.stationary,
          (stationary) => {
            if (stationary && syncViewRef.current) void recompute();
          },
        ),
      );
    })();

    return () => {
      cancelled = true;
      recomputeRef.current = null;
      handles.forEach((h) => h.remove());
    };
  }, [mapEl, cfg]);

  return state;
}
