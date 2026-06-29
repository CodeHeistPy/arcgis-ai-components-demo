# CLAUDE.md — ArcGIS AI Components Demo (template)

> **Purpose:** Persistent project context for Claude Code. Read this before
> working in the repo. This is a **reusable template** for an agentic web app
> built on the AI components (beta) in the ArcGIS Maps SDK for JavaScript 5.0.
> Replace the `<PLACEHOLDER>` values with your own and update this file as your
> project evolves.

---

## 1. The Big Picture

This is a single-page app that puts an `<arcgis-assistant>` chat panel beside an
`<arcgis-map>`, so end users can ask natural-language questions against a web
map. It demonstrates that a well-modeled hosted feature layer unlocks a
conversational interface "for free" via web components.

```
Your data  ──►  ArcGIS Online (hosted feature layer)  ──►  Web Map (+ embeddings)  ──►  THIS APP
```

The app discovers the feature layer **through the web map**, not a direct
service URL. The web map must have AI vector embeddings generated (see §9).

---

## 2. Your Data — fill this in

This template ships with a single placeholder scenario
(`src/scenarios/scenario-01-sample/`). Replace the values below with the facts
about **your** dataset, and keep this section authoritative — the assistant
hallucinates schema (see §9), so a human-verified record here is the source of
truth.

| Item | Value |
|---|---|
| Web map item ID | `<YOUR_WEBMAP_ITEM_ID>` |
| Feature service name | `<YOUR_SERVICE_NAME>` |
| Feature service URL | `<YOUR_FEATURE_SERVICE_URL>` |
| Org ID | `<YOUR_ORG_ID>` |
| User context | `<your.username@org>` |
| Record count | `<N>` |
| Key metric + actual range | `<metric>` : `<min>`–`<max>` (use **actual-data** breaks, not theoretical) |
| Category field + allowed values | `<field>` : `<value set>` |
| Join key (if multi-scenario) | `<field>` |

### Verified field schema

Fill from the ArcGIS Online item's **Data → Fields** view or the
token-authenticated REST endpoint (`.../FeatureServer/0?f=pjson`) — **never** the
assistant. List field name, type, and a note per field.

> **Consistency rule (learned across many demos):** symbology, suggested
> prompts, and any "tier"/bucket logic must use the **actual-data ranges** from
> your layer, not clean theoretical scales. If a stored field already encodes a
> tier/category, filter on it directly rather than recomputing from breaks.

---

## 3. What This App Does

A Vite + React + TypeScript SPA that:

1. Loads a web map by `item-id`.
2. Renders it with `<arcgis-map>` from `@arcgis/map-components`.
3. Mounts an `<arcgis-assistant>` chat panel beside it.
4. Registers the OOB **Navigation**, **Data Exploration**, and **Help** agents.
5. Provides scenario-specific `suggestedPrompts` and an `entryMessage`.
6. (Phase 2) Adds a **custom LangGraph agent** for reasoning the OOB agents
   can't do — see §6.

### Why this stack

- **AI components (beta) shipped in JS Maps SDK 5.0** (Feb 2026). The
  `<arcgis-assistant>` component handles the chat UX, orchestrator, and LLM
  calls. Public out-of-the-box agents are **`navigation`, `data-exploration`,
  `help`** — verified against the reference pages on developers.arcgis.com.
  (The package also contains internal `layer-filter`/`layer-query`/
  `layer-styling` elements with no public docs — see §9. There is no
  `feature-info` agent in 5.0.x.)
- **Custom agents require npm/bundler** (CDN cannot consume them) — so this is a
  Vite project from day one even though Phase 1 only uses OOB agents.
- **Web map embeddings are required** for the OOB agents to route queries to the
  right layer. Generate them on the web map's **Item Details → Settings** tab in
  ArcGIS Online. If missing, the assistant renders but errors with "Embeddings
  not found for this web map."

### End-user prerequisites

- Signed-in **named user** of an ArcGIS Online org (no trial, no public/anon).
- Viewer access to the web map (or it's shared publicly).
- **AI assistants enabled** in org settings.
- **Beta apps not blocked** in org settings.

---

## 4. Project Conventions

### File layout

```
.
├── CLAUDE.md  README.md  WALKTHROUGH.md  LESSONS-LEARNED.md  DEMO.md
├── index.html  package.json  vite.config.ts  tsconfig.json  tsconfig.node.json
├── .env.example
├── docs/slides/                       ← regenerable slide deck
└── src/
    ├── main.tsx  App.tsx  index.css  vite-env.d.ts
    ├── components/
    │   ├── ScenarioShell.tsx          ← layout: map left, assistant right
    │   ├── ScenarioHeader.tsx         ← title, scenario switcher (future)
    │   ├── AuthGate.tsx               ← OAuth sign-in wall
    │   └── ErrorBoundary.tsx          ← surfaces render errors
    ├── scenarios/
    │   └── scenario-01-sample/
    │       ├── config.ts              ← webmap id, prompts, entry message, agents
    │       └── prompts.ts             ← suggested + out-of-scope prompts (see §5)
    └── lib/
        ├── arcgis.ts                  ← SDK init, element registration, OAuth
        └── agents.ts                  ← shared ScenarioConfig type
```

**Why a `scenarios/` folder:** to add scenarios, copy the folder (see §7) — never
fork the app.

### Naming & style

- Scenario folders: `scenario-NN-<slug>`.
- One config object per scenario, default-exported from `config.ts`, conforming
  to the shared `ScenarioConfig` type in `lib/agents.ts`.
- TypeScript strict mode on. No HTML `<form>` tags (SPA — use `onClick`).
- Keep the assistant's `referenceElement` pointing to a real `<arcgis-map>`
  element (required for OOB agents — see §9).
- All scenario-specific copy lives in `config.ts`/`prompts.ts`, never inline in
  JSX.

---

## 5. Suggested Prompts & Entry Message

Wire these into `<arcgis-assistant>` via the `suggestedPrompts` and
`entryMessage` properties (set imperatively — see §8). Keep prompts tight: the
OOB data-exploration agent handles **query / statistics / spatial-proximity /
filter** only — no visualization, symbology, or external data.

**Prompt shapes that are reliable** (replace placeholders with your data):

1. Single-attribute filter — *"Show me the &lt;high-priority&gt; &lt;records&gt;."*
2. Single-group aggregate — *"What's the average &lt;metric&gt; for &lt;group&gt;?"*
   (single-group is reliable; multi-group **comparison** is not — see below)
3. Multi-attribute combo — *"Which &lt;records&gt; have &lt;A&gt; and &lt;B&gt;?"*
4. Cross-layer intersect — *"Which &lt;records&gt; in &lt;state/region&gt; intersect
   &lt;reference layer&gt;?"* — **must be state/region-scoped** (§9 — unbounded
   national versions 413).

**Prompt-shape rule:** *pointed, single-subject* prompts are reliable; *broad
sweeps* degrade. A pointed "Is &lt;named record&gt; in &lt;condition&gt;? Give the
specifics" returns exact attributes; a broad "which records are affected by X"
tends to return a vague feature count with no real assertion. Always verify a
prompt returns correct, self-consistent data against your layer before shipping.

**Out-of-scope prompts** (fail / hallucinate / degrade — Phase 2 candidates):

- Cross-category comparison ("how does A compare to B") — **silently degrades**
  to one overall number (no GROUP BY in one turn).
- Schema introspection ("list fields", "what can I ask?") — **hallucinates**
  (see §9). Never demo. Verify schema via AGO **Data → Fields**.
- Forecasts, chart generation, external integrations, user location — not
  supported.

---

## 6. The Custom Agent (Phase 2)

The differentiated piece — build it once Phase 1 (OOB agents on your web map) is
demoable.

### Tech stack (transitive deps of `@arcgis/ai-components`, install automatically)

- **LangGraph v1.1** — orchestration graph, state, tool definitions
- **LangChainJS v1.1** — LLM/embeddings calls
- **Zod v3** — structured-output schemas

### Why a custom agent — measured OOB gaps it closes

- **Cross-category comparison.** The OOB orchestrator does single-group
  aggregates fine but won't GROUP BY / compare categories in one turn.
- **Cross-layer query direction.** A "which records intersect &lt;big reference
  layer&gt;" prompt makes the OOB agent submit national-scale geometry as a
  spatial filter on the small layer → 413 (§9). A custom tool submits the small
  record set as the filter against the reference layer instead — correct
  direction, server-side.

### Wiring

Mount `<arcgis-assistant-agent>` inside `<arcgis-assistant>` and set its `.agent`
property imperatively (via a ref) to an object with `id`, `name`, `description`,
and a LangGraph `StateGraph`. The **description string is how the orchestrator
routes** — be specific about when to use the agent and when not to. For
state-changing tools, use the human-in-the-loop interrupt pattern
(`arcgis-assistant-interrupt`).

---

## 7. Extending to Multiple Scenarios

1. **Don't fork.** Add a new folder under `src/scenarios/` matching
   `scenario-01-sample/`'s shape.
2. **One scenario = one config object** (web map ID, prompts, entry message,
   agents).
3. **Reuse OOB agents** — they cost nothing; let the orchestrator route. Only
   build a custom agent when the OOB ones can't answer obvious questions.
4. **Add a scenario switcher** once you have two — `ScenarioHeader.tsx` gets a
   dropdown that swaps the active config.
5. **Every scenario web map needs embeddings** (Item Details → Settings) before
   its agents work. Re-run if the schema changes.

---

## 8. Build & Run

### `.env.local` (gitignored — copy from `.env.example`)

```
VITE_ARCGIS_OAUTH_APP_ID=<your client id>
VITE_PORTAL_URL=https://www.arcgis.com
VITE_WEBMAP_ID=<your web map item id>
VITE_FEATURE_SERVICE_URL=<direct service URL — Phase 2 only>
```

The OAuth client ID comes from an ArcGIS Online **Developer credentials** item
(OAuth 2.0 **user** auth). Redirect URI for local dev: `http://localhost:5173`.
You need only the Client ID — no secret (PKCE).

### Dev loop

```bash
npm install
npm run dev          # → http://localhost:5173
```

### React usage notes

Use the JSX wrapper from **`@arcgis/map-components-react`** for the map
(`<ArcgisMap>`). **There is no `@arcgis/ai-components-react` package** — the AI
components ship only as web components. Use them as raw custom elements in JSX
(`<arcgis-assistant>`, `<arcgis-assistant-data-exploration-agent>`, etc.) and add
`IntrinsicElements` declarations in `src/vite-env.d.ts`.

Imperative-only props (set in `useEffect` against a ref, not as JSX attrs):
- `referenceElement` on `<arcgis-assistant>` — must be the actual `<arcgis-map>`
  DOM element (§9).
- `suggestedPrompts` (array) and `entryMessage` (long string).
- `.agent` on `<arcgis-assistant-agent>` for the Phase 2 custom agent.

Confirmed package versions (2026-05): all `@arcgis/*` align at **5.0.19**
(including `@arcgis/core`, which jumped from the historic 4.x line to 5.x for
SDK 5.0). `@arcgis/ai-components` pulls in `@langchain/langgraph ^1.1.2`,
`@langchain/core ^1.1.17`, and `zod ^3.25.76`. Pin from a fresh
`npm view @arcgis/ai-components version`, not from memory.

### Minimal skeleton

```html
<arcgis-map id="main-map" item-id="<YOUR_WEBMAP_ITEM_ID>"></arcgis-map>

<arcgis-assistant reference-element="main-map" feedback-enabled>
  <arcgis-assistant-data-exploration-agent></arcgis-assistant-data-exploration-agent>
  <arcgis-assistant-navigation-agent></arcgis-assistant-navigation-agent>
  <arcgis-assistant-help-agent></arcgis-assistant-help-agent>
</arcgis-assistant>
```

---

## 9. Known Gotchas

- **The assistant needs embeddings on the web map.** Symptom: it renders but
  greets with "Embeddings not found for this web map." Fix: web map's **Item
  Details → Settings** tab → generate embeddings. (Older docs point at AGO
  Assistant — outdated.) One-time per web map; re-run if the schema changes. See
  <https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/#embeddings>.
- **Embeddings generation can fail with `504 Gateway Time-out`, masquerading as
  a CORS error.** AGO surfaces only a generic "There was an error generating AI
  vector embeddings." DevTools shows what looks like a CORS failure from
  `aimodels.arcgis.com` (no `Access-Control-Allow-Origin`), but the real cause is
  an HTTP 504 — the pipeline exceeds the gateway budget for certain layers, and
  the 504 bypasses CORS middleware. **Two symptoms, one cause.**
  - **Schema width, not scale, is the trigger.** A national-scale layer with a
    **narrow** schema embeds fine; a layer with a very **wide** composite-index
    schema (hundreds of fields, suffixes like `_HLR`/`_AFREQ`/`_ALR`) times out.
    Prefer narrow-schema reference layers; treat wide ones as suspect until
    tested.
  - **Workaround:** generate embeddings with the slow layer excluded, save, then
    add it back. It renders for visual context but is **not** in the assistant's
    semantic index (users can't ask about it).
  - **Bisection:** remove all reference layers, embed (should succeed), add back
    one at a time re-running embeddings; the one(s) that re-trigger the 504 are
    the culprits. The CORS message won't identify which.
- **OOB Data Exploration agent can pick the wrong query direction on cross-layer
  spatial intersects.** Symptom: "which records are in &lt;reference layer&gt;"
  returns "No features were returned due to a query failure"; DevTools shows a
  **POST … 413 Content Too Large** to the small layer. Cause: the agent queries
  the large reference layer first, then submits its national-scale geometry as
  the spatial filter on the small layer — exceeding the POST size limit.
  Mitigations, by demo-readiness:
  - **Scope the prompt geographically** ("…in &lt;state&gt;…"). Cheapest, no code.
  - **Pre-compute the attribute** (e.g. an `in_<condition>` boolean) on your
    service and answer as a plain attribute query. Production pattern.
  - **Phase 2 custom agent** that submits the small record set as the filter
    against the reference layer.
- **The OOB agent hallucinates schema/metadata on introspection prompts — but
  data queries are reliable.** A sharp, demo-critical distinction:
  - **Schema/metadata introspection ("list fields", "what can I ask?") =
    hallucinates.** Observed returning two mutually contradictory field lists in
    a single turn — wrong field names, invented scales, fabricated fields.
    Confident and dangerous.
  - **Actual data queries (filter / aggregate / itemize) = reliable and
    self-consistent.** Totals reconcile to itemized breakdowns; entity id↔name
    mappings stay stable across independent turns. A confabulating model doesn't
    hold cross-turn join consistency.
  - **Consequences:** (1) Never put schema-introspection prompts in a live demo.
    (2) Demo prompts that *query the data* are on solid ground. (3) Get
    authoritative schema from AGO **Data → Fields** or the token-authenticated
    REST endpoint — never the assistant. (4) Sanity-check a returned scalar by
    forcing a decomposition that must reconcile (itemized list + total).
- **Custom agents cannot run from CDN.** Stay on Vite/npm.
- **OAuth scopes matter.** Use **user** auth; the credentials item needs scopes
  the signed-in org permits for AI calls. Immediate first-prompt errors usually
  trace here.
- **Demo audience must be a named user.** Public/anonymous silently fails at the
  LLM call step.
- **The orchestrator is non-deterministic.** Don't promise an exec identical
  answers each time. Use `suggestedPrompts` + `entryMessage` to set expectations.
- **`reference-element` must point to a real `<arcgis-map>`** — not a wrapper
  div. The #1 cause of "agents look loaded but don't respond."
- **No React wrappers for AI components.** `@arcgis/ai-components-react` doesn't
  exist on npm. Use raw web components in JSX with `IntrinsicElements` decls.
- **`tsconfig` + project references.** A referenced project
  (`tsconfig.node.json`) must have `composite: true` + an `outDir`, and can't set
  `noEmit: true`. Keep `noEmit` on the main tsconfig only; lint with `tsc -b`.
- **Custom elements must be explicitly registered via `defineCustomElements()`.**
  SDK 5.x is Lumina-based — bare-package side-effect imports do NOT register
  elements. Without calling `defineCustomElements()` from each package's
  `/loader`, the React wrappers throw `Custom element "arcgis-map" not found` at
  first render. Call all three in `initArcgis()` before React mounts:
  ```ts
  import { defineCustomElements as defineCalciteElements } from "@esri/calcite-components/loader";
  import { defineCustomElements as defineMapElements } from "@arcgis/map-components/loader";
  import { defineCustomElements as defineAiElements } from "@arcgis/ai-components/loader";
  defineCalciteElements(); defineMapElements(); defineAiElements();
  ```
  Import each package's `main.css` in `main.tsx` too, or the chrome is unstyled.
- **Promote `@esri/calcite-components` to a direct dep.** It's a peer dep that
  arrives transitively; pin it explicitly so installs don't drift it.
- **Not every element in `@arcgis/ai-components/dist/components/` is a public
  API.** Internal building blocks (`arcgis-assistant-layer-filter-agent`,
  `-layer-query-agent`, `-layer-styling-agent`, the `-chat*` primitives) have no
  public reference pages — don't mount them. The mountable OOB agents are the
  three with docs: `navigation`, `data-exploration`, `help`. Plus
  `arcgis-assistant-agent` (custom) and `arcgis-assistant-interrupt` (HIL).
  Filename ≠ public API — confirm against the reference docs.

---

## 10. Reference Links

- **AI components overview:** https://developers.arcgis.com/javascript/latest/references/ai-components/
- **`arcgis-assistant` reference:** https://developers.arcgis.com/javascript/latest/references/ai-components/components/arcgis-assistant/
- **Data Exploration agent reference:** https://developers.arcgis.com/javascript/latest/references/ai-components/components/arcgis-assistant-data-exploration-agent/
- **Custom agents guide:** https://developers.arcgis.com/javascript/latest/agentic-apps/ai-custom-agents/
- **Building agentic apps (concepts):** https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
- **AI web map setup / embeddings:** https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/
- **JS Maps SDK 5.0 release notes:** https://developers.arcgis.com/javascript/latest/release-notes/

---

## 11. Working Style (for Claude Code)

- **Do not assume or infer without solid evidence.**
  - Filenames in `node_modules/.../dist/components/` are **not** documentation.
    They prove an element is compiled in, not that it's a supported public API.
    Verify against developers.arcgis.com before claiming an element does X.
  - Don't infer behavior/props/capabilities from names — names suggest, docs
    confirm.
  - Verify versions/config/API signatures against (in order): (1) Esri docs, (2)
    the package's `dist/docs/` manifests, (3) `package.json` `exports`, (4)
    running the code. Not from memory of older SDK versions.
  - Treat §2 (your data facts) as authoritative — never invent fields, value
    sets, or thresholds. If something looks off, check the real feature service.
- **Ask for clarification when unsure.** Better one targeted question than a
  wrong assumption — especially on scope (Phase 1 vs 2, OOB vs custom), new
  dependencies/file patterns, or any unverified capability claim.
- **Distinguish what you know from what you're guessing.** Flag inferences
  explicitly ("the docs don't confirm this, but…").
- **Update this CLAUDE.md when you learn something** — a new gotcha, a data
  fact, a correction. Corrections matter as much as additions; edit in place and
  note what changed.
- **Phase 1 first, Phase 2 second.** Get OOB agents working on the real web map
  before touching LangGraph.
- **Prefer surgical edits** for prompts/configs — they get tuned constantly.
- **Surface errors verbosely in dev, gracefully in demo.** A blank panel is
  worse than an inline error; the `ErrorBoundary` exists for this.
