import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // strictPort: fail loudly if 5173 is taken instead of silently shifting to
    // 5174 — a shifted port breaks OAuth (the redirect URI is registered as
    // http://localhost:5173). Critical for workshops/shared machines: a broken
    // redirect is far harder to diagnose than a clear "port in use" error.
    strictPort: true,
    // Must match the redirect URL registered on the OAuth credentials item
    // (see DEV-OAUTH-CREDENTIALS.md).
    host: "localhost",
  },
  // Calcite + ArcGIS web components ship as ESM; no special optimizeDeps needed
  // for current SDK versions, but the assistant pulls in a lot — pre-bundling
  // helps the cold-start dev experience during demos.
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
