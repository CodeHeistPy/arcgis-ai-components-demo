import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initArcgis } from "./lib/arcgis";

// Component CSS — required for proper styling of <arcgis-map>, the
// assistant chat UI, and the underlying calcite chrome.
import "@esri/calcite-components/main.css";
import "@arcgis/map-components/main.css";
import "@arcgis/ai-components/main.css";

import "./index.css";

// Register web components + configure portal/auth before React mounts.
// initArcgis is idempotent so StrictMode's double-invoke is fine.
initArcgis();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root element not found in index.html");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
