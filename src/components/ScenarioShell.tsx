import { useEffect, useRef, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Layer from "@arcgis/core/layers/Layer";
import { createBaronLayers } from "../lib/baron";
import {
  ArcgisMap,
  ArcgisZoom,
  ArcgisHome,
  ArcgisFullscreen,
  ArcgisSearch,
  ArcgisExpand,
  ArcgisLayerList,
  ArcgisLegend,
  ArcgisScaleBar,
  ArcgisBasemapToggle,
} from "@arcgis/map-components-react";
import type { ScenarioConfig } from "../lib/agents";
import { useDashboardStats } from "./useDashboardStats";
import { KpiBand } from "./KpiBand";
import { InsightsRail } from "./InsightsRail";

interface Props {
  scenario: ScenarioConfig;
}

/**
 * Layout: map on the left, assistant on the right.
 *
 * The map uses the React wrapper from @arcgis/map-components-react. The
 * assistant uses the raw <arcgis-assistant> web component because
 * @arcgis/ai-components ships without React wrappers (no
 * @arcgis/ai-components-react package on npm as of SDK 5.0.19).
 *
 * CRITICAL (CLAUDE.md §9): `referenceElement` must point to a real
 * <arcgis-map> element, not a wrapper. We capture the underlying custom
 * element via the React wrapper's ref and set it imperatively on the
 * assistant — the #1 cause of "agents look loaded but don't respond."
 *
 * suggestedPrompts and entryMessage are also applied imperatively because
 * they're array / long-text properties that don't round-trip well as JSX
 * attributes on custom elements.
 */
export function ScenarioShell({ scenario }: Props) {
  const mapRef = useRef<HTMLArcgisMapElement | null>(null);
  const assistantRef = useRef<HTMLElement | null>(null);
  const [mapEl, setMapEl] = useState<HTMLArcgisMapElement | null>(null);

  // Wire suggestedPrompts + entryMessage onto the assistant once it's mounted.
  useEffect(() => {
    const assistant = assistantRef.current;
    if (!assistant) return;
    const a = assistant as unknown as {
      suggestedPrompts: string[];
      entryMessage: string;
    };
    a.suggestedPrompts = [...scenario.suggestedPrompts];
    a.entryMessage = scenario.entryMessage;
  }, [scenario]);

  // Add live operational feeds (and the optional Baron layer) to the map for
  // real-time context, toggled via the Layer List widget. These are VISUAL
  // ONLY — not in the web map's embeddings, so the assistant can't query them
  // (see LiveFeed in lib/agents.ts).
  //
  // CRITICAL TIMING (CLAUDE.md §9): the assistant's orchestrator runs a
  // one-time startup check that the number of FEATURE layers in the referenced
  // map equals the web map's embeddings-registry count ("Layer count mismatch
  // during registry restoration"). These feeds are feature layers that are NOT
  // in the web map / embeddings, so adding them BEFORE the assistant
  // initializes inflates the count and the orchestrator refuses to start.
  // We therefore wait for the assistant's `arcgisReady` event — it fires only
  // after a SUCCESSFUL init (against the clean 2-layer map), and the registry
  // check is startup-only (the re-init watcher keys on [view, agents], not on
  // map layers), so adding feeds afterward never re-triggers it. Verified
  // against @arcgis/ai-components 5.0.19 internals.
  useEffect(() => {
    const assistant = assistantRef.current;
    if (!assistant || !mapEl) return;

    let added: Layer[] = [];
    let done = false;

    const onReady = () => {
      if (done) return;
      done = true;
      void (async () => {
        await mapEl.viewOnReady();
        const map = mapEl.map;
        if (!map) return;
        for (const feed of scenario.liveFeeds ?? []) {
          added.push(
            new FeatureLayer({
              url: feed.url,
              title: feed.title,
              visible: feed.visible ?? false,
            }),
          );
        }
        added.push(...(await createBaronLayers()));
        if (added.length) map.addMany(added);
      })();
    };

    assistant.addEventListener("arcgisReady", onReady);

    return () => {
      assistant.removeEventListener("arcgisReady", onReady);
      const map = mapEl.map;
      if (map && added.length) map.removeMany(added);
      added = [];
    };
  }, [mapEl, scenario]);

  // Set assistant.referenceElement once the map element is available.
  useEffect(() => {
    const assistant = assistantRef.current;
    if (!assistant || !mapEl) return;
    (assistant as unknown as { referenceElement: HTMLElement }).referenceElement =
      mapEl;
  }, [mapEl]);

  // Executive-dashboard stats — reactive to the assistant's active filter.
  const dash = scenario.dashboard;
  const stats = useDashboardStats(mapEl, dash);

  return (
    <div className="dash">
      {dash && <KpiBand state={stats} cfg={dash} />}
      <div className={`dash-body${dash ? "" : " is-plain"}`}>
        {dash && <InsightsRail state={stats} cfg={dash} />}
        <div className="dash-map">
          <ArcgisMap
            ref={(el) => {
              mapRef.current = el;
              setMapEl(el);
            }}
            itemId={scenario.webmapId}
            style={{ width: "100%", height: "100%" }}
          >
          {/* Map widgets. Each is a child of <ArcgisMap> and auto-connects to
              the view; `slot` docks it in a view corner (top-left, top-right,
              bottom-left, bottom-right — the standard map-components slots).
              These are the React wrappers from @arcgis/map-components-react. */}

          {/* Navigation — top-left */}
          <ArcgisZoom slot="top-left" />
          <ArcgisHome slot="top-left" />
          <ArcgisFullscreen slot="top-left" />

          {/* Search + layer toggling — top-right. LayerList lives in an Expand
              so it stays out of the way until the user wants to toggle the
              projects / flood-hazard / reference layers. */}
          <ArcgisSearch slot="top-right" />
          <ArcgisExpand
            slot="top-right"
            expandIcon="layers"
            expandTooltip="Layers"
            group="top-right"
          >
            <ArcgisLayerList />
          </ArcgisExpand>

          {/* Symbology + scale — bottom-left. Legend is tucked into an Expand
              so the map stays clean until the user opens it to read the
              risk-tier symbology. */}
          <ArcgisExpand
            slot="bottom-left"
            expandIcon="legend"
            expandTooltip="Legend"
            group="bottom-left"
          >
            <ArcgisLegend legendStyle="card" />
          </ArcgisExpand>
          <ArcgisScaleBar slot="bottom-left" />

          {/* Basemap switch — bottom-right. Imagery is useful for eyeballing
              the actual construction sites. */}
          <ArcgisBasemapToggle slot="bottom-right" nextBasemap="hybrid" />
          </ArcgisMap>
        </div>

        <aside className="dash-chat">
          <arcgis-assistant
            ref={(el: HTMLElement | null) => {
              assistantRef.current = el;
            }}
            feedback-enabled
            style={{ flex: 1, minHeight: 0 } as React.CSSProperties}
          >
          {/* OOB agents — registration order is route priority. Data
              exploration first so attribute / stats / filter questions don't
              get hijacked by Navigation. The authoritative list of public
              OOB agents is just these three (CLAUDE.md §9). */}
          {scenario.oobAgents.includes("data-exploration") && (
            <arcgis-assistant-data-exploration-agent />
          )}
          {scenario.oobAgents.includes("navigation") && (
            <arcgis-assistant-navigation-agent />
          )}
          {scenario.oobAgents.includes("help") && (
            <arcgis-assistant-help-agent />
          )}
          {/* Phase 2 slot: <arcgis-assistant-agent id="portfolio-agent" />
              with .agent set in a useEffect against its ref. */}
          </arcgis-assistant>
        </aside>
      </div>
    </div>
  );
}
