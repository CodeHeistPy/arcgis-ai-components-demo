# Activity #2 (no-code path) — ArcGIS Instant Apps Data Explorer

**Goal:** stand up the *same* conversational experience as this JavaScript SDK
app — natural-language questions against a web map — **without writing code**,
using the **ArcGIS Instant Apps "Data Explorer" (beta)** template. This is the
path for **GIS users who don't have developer skills.**

> This doc is self-contained — it's meant to be handed out or dropped into a
> Claude Project's knowledge. All references are Esri-domain (`doc.arcgis.com`,
> `developers.arcgis.com`); see [References](#references).

---

## Where this fits

The dev path (this repo) and the no-code path (Data Explorer) are **two front
ends over the same prepared web map.** Both depend on the GIS work you do first:

```
Populate metadata (field descriptions + data types)  ──►  Generate vector embeddings
                          │
            ┌─────────────┴─────────────┐
            ▼                             ▼
   JavaScript SDK app            Instant Apps Data Explorer
   (this repo — devs)            (no-code template — GIS users)
```

If you completed the GIS prep from Activity #1 (item metadata → embeddings),
**you are already most of the way to a Data Explorer app.** No code, no Vite, no
OAuth credentials to register.

---

## Prerequisites (the same GIS prep — this is the point)

Data Explorer's natural-language features run on the same two things the SDK app
needs:

1. **Thorough metadata.** Per Esri, *"Data Explorer (beta)'s use of natural
   language requires thorough metadata, including field descriptions and field
   data types."* Author these on the layer (e.g., the item's **Data → Fields**
   view) — exactly the Activity #1 metadata step.
2. **AI vector embeddings on the web map.** Per Esri, *"web maps must have
   embeddings stored as a resource within the web map item, which can be
   generated in the map's item page settings or within the Data Explorer (beta)
   app configuration."* And: *"embeddings should be updated following any changes
   to the data or field descriptions."*

Plus the org-level basics (same as the SDK app): a **named user**, **AI
assistants enabled**, and **beta apps not blocked**. SAML and built-in users both
work — see `ACTIVITY-2-AUTH.md`.

> **Key takeaway for non-devs:** you don't escape the metadata + embeddings work
> by going no-code. That prep *is* the project; Data Explorer just removes the
> code on top of it.

---

## Get going — step by step

1. **Prep the web map** (if not already done in Activity #1): populate field
   descriptions and data types, then generate embeddings. Embeddings can be
   generated on the **web map item page → Settings**, *or* from within the Data
   Explorer app configuration (Esri docs above). Re-generate after any data or
   field-description change.
2. **Open ArcGIS Instant Apps** and start from your web map — open Instant Apps
   from the map item, or browse templates and use **Choose map** to pick it.
3. **Choose the "Data Explorer" (beta) template.**
4. **Create the app** — from the preview, click **Choose**, give it a title and
   tags, pick a folder, and click **Create app**.
5. **Configure** (the config panel; drafts auto-save and the preview refreshes):
   - **Chat header**, **Chat description**, and a dismissible **Welcome
     message** — frame the app for end users (the no-code equivalent of the
     SDK app's `entryMessage`).
   - **Sample questions** — *"Add up to five sample questions to help app users
     get started"* (the equivalent of the SDK app's `suggestedPrompts`).
   - **Help panel** — *"Include a panel that provides preset instructions for
     using the app."*
   - **Standard controls** — Home button and zoom, a legend, and map/data
     search.
   - Use the **Views menu** to check tablet/mobile layouts.
6. **Publish** the app, then **Share** it (owner / organization / everyone) and
   **Launch** to test in a new window. Edit the item's details afterward so
   others can discover it.

---

## How it maps to the SDK app (this repo)

| SDK app (code) | Data Explorer (no-code) |
|---|---|
| Mount `<arcgis-assistant>` + `arcgis-assistant-data-exploration-agent` | Built in — the template wires the assistant for you |
| `entryMessage` (set in `prompts.ts`) | Welcome message / chat description |
| `suggestedPrompts` array | Sample questions (up to 5) |
| `referenceElement` → `<arcgis-map item-id>` | The web map you select for the app |
| Register OAuth, `IdentityManager`, AuthGate | Handled by ArcGIS Online sign-in (no credentials item) |
| Web map metadata + embeddings | **Same requirement — unchanged** |

---

## Same data, same limits

Data Explorer is driven by the same agent technology and the same embeddings, so
the prompt guidance from the SDK work carries over:

- **Metadata quality drives answer quality** — descriptive field aliases,
  descriptions, and correct data types matter more than anything else.
- Write **pointed, single-subject** sample questions (filter / statistics /
  spatial-proximity). Broad sweeps degrade.
- **Don't rely on schema-introspection prompts** ("list the fields") — verify
  schema from the item's **Data → Fields**, not the chat.
- **Re-generate embeddings** after metadata or schema changes, or answers go
  stale.

---

## When to choose which path

| Choose **Data Explorer (no-code)** when… | Choose the **SDK app (code)** when… |
|---|---|
| The audience is GIS staff without dev skills | You have/contract developer skills |
| You want it live in minutes, configured not coded | You need custom UI, branding, or layout |
| OOB query/stats/filter is enough | You need a **custom (Phase 2) agent** for reasoning the OOB agent can't do (cross-category comparison, correct-direction cross-layer queries — see `CLAUDE.md` §6) |
| You don't want to manage OAuth credentials/hosting | You're embedding the assistant in a larger app |

Both are valid Activity #2 outcomes. The no-code path is the fastest way for a
GIS user to prove the value; the SDK path is where you go when you outgrow the
template.

---

## References

Esri-domain sources only:

- Data Explorer overview — <https://doc.arcgis.com/en/instant-apps/latest/get-started/data-explorer-overview.htm>
- Create a Data Explorer app — <https://doc.arcgis.com/en/instant-apps/latest/create-apps/data-explorer.htm>
- Instant Apps: preview and publish — <https://doc.arcgis.com/en/instant-apps/latest/create-apps/preview-and-publish.htm>
- AI web map setup / embeddings & metadata — <https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/>
