# Workshop guide — build the app, step by step

A **follow-along** guide for attendees. Go at your own pace: each step ends with
a **✅ Checkpoint** — don't move on until you see it. If a step fails, see
[Troubleshooting](#troubleshooting) at the bottom.

> **Facilitators:** illustrate each step with a **static screenshot** (or a
> *pausable* MP4) — not a looping GIF. Attendees need to stop on individual
> steps. Drop images at the `📸` markers below.

---

## Before you start (you should already have these)

- A **named ArcGIS Online account**, **Creator** user type or higher, that can
  sign in to your organization (most of you use **SAML / enterprise login**).
- The **web map you created** in the earlier exercise, with **metadata + AI
  vector embeddings** already generated (from the presentation portion).
- **Visual Studio** open, with **Node.js 18+** and **GitHub Copilot** available.
- Your **organization URL key** — the `xxxx` in `https://xxxx.maps.arcgis.com`
  (ArcGIS Online → Organization → Settings → General).

---

## Step 1 — Register the app (get a Client ID)

The app signs you in using an **OAuth credentials** item from ArcGIS Online.

1. Sign in to ArcGIS Online. Go to **Content → New item → Developer credentials**.
2. **Select credential type:** choose **OAuth 2.0 credentials — For user
   authentication** (the left option). Click **Next**.
3. **Redirect URLs:** add `http://localhost:5173`, then click **+ Add** and also
   add `http://localhost:5173/` (with the trailing slash).
4. **Application environment:** choose **Browser**. Leave the **URL** field blank.
   Click **Next**.
5. Give it a **title** (e.g., "AI Components Workshop") and **Create** it.
6. On the item page, **copy the Client ID**. (You do **not** need a client
   secret.)

> 📸 *Screenshot: the "Select credential type" dialog with OAuth 2.0 / user
> authentication selected; and the Redirect URLs panel.*

**✅ Checkpoint:** you have a **Client ID** copied to your clipboard/notes.

---

## Step 2 — Note your web map ID and org URL

1. Open your **web map's item page** in ArcGIS Online.
2. From the browser address bar, copy the **item ID** — the value after `id=`
   (e.g. `…/home/item.html?id=`**`abc123…`**).
3. Note your **org URL**: `https://<your-org-key>.maps.arcgis.com`.

**✅ Checkpoint:** you have your **web map item ID** and your **org URL**.

---

## Step 3 — Get the code open in Visual Studio

1. Open a terminal and clone the repo (or use Visual Studio's **Clone a
   repository**):
   ```bash
   git clone https://github.com/CodeHeistPy/arcgis-ai-components-demo.git
   ```
2. In Visual Studio: **File → Open → Folder…** and pick the cloned
   `arcgis-ai-components-demo` folder. *(It's a folder-based project — there's no
   `.sln` to open.)*

> 📸 *Screenshot: File → Open → Folder in Visual Studio.*

**✅ Checkpoint:** the project files show in Visual Studio's Solution Explorer /
folder view.

---

## Step 4 — Open the terminal and check Node

1. In Visual Studio: **View → Terminal**.
2. Run:
   ```bash
   node -v
   ```

**✅ Checkpoint:** the version printed is **v18** or higher. *(If it's lower, or
"not recognized," see Troubleshooting.)*

---

## Step 5 — Install dependencies

In the same terminal:
```bash
npm install
```

**✅ Checkpoint:** it finishes with something like *"added N packages"* and **no
red error text**. (Deprecation *warnings* are fine.)

---

## Step 6 — Configure your `.env.local`

1. In the terminal:
   ```bash
   cp .env.example .env.local
   ```
2. Open **`.env.local`** and set these three values:
   ```
   VITE_ARCGIS_OAUTH_APP_ID=<the Client ID from Step 1>
   VITE_WEBMAP_ID=<your web map item ID from Step 2>
   VITE_PORTAL_URL=https://<your-org-key>.maps.arcgis.com
   ```
   > **SAML users (most of you):** `VITE_PORTAL_URL` **must** be your org URL —
   > that's what routes you to your organization's sign-in. Leave
   > `VITE_FEATURE_SERVICE_URL` blank (not needed).
3. **Save** the file.

> 📸 *Screenshot: `.env.local` with the three values filled (Client ID blurred).*

**✅ Checkpoint:** `.env.local` has all three values filled and is saved.

---

## Step 7 — Run the app

In the terminal:
```bash
npm run dev
```
Then open **http://localhost:5173** in your browser.

**✅ Checkpoint:** you see the **"Sign in with ArcGIS"** screen (the app's
sign-in wall). Leave `npm run dev` running.

---

## Step 8 — Sign in

1. Click **Sign in with ArcGIS**.
2. **SAML users:** you'll be redirected to your **organization's sign-in page** —
   enter your enterprise credentials there. You'll land back at
   `http://localhost:5173`.

> 📸 *Screenshot: the "Request for Permission / Allow" consent screen.*

**✅ Checkpoint:** the **map loads on the left** and the **Assistant panel loads
on the right**.

---

## Step 9 — Ask the assistant

Click a suggested prompt, or type one. These are known to work well:

1. *"Show me the high-priority records."* (attribute filter)
2. *"What's the average \<metric\> for \<category\>?"* (single-group stat)
3. *"Which \<high-priority records\> also \<second condition\>?"* (two attributes)
4. *"Which \<records\> in \<state\> are in \<reference layer\>?"* (cross-layer —
   **keep it scoped to a state**)

> Replace the placeholders with your data's real fields/values.

**✅ Checkpoint:** the assistant returns a real answer about **your** data (a
filtered set, a number, or named features).

> ⚠️ **Avoid** (these fail or mislead — see `CLAUDE.md` §9): "list the fields" /
> "what can I ask" (makes up fields), comparing two categories in one question,
> unbounded cross-layer ("within 10 miles of \<national layer\>"), directions/
> routing, charts, or the assistant's own auto-suggested example queries.

---

## Step 10 (optional) — Make a change with Copilot

You don't need to know JavaScript. With GitHub Copilot enabled (Tools → Options →
GitHub → Copilot → *Enable custom instructions*), ask Copilot Chat things like:

- *"Add a suggested prompt about \<topic\> to this scenario."*
- *"Explain what ScenarioShell does."*

Copilot reads `.github/copilot-instructions.md`, so its suggestions match this
SDK. Save, and the running app hot-reloads.

**✅ Checkpoint:** your change shows up in the app at `http://localhost:5173`.

---

## Troubleshooting

| What you see | Fix |
|---|---|
| Browser: "site can't be reached" | `npm run dev` isn't running, or the port isn't 5173. Re-run it; if it says port in use, free 5173 (don't let it use a different port — sign-in needs 5173). |
| `node -v` < 18 or "not recognized" | Install Node 18+; if Visual Studio bundles an older Node, use a system Node 18+ and reopen the folder. |
| Blank screen / "Custom element not found" | Hard-refresh (Ctrl+Shift+R). If it persists, tell the facilitator. |
| Redirect / "not a valid redirect" after sign-in | The redirect URL on your OAuth item must be `http://localhost:5173` (Step 1.3). Add the trailing-slash version too. |
| SAML: lands on the generic ArcGIS form, not your org | `VITE_PORTAL_URL` isn't your org URL — fix Step 6 and restart `npm run dev`. |
| "Embeddings not found for this web map" | The web map needs embeddings generated (presentation step). Re-do that on your web map. |
| Assistant loads but errors on the first prompt | Your org may not have AI assistants enabled, or you're not a named user. |

Full context and every known gotcha: **`CLAUDE.md`**. Deeper build detail:
**`WALKTHROUGH.md`**.
