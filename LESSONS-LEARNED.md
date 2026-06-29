# Lessons Learned — ArcGIS AI Components Demo

Hard-won findings from building this app. Read this before you start; each item
here cost us real debugging time or nearly broke a live demo. Ordered roughly by
how much time it will save you.

> Companion docs: [`WALKTHROUGH.md`](./WALKTHROUGH.md) (step-by-step build),
> `CLAUDE.md` (full project context + every gotcha), `DEMO.md` (presentation run
> sheet).

---

## The meta-lesson: verify, don't infer

More than half the time we lost came from acting on plausible-but-wrong
assumptions. The discipline that fixed it:

- **Filenames in `node_modules/.../dist/components/` are not documentation.**
  They prove an element is compiled in, not that it's a supported public API. We
  assumed `arcgis-assistant-layer-styling-agent` was a mountable OOB agent
  because the file existed — it 404s on the docs site. Always confirm against
  `developers.arcgis.com` reference pages.
- **Verify versions/APIs against**, in priority order: (1) official Esri docs,
  (2) the package's shipped `dist/docs/` manifests, (3) `package.json` `exports`,
  (4) actually running it. Never from memory of an older SDK.
- **Ask when scope is ambiguous** rather than guessing. One targeted question is
  cheaper than shipping a wrong assumption.

---

## Package & build gotchas

### There is no `@arcgis/ai-components-react`
The AI components ship **only** as web components. Don't try to import React
wrappers for them — use the raw custom elements in JSX with `IntrinsicElements`
declarations. (The *map* components do have a React wrapper:
`@arcgis/map-components-react`. The AI ones don't.)

### SDK 5.x needs explicit `defineCustomElements()`
Lumina-based packages do **not** register elements on bare import. Without
calling `defineCustomElements()` from each package's `/loader`, you get
`Custom element "arcgis-map" not found` at first render. Call all three
(calcite, map, ai) before React mounts. Import each package's `main.css` too.

### Pin the real versions
All `@arcgis/*` packages aligned at `5.0.19` (the `@arcgis/core` 4.x line jumped
to 5.x for SDK 5.0). We initially pinned `^4.31.0` and `npm install` failed with
`ETARGET`. Run `npm view @arcgis/ai-components version` first.

### Promote `@esri/calcite-components` to a direct dep
It's a peer dependency that arrives transitively. Pin it explicitly (`^5.0.2`) so
installs don't drift it out from under the peer range.

### tsconfig project references
A referenced project (e.g. `tsconfig.node.json` for `vite.config.ts`) must have
`"composite": true` + an `outDir`, and **cannot** set `"noEmit": true`. Keep
`noEmit` on the main tsconfig only. Lint with `tsc -b`, not `tsc -b --noEmit`.

---

## Auth

### User auth, not app auth
The AI assistant calls are gated on the **signed-in user's** org entitlements, so
you need **OAuth 2.0 User authentication** (authorization code + PKCE). App auth
has no user context and won't work. You need only the **Client ID** — no secret
for a browser SPA.

### Named users only
Demo audiences must be named users of an org with AI assistants enabled. A
public/anonymous map in incognito will render but silently fail at the LLM call.

### Redirect URI must match exactly
`http://localhost:5173` (http, not https; matching Vite's port) must be
registered on the Developer credentials item, or sign-in returns a redirect
mismatch.

---

## Embeddings (the upstream long pole)

### Required, and via Item Details → Settings
The web map needs AI vector embeddings or the assistant errors with *"Embeddings
not found for this web map."* Generate them on the web map's **Item Details page
→ Settings tab** in ArcGIS Online — **not** AGO Assistant (outdated path).
Re-run if the schema changes.

### The "CORS error" that's really a 504
Embedding generation can fail with a generic *"There was an error generating AI
vector embeddings."* DevTools shows what looks like a CORS failure from
`aimodels.arcgis.com` (no `Access-Control-Allow-Origin`). **The real cause is an
HTTP 504 Gateway Time-out** — the pipeline exceeds the gateway's budget and the
504 bypasses the CORS middleware, so the browser blames CORS. Two symptoms, one
cause.

### Schema width, not scale, is the trigger
In our build, two national-scale reference layers behaved differently on the
same web map:
- A layer with a **wide composite-index schema** (hundreds of fields) — **failed**
  (504).
- A layer with a **narrow schema** (a handful of fields), same national scale —
  **succeeded**.

So prefer narrow-schema reference layers. Treat anything with hundreds of fields
or composite-index suffixes (e.g. `_HLR`, `_AFREQ`, `_ALR`) as suspect until
tested.

### Workaround: exclude, generate, re-add
Remove the offending layer, generate embeddings, then add it back. It renders on
the map for **visual** context but is **not** in the assistant's semantic index —
users can't ask about it. Trade conversational reach for visual presence.
Bisect with multiple layers by adding back one at a time.

---

## OOB agent behavior

### Only three public agents
Mountable, documented OOB agents: **`navigation`, `data-exploration`, `help`**.
(`feature-info` does not exist in 5.0.x despite older docs.) Plus
`arcgis-assistant-agent` (custom/Phase 2) and `arcgis-assistant-interrupt` (HIL).

### Schema introspection hallucinates — data queries don't
This is the sharpest, most demo-critical finding:

| Prompt class | Reliability |
|---|---|
| "list fields", "what can I ask?", "describe the data" | **Hallucinates** — returned two contradictory field lists in one turn, wrong field names, invented scales |
| filter / count / sum / rank / itemize against the layer | **Reliable & self-consistent** — totals reconcile to itemized breakdowns; IDs↔names stable across turns |

**Never** put schema-introspection prompts in a live demo. Verify schema only via
AGO **Data → Fields** or the token-authenticated REST endpoint — never the
assistant. To sanity-check a returned number, force a decomposition that must sum
to it.

### Cross-layer intersects pick the wrong query direction
"Which records are in &lt;big reference layer&gt;" makes the OOB agent submit the
reference layer's national-scale geometry as the spatial filter on your small
service → **413 Content Too Large**. The efficient direction (small record set as
the filter against the big layer) isn't chosen automatically. Mitigations:
1. **State/region-scope the prompt** ("…in &lt;state&gt;…") — bounds the reference
   query. Cheapest fix.
2. **Pre-compute the attribute** (e.g. an `in_<condition>` boolean) on your
   service and answer as a plain attribute query. Production pattern.
3. **Phase 2 custom agent** that submits the query in the right direction.

### Cross-category comparison silently degrades
Single-group aggregates work ("average &lt;metric&gt; for &lt;one group&gt;"). Asking
it to **compare** two groups in one turn collapses to one overall number. This is
an agent-shaped gap — no layer fixes it; it's Phase 2 territory.

### The orchestrator is non-deterministic
Don't promise an exec the same prompt always answers the same way. Use
`suggestedPrompts` + `entryMessage` to set expectations and the chips to keep to
verified phrasings.

---

## Prompt engineering

### Pointed beats broad
*Pointed, single-subject* prompts are reliable; *broad sweeps* degrade.
- ✅ "Is &lt;named record&gt; in &lt;condition&gt;? Give the specific attributes." →
  exact, attributable answer.
- ❌ "Which records are affected by &lt;condition&gt;" (broad, unscoped) → vague
  feature count, no real intersection assertion.

### Choose demo prompts for punchy positives
A correct "no matches" answer reads poorly in front of an exec. Pick a scope
(state/region/category) you've verified returns a clean positive over one whose
honest answer is technically-correct-but-muddy.

### Match prompts to verified data ranges
Use the **actual** data breaks from your layer, not theoretical scales (e.g. if
your metric runs 1.8–6.3 in the data, don't write prompts around a 1–10 scale).
If a tier/category is a **stored field**, filter on it directly rather than
recomputing from numeric breaks.

---

## Layer strategy

**Add a reference layer only if it answers a question your existing fields
can't.** If your primary layer already encodes the drivers of your key metric as
attributes, adding reference layers that merely restate those drivers just
duplicates signal and adds embedding-pipeline risk. A reference layer earns its
place when it provides an **orthogonal** dimension not in your schema (e.g. a
regulatory/hazard overlay).

And critically: the gaps that most limit these demos (schema introspection,
cross-category comparison) are **agent-shaped, not layer-shaped**. No layer
closes them — Phase 2 does. Don't over-invest in layers expecting them to fix
reasoning limits.

---

## Workflow / dev-loop notes

- **Surface errors verbosely in dev, gracefully in demo.** An `ErrorBoundary`
  that prints the stack beats a blank screen.
- **The Vite dev server doesn't survive long pauses** when launched from an
  automation wrapper. For demo day, run `npm run dev` in your own terminal and
  leave it open. If the browser says "site can't be reached" (not a cache issue),
  the server's gone — restart it. `Ctrl+Shift+R` only helps when it's actually up.
- **Keep a `.env.local`** (gitignored) and an `.env.example` (committed, no
  secrets). OAuth client IDs aren't secret like API keys, but keep them out of
  git anyway.

---

## The one-paragraph summary

Build on Vite/npm from day one (custom agents can't run from CDN). Pin all
`@arcgis/*` at the real `5.0.x`, add calcite as a direct dep, and there's no
`ai-components-react`. Call `defineCustomElements()` from each `/loader` or
nothing renders. Set `referenceElement`/`suggestedPrompts`/`entryMessage`
imperatively, pointing at the real `<arcgis-map>`. Generate embeddings via Item
Details → Settings, and keep wide-schema layers out of that step (504s). Mount
only the three public OOB agents. Write pointed, data-querying, state-scoped
prompts and verify their output reconciles — never demo schema-introspection
prompts. Treat reasoning gaps as Phase 2 (custom LangGraph agent), not as
missing layers.
