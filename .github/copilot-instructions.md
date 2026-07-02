# Copilot instructions — ArcGIS AI Components demo

This repo is a **Vite + React + TypeScript** template for the **AI components
(beta) in the ArcGIS Maps SDK for JavaScript 5.0** — an `<arcgis-assistant>`
chat panel beside an `<arcgis-map>`, using the out-of-the-box **navigation,
data-exploration, and help** agents.

You are helping someone who may not write JavaScript. Prefer small, clear
changes; explain what you changed in plain language; don't restructure the app.

## Run it
- `npm install`, then `npm run dev` → http://localhost:5173 (port is pinned via
  `strictPort`; keep it 5173 so OAuth redirects match).
- Config values live in `.env.local` (copy from `.env.example`):
  `VITE_ARCGIS_OAUTH_APP_ID`, `VITE_WEBMAP_ID`, `VITE_PORTAL_URL`.

## SDK facts you MUST respect (these are easy to get wrong from memory)
- All `@arcgis/*` packages are **5.0.x**. This is the SDK 5.0 line, not 4.x.
- **There is NO `@arcgis/ai-components-react` package.** The AI components are
  **web components only** — use them as raw custom elements in JSX
  (`<arcgis-assistant>`, `<arcgis-assistant-data-exploration-agent>`, etc.),
  declared in `src/vite-env.d.ts`. Only the *map* has a React wrapper
  (`@arcgis/map-components-react`).
- Custom elements must be registered by calling `defineCustomElements()` from
  each package's `/loader` (see `src/lib/arcgis.ts`) — bare imports do NOT
  register them (SDK 5.x is Lumina-based).
- Set `referenceElement`, `suggestedPrompts`, and `entryMessage` on
  `<arcgis-assistant>` **imperatively via a ref** (not as JSX attributes).
  `referenceElement` must be the real `<arcgis-map>` element.
- The only public OOB agents are **`navigation`, `data-exploration`, `help`**.
  There is no `feature-info` agent. Do NOT mount internal
  `arcgis-assistant-layer-*` elements — they aren't public API.
- Don't invent SDK APIs/props from memory. If unsure, say so and point to the
  Esri reference at developers.arcgis.com rather than guessing (this is beta).

## Conventions
- TypeScript strict mode; run `npm run lint` (`tsc -b`) after changes.
- Scenario-specific copy lives in `src/scenarios/scenario-01-sample/config.ts`
  and `prompts.ts` — never hardcode it in components. Add a scenario by copying
  that folder.
- No HTML `<form>` tags (SPA — use `onClick`).

## Auth (most workshop users are SAML / enterprise logins)
- OAuth 2.0 **user** authentication (not app auth). The Client ID goes in
  `VITE_ARCGIS_OAUTH_APP_ID`.
- SAML users: set `VITE_PORTAL_URL` to their **org URL**
  (`https://<org-key>.maps.arcgis.com`) to route to their identity provider.
- The assistant needs the web map to have **metadata + AI vector embeddings**
  (done in ArcGIS Online, outside this repo) and the org to have AI assistants
  enabled.

## Where the detail lives (read these before large changes)
`README.md` (start here) · `WALKTHROUGH.md` (build) · `DEV-OAUTH-CREDENTIALS.md`
(register the app) · `ACTIVITY-2-AUTH.md` (SAML vs built-in) · `CLAUDE.md`
(full context + every gotcha) · `LESSONS-LEARNED.md`.
