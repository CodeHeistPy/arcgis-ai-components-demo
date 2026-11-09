import Layer from "@arcgis/core/layers/Layer";
import WMSLayer from "@arcgis/core/layers/WMSLayer";
import PortalItem from "@arcgis/core/portal/PortalItem";

/**
 * Baron Weather — premium live-feed prototype (env-gated, OPTIONAL).
 *
 * Baron is a commercial weather provider (radar incl. satellite-derived, flash-
 * flood risk, road weather, lightning, storm tracks, Extreme Weather Index).
 * Unlike the free Living Atlas feeds in `scenario.liveFeeds`, Baron requires a
 * paid subscription — so this loader stays **inert unless configured** and never
 * breaks a demo that has no Baron access.
 *
 * Two supported access paths (configure whichever your subscription gives you):
 *
 *   A. Baron-through-Esri hosted item (PREFERRED). Per the expanded Esri×Baron
 *      partnership (2026), Baron products are purchasable through Esri and
 *      delivered as ArcGIS map/feature services. If your org has one, it's a
 *      normal portal item — the user's existing OAuth token covers access, with
 *      NO client-side signing. Set VITE_BARON_ITEM_ID.
 *
 *   B. OGC WMS endpoint (e.g. Baron radar). Set VITE_BARON_WMS_URL (+ optional
 *      VITE_BARON_WMS_LAYER sublayer name).
 *
 * ⚠️ SECURITY: Baron's raw tile/REST API uses **signed URLs (key + secret)**.
 * A secret must NEVER live in a VITE_ env var — those are inlined into the
 * browser bundle and are fully public. For the WMS path, point VITE_BARON_WMS_URL
 * at an endpoint that is already usable from the browser (public, or a
 * server-side proxy that does the signing). This prototype deliberately does not
 * accept a Baron secret.
 *
 * ⚠️ Like `liveFeeds`, a layer added here is VISUAL context only — it is not in
 * the web map's AI vector embeddings, so the assistant can't query it.
 */
export async function createBaronLayers(): Promise<Layer[]> {
  const layers: Layer[] = [];

  const itemId = import.meta.env.VITE_BARON_ITEM_ID?.trim();
  const wmsUrl = import.meta.env.VITE_BARON_WMS_URL?.trim();
  const wmsSublayer = import.meta.env.VITE_BARON_WMS_LAYER?.trim();

  // Path A — Baron-through-Esri hosted item (token-based, no signing).
  if (itemId) {
    try {
      const layer = await Layer.fromPortalItem({
        portalItem: new PortalItem({ id: itemId }),
      });
      layer.title = layer.title || "Baron Weather (premium)";
      layer.visible = false;
      layers.push(layer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[baron] failed to load portal item ${itemId} — check the id and that your org has access.`,
        err,
      );
    }
  }

  // Path B — OGC WMS endpoint (e.g. Baron radar).
  if (wmsUrl) {
    const layer = new WMSLayer({
      url: wmsUrl,
      title: "Baron Radar (premium, WMS)",
      visible: false,
      // If a sublayer name is given, request just that product; otherwise let
      // the WMS GetCapabilities response populate all sublayers.
      ...(wmsSublayer ? { sublayers: [{ name: wmsSublayer }] } : {}),
    });
    layers.push(layer);
  }

  return layers;
}

/** True if any Baron access path is configured in the environment. */
export function isBaronConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_BARON_ITEM_ID?.trim() ||
      import.meta.env.VITE_BARON_WMS_URL?.trim(),
  );
}
