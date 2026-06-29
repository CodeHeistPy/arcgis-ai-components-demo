import { useEffect, useRef, useState } from "react";
import { ArcgisMap } from "@arcgis/map-components-react";
import type { ScenarioConfig } from "../lib/agents";

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

  // Set assistant.referenceElement once the map element is available.
  useEffect(() => {
    const assistant = assistantRef.current;
    if (!assistant || !mapEl) return;
    (assistant as unknown as { referenceElement: HTMLElement }).referenceElement =
      mapEl;
  }, [mapEl]);

  return (
    <main
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 380px",
        minHeight: 0,
      }}
    >
      <div style={{ position: "relative", minHeight: 0 }}>
        <ArcgisMap
          ref={(el) => {
            mapRef.current = el;
            setMapEl(el);
          }}
          itemId={scenario.webmapId}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <aside
        style={{
          borderLeft: "1px solid #e1e3e6",
          background: "white",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
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
    </main>
  );
}
