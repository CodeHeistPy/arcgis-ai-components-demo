# Reproduction Walkthrough — ArcGIS AI Components Demo App

A step-by-step guide to rebuild this app from zero: a Vite + React + TypeScript
SPA that puts an `<arcgis-assistant>` chat panel beside a web map, using the
**AI components (beta) in ArcGIS Maps SDK for JavaScript 5.0**.

> Read this alongside [`LESSONS-LEARNED.md`](./LESSONS-LEARNED.md) — it explains
> *why* several of these steps are the way they are, and will save you the day
> of debugging we already paid for. `CLAUDE.md` is the deep project context;
> `DEMO.md` is the run sheet for presenting it.

**Time budget:** ~1–2 hours of build, *plus* whatever it takes your org admin to
prep the upstream web map (embeddings) and your OAuth credentials. The upstream
prep is the long pole — start it first (Step 0).

---

## Step 0 — Upstream prerequisites (do these FIRST; they gate everything)

None of the app code matters until these are true. They involve ArcGIS Online,
not your editor, and the embeddings step in particular can fail and need retries.

> **Devs, read this:** Steps 0a–0b are GIS-side configuration in ArcGIS Online,
> not code — and they determine answer quality more than anything in the app.
> The agent finds the right layer/field almost entirely from your **metadata**
> and the **embeddings** built from it. Don't skip or rush them.

### 0a. A hosted feature layer + web map, with good metadata
You need a hosted feature service published to ArcGIS Online and a **web map**
that contains it. The OOB agents discover layers *through the web map*, not from
a direct service URL. Note the **web map item ID** — you'll need it.

Then **populate metadata** — per Esri's
[web map setup guide](https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/),
the agents reason over it:

- **Layer:** a meaningful name and a description of the layer's purpose.
- **Fields:** descriptive **aliases** *and* **field descriptions** for every
  field users might ask about — set in the layer item's **Data → Fields** view
  in ArcGIS Online. A raw `pct_cmplt` is opaque to the model; alias *"Percent
  Complete"* + a one-line description is not. Esri's guidance: use *"layers with
  good metadata for the best experience."*

This is the highest-leverage step for answer quality, and it's pure GIS config.

### 0b. Generate AI vector embeddings on the web map
Mandatory, and easy to miss. The embeddings are a semantic index of your
**layer titles and field metadata**, so the agent can pick the most relevant
layer/field before calling the LLM. Without them the assistant renders but
greets you with *"Embeddings not found for this web map."*

- Open the **web map** item → **Settings** tab → **Manage AI vector
  embeddings** → **Generate Embeddings**. (Not via AGO Assistant — outdated.)
- **Do this AFTER 0a.** Embeddings capture metadata as it is at generation time,
  so populate metadata first. **Re-generate whenever you change field metadata
  or the schema** — otherwise the index is stale.

> ⚠️ Embeddings can fail with a generic *"There was an error generating AI
> vector embeddings"* that shows up in DevTools as a **CORS error** but is
> actually an **HTTP 504 timeout**. Wide-schema reference layers (hundreds of
> fields) trigger it. See `LESSONS-LEARNED.md` §"Embeddings". Fix: remove the
> offending layer, generate embeddings, add it back for visual context only.

### 0c. Org settings
The signed-in user's ArcGIS Online org must have:
- **AI assistants enabled**
- **Beta apps not blocked**

### 0d. OAuth Developer credentials
- In ArcGIS Online, create a **Developer credentials** item with **OAuth 2.0 /
  User authentication** (NOT app auth — there's no user context in app auth, and
  the AI calls are gated on the signed-in user).
- Add redirect URI `http://localhost:5173`.
- Copy the **Client ID**. (You do *not* need a client secret — PKCE handles the
  SPA case.)

---

## Step 1 — Scaffold the project

```bash
mkdir arcgis-ai-demo && cd arcgis-ai-demo
```

Create the folder structure:

```
.
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
├── .gitignore
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── components/
    │   ├── ScenarioShell.tsx
    │   ├── ScenarioHeader.tsx
    │   ├── AuthGate.tsx
    │   └── ErrorBoundary.tsx
    ├── scenarios/
    │   └── scenario-01-sample/
    │       ├── config.ts
    │       └── prompts.ts
    └── lib/
        ├── arcgis.ts
        └── agents.ts
```

The `scenarios/` folder is deliberate from day one — each future demo scenario
becomes a sibling folder with the same `config.ts` + `prompts.ts` shape, so you
never fork the app.

---

## Step 2 — Dependencies (use the REAL versions)

```jsonc
// package.json dependencies — all @arcgis/* align at the same SDK version
{
  "dependencies": {
    "@arcgis/ai-components": "^5.0.19",
    "@arcgis/core": "^5.0.19",
    "@arcgis/map-components": "^5.0.19",
    "@arcgis/map-components-react": "^5.0.19",
    "@esri/calcite-components": "^5.0.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

> **Two traps here, both verified the hard way:**
> 1. There is **no `@arcgis/ai-components-react`** package. The AI components
>    ship only as web components. Use them as raw custom elements in JSX.
> 2. The SDK 5.0 line is `5.0.x` (the historic 4.x `@arcgis/core` jumped to 5.x
>    for this release). Don't pin from memory — run
>    `npm view @arcgis/ai-components version` to confirm the current version
>    before pinning.

Pin `@esri/calcite-components` as a **direct** dependency even though it comes in
transitively — it's a peer dep, and pinning it stops version drift.

`npm install`. (LangGraph, LangChain, and Zod arrive automatically as transitive
deps of `@arcgis/ai-components` — you'll need them in Phase 2.)

---

## Step 3 — Register custom elements (the #1 gotcha)

SDK 5.x is **Lumina-based**. A bare side-effect import like
`import "@arcgis/map-components"` **does NOT register the elements** — you'll get
`Custom element "arcgis-map" not found` at first render. You must call
`defineCustomElements()` from each package's `/loader` entry.

```ts
// src/lib/arcgis.ts (excerpt)
import esriConfig from "@arcgis/core/config";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import OAuthInfo from "@arcgis/core/identity/OAuthInfo";

import { defineCustomElements as defineCalciteElements } from "@esri/calcite-components/loader";
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/loader";
import { defineCustomElements as defineAiElements } from "@arcgis/ai-components/loader";

let initialized = false;

export function initArcgis(): void {
  if (initialized) return;
  initialized = true;

  defineCalciteElements();
  defineMapElements();
  defineAiElements();

  esriConfig.portalUrl = import.meta.env.VITE_PORTAL_URL ?? "https://www.arcgis.com";

  const oauthInfo = new OAuthInfo({
    appId: import.meta.env.VITE_ARCGIS_OAUTH_APP_ID,
    portalUrl: esriConfig.portalUrl,
    popup: false,
    flowType: "auto",
  });
  IdentityManager.registerOAuthInfos([oauthInfo]);
}
```

Call `initArcgis()` in `main.tsx` **before** React mounts. And import the CSS
from all three packages there too, or the chrome renders unstyled:

```ts
// src/main.tsx (excerpt)
import { initArcgis } from "./lib/arcgis";
import "@esri/calcite-components/main.css";
import "@arcgis/map-components/main.css";
import "@arcgis/ai-components/main.css";
import "./index.css";

initArcgis();
// ... createRoot(...).render(<App />)
```

---

## Step 4 — Declare the AI web components for TypeScript

Because there are no React wrappers for the AI components, TS needs to know the
custom-element tags. Add to `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    "arcgis-assistant": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>, HTMLElement
    > & { "feedback-enabled"?: boolean; "reference-element"?: HTMLElement | string };
    "arcgis-assistant-navigation-agent": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "arcgis-assistant-data-exploration-agent": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "arcgis-assistant-help-agent": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
```

Also declare your `ImportMetaEnv` vars here for typed `import.meta.env`.

---

## Step 5 — The map + assistant layout

The map uses the React wrapper (`<ArcgisMap>` from `@arcgis/map-components-react`).
The assistant uses the **raw** web component. Three properties must be set
**imperatively** via refs, not as JSX attributes:

- `referenceElement` — **must be the real `<arcgis-map>` DOM element.** This is
  the #1 cause of "agents look loaded but don't respond." Capture it from the
  map wrapper's ref.
- `suggestedPrompts` (array) and `entryMessage` (long string).

```tsx
// src/components/ScenarioShell.tsx (shape)
import { useEffect, useRef, useState } from "react";
import { ArcgisMap } from "@arcgis/map-components-react";

export function ScenarioShell({ scenario }) {
  const assistantRef = useRef<HTMLElement | null>(null);
  const [mapEl, setMapEl] = useState<HTMLArcgisMapElement | null>(null);

  useEffect(() => {
    const a = assistantRef.current as any;
    if (!a) return;
    a.suggestedPrompts = [...scenario.suggestedPrompts];
    a.entryMessage = scenario.entryMessage;
  }, [scenario]);

  useEffect(() => {
    const a = assistantRef.current as any;
    if (a && mapEl) a.referenceElement = mapEl;   // ← the real <arcgis-map>
  }, [mapEl]);

  return (
    <main style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px" }}>
      <ArcgisMap ref={(el) => setMapEl(el)} itemId={scenario.webmapId} style={{ height: "100%" }} />
      <arcgis-assistant ref={(el) => (assistantRef.current = el)} feedback-enabled>
        <arcgis-assistant-data-exploration-agent />
        <arcgis-assistant-navigation-agent />
        <arcgis-assistant-help-agent />
      </arcgis-assistant>
    </main>
  );
}
```

> **Only three OOB agents are public** and mountable:
> `navigation`, `data-exploration`, `help`. The package also compiles in
> `layer-filter`, `layer-query`, `layer-styling`, and `chat-*` elements — these
> have **no public docs** and are internal building blocks. **Don't mount them.**
> Verify against `developers.arcgis.com` reference pages, never filenames.

---

## Step 6 — Auth gate + error boundary

- **`AuthGate`** blocks the app behind OAuth sign-in. Use
  `IdentityManager.checkSignInStatus()` on mount; `getCredential()` on the
  sign-in button (no `<form>` — onClick handler). Demo users must be **named
  users**; anonymous/public will silently fail at the LLM call.
- **`ErrorBoundary`** wraps the shell so a render crash shows an inline message
  instead of a blank screen. In a live demo, a blank panel is the worst outcome.

---

## Step 7 — Scenario config + prompts

Keep all scenario-specific copy out of components. One `config.ts` (web map ID,
agent list, entry message, prompts) and one `prompts.ts` per scenario:

```ts
// scenario-01-sample/config.ts
const scenario = {
  id: "scenario-01-sample",
  title: "Sample Scenario",
  webmapId: import.meta.env.VITE_WEBMAP_ID || "REPLACE_WITH_YOUR_WEBMAP_ITEM_ID",
  oobAgents: ["navigation", "data-exploration", "help"],
  entryMessage: ENTRY_MESSAGE,
  suggestedPrompts: [...SUGGESTED_PROMPTS],
};
export default scenario;
```

**Write prompts to the OOB agent's strengths** (verified): single-attribute
filters, single-group aggregates, multi-attribute combos, and **state-scoped**
cross-layer intersects. Avoid: schema introspection (hallucinates),
cross-category comparison (degrades), unbounded cross-layer (413). See
`LESSONS-LEARNED.md` §"Prompt engineering".

---

## Step 8 — Env + run

```bash
# .env.local (gitignored — copy from .env.example)
VITE_ARCGIS_OAUTH_APP_ID=<your client id>
VITE_PORTAL_URL=https://www.arcgis.com
VITE_WEBMAP_ID=<your web map item id>
VITE_FEATURE_SERVICE_URL=<direct service URL — Phase 2 only>
```

```bash
npm run dev      # → http://localhost:5173
```

Sign in as a named user → the map loads → try a suggested prompt. If you get
"Embeddings not found," go back to **Step 0b**.

---

## Step 9 — tsconfig project references (build-time gotcha)

If you split config into `tsconfig.json` + `tsconfig.node.json` (referenced
project for `vite.config.ts`):
- The referenced project **must** have `"composite": true` and an `outDir`.
- It **cannot** have `"noEmit": true` — keep that on the main tsconfig only.
- Lint with `tsc -b` (not `tsc -b --noEmit`).

```jsonc
// package.json
"scripts": { "dev": "vite", "build": "tsc -b && vite build", "lint": "tsc -b" }
```

---

## Step 10 — Verify before you call it done

Run each prompt and **cross-check the data for self-consistency** — the agent
will confabulate confidently if it stumbles:
- Ask for a total, then ask for the itemized breakdown. The items must sum to
  the total.
- Re-ask about the same entity in a later turn. IDs/names must stay stable.

If both hold, your data-query prompts are trustworthy. (Schema-introspection
prompts never are — keep them out of the demo.)

---

## Phase 2 (later) — the custom agent

Once Phase 1 demos cleanly, add a LangGraph custom agent via
`<arcgis-assistant-agent>` (its `.agent` property, set imperatively). It closes
the measured OOB gaps: cross-category comparison and correct-direction
cross-layer queries. Requires npm/bundler — **custom agents cannot run from
CDN.** See `CLAUDE.md` §6.
