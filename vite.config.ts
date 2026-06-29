import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Required for OAuth redirect — matches the redirect URI registered on the
    // ArcGIS Developer credentials item (see CLAUDE.md §8).
    host: "localhost",
  },
  // Calcite + ArcGIS web components ship as ESM; no special optimizeDeps needed
  // for current SDK versions, but the assistant pulls in a lot — pre-bundling
  // helps the cold-start dev experience during demos.
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
