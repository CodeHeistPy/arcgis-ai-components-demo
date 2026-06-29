# ArcGIS AI Components Demo (template)

A plug-and-play **Vite + React + TypeScript** template for building an agentic
web app with the **AI components (beta) in the ArcGIS Maps SDK for JavaScript
5.0**. It puts an `<arcgis-assistant>` chat panel beside an `<arcgis-map>`,
wired to the out-of-the-box **Navigation**, **Data Exploration**, and **Help**
agents — so users can ask natural-language questions against your own web map.

Point it at *your* web map and data: set a few env vars, edit one scenario
config, and tune the prompts. No code changes required to get a working demo.

```
Your data  ──►  ArcGIS Online feature layer  ──►  Web map (+ embeddings)  ──►  THIS APP
```

> **Status:** Phase 1 — OOB agents only. A Phase 2 custom LangGraph agent (for
> portfolio-style reasoning the OOB agents can't do) is scoped in `CLAUDE.md`
> §6 but not implemented in the template.

## The GIS side comes first (and it's most of the work)

**Read this even if you're a developer, not a GIS analyst.** The AI components
are only as good as the data behind them. The assistant's ability to find the
right layer and field for a question comes almost entirely from **ArcGIS Online
configuration, not app code.** Two GIS-side steps are mandatory, *in this order*:

### Step A — Populate item & field metadata

The agents reason over your metadata. Per Esri's
[web map setup guide](https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/),
give each feature layer:

- **A meaningful layer name and description** — so the agent understands the
  layer's purpose.
- **Descriptive field aliases AND field descriptions** for every field a user
  might ask about — set these in ArcGIS Online → the layer item's **Data →
  Fields** view. A raw field like `pct_cmplt` means nothing to the model; an
  alias *"Percent Complete"* plus a one-line description does.

Esri's guidance, verbatim: *use "layers with good metadata for the best
experience."* Cryptic field names → the agent picks the wrong field or misses
it. This is the single highest-leverage thing you can do for answer quality.

### Step B — Generate AI vector embeddings on the web map

ArcGIS Online → open the **web map** item → **Settings** → scroll to **Manage AI
vector embeddings** → **Generate Embeddings**. This builds a semantic index of
your **layer titles and field metadata** so the agent can pick the most relevant
layer/field before calling the LLM.

- **Do this AFTER Step A.** Embeddings capture your metadata *as it is at
  generation time* — so populate metadata first, then embed. **Re-generate
  whenever you change field metadata or the schema.**
- Without embeddings the assistant errors with *"Embeddings not found for this
  web map."*
- ⚠️ Generation can fail on **wide-schema** layers (hundreds of fields) with a
  504 that *looks* like a CORS error — see `CLAUDE.md` §9.

> **Mental model for devs:** the app in this repo is the easy 20%. The 80% that
> determines whether the demo impresses anyone is the GIS prep above. Budget
> time for it.

## Then make the app yours (3 steps)

1. **Set env vars** — `cp .env.example .env.local` and fill in your OAuth client
   ID and web map item ID (see `.env.example` for what each is).
2. **Edit the scenario** — update `src/scenarios/scenario-01-sample/config.ts`
   (title/subtitle) and `prompts.ts` (entry message + suggested prompts) to fit
   your data.
3. **Run it** (below), sign in, and try your prompts.

## Prerequisites (for you and your demo audience)

- A signed-in **named user** of an ArcGIS Online org (no trial, no public/anon).
- An **OAuth 2.0 Developer credentials** item (user auth) with
  `http://localhost:5173` as a redirect URI.
- **AI assistants enabled** in the org settings.
- **Beta apps not blocked** in the org settings.
- A **web map whose layers have good metadata, with embeddings generated** —
  see "The GIS side comes first" above.

## Run

```bash
npm install
cp .env.example .env.local      # then fill in your values
npm run dev                     # → http://localhost:5173
```

Sign in as a named user, then try the suggested prompts.

## Writing good prompts

The OOB data-exploration agent reliably handles **query / statistics /
spatial-proximity / filter** — not visualization, symbology, or external data.
Prompts that work well (templates live in `prompts.ts`):

1. Single-attribute filter — *"Show me the &lt;high-priority&gt; &lt;records&gt;."*
2. Single-group aggregate — *"What's the average &lt;metric&gt; for &lt;group&gt;?"*
3. Multi-attribute combo — *"Which &lt;records&gt; have &lt;A&gt; and &lt;B&gt;?"*
4. **State/region-scoped** cross-layer intersect (unbounded versions 413 — see
   `CLAUDE.md` §9).

**Avoid** (Phase 2 candidates): schema introspection (*"list fields"* —
hallucinates), cross-category comparison (silently degrades), unbounded
cross-layer queries, charts, forecasts, email, user location. More in
`CLAUDE.md` §5/§9.

## Project layout

```
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── ScenarioShell.tsx     map + assistant
│   ├── ScenarioHeader.tsx    title bar (future: scenario switcher)
│   ├── AuthGate.tsx          OAuth sign-in wall
│   └── ErrorBoundary.tsx     surfaces render errors instead of a blank screen
├── scenarios/
│   └── scenario-01-sample/   per-scenario config — copy this folder to add more
│       ├── config.ts
│       └── prompts.ts
└── lib/
    ├── arcgis.ts             SDK init + element registration + OAuth helpers
    └── agents.ts             ScenarioConfig type
```

## Documentation

| File | What it's for |
|---|---|
| `WALKTHROUGH.md` | Step-by-step build from scratch |
| `LESSONS-LEARNED.md` | Gotchas and guidelines (read before you start) |
| `DEMO.md` | A run-sheet template for presenting it live |
| `ACTIVITY-2-AUTH.md` | Connecting to your org — **SAML vs built-in** users |
| `ACTIVITY-2-DATA-EXPLORER.md` | **No-code** path — the Instant Apps Data Explorer template for GIS users |
| `CLAUDE.md` | Full project context + every known gotcha |
| `docs/slides/` | A regenerable slide deck of the whole story |

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Embeddings not found for this web map" | Generate embeddings via Item Details → Settings. |
| "Couldn't find that layer" | Same — embeddings missing or stale (re-run after schema changes). |
| Assistant loads but doesn't respond | `referenceElement` isn't pointing at a real `<arcgis-map>` element. |
| `Custom element "arcgis-map" not found` | `defineCustomElements()` not called — see `lib/arcgis.ts`. |
| Sign-in errors immediately | Wrong OAuth scopes, or `http://localhost:5173` not a registered redirect URI. |
| Blank chat panel | AI assistants disabled in the org, or signed in as a non-named user. |

More gotchas in `CLAUDE.md` §9.

## License

MIT — see [`LICENSE`](./LICENSE). Free to use, modify, and share, including for
your own workshops and demos.
