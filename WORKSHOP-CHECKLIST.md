# Workshop facilitator checklist

A pre-flight list for running this repo as a hands-on workshop. The **repo** is
ready to clone; these items are the environment/account/web-map pieces that live
outside the repo and must be true for attendees to succeed.

## Lab machines (per machine)
- [ ] **Node.js 18+** installed — verify `node -v` (in the **Visual Studio
      terminal** specifically; VS may bundle an older Node).
- [ ] **Git** installed (`git --version`) so attendees can clone.
- [ ] **Visual Studio** with **GitHub Copilot** licensed and signed in.
- [ ] Copilot **custom instructions enabled**: Tools → Options → GitHub →
      Copilot → "Enable custom instructions … from
      `.github/copilot-instructions.md`". (Confirms the assistant is repo-aware.)

## Attendee ArcGIS accounts
- [ ] **Named user** in an ArcGIS Online org (no trial/public/anonymous).
- [ ] **Creator user type or higher** (needed to register an OAuth credentials
      item — see `DEV-OAUTH-CREDENTIALS.md`).
- [ ] Knows whether they're **SAML/enterprise** (most are) vs built-in, and
      knows their **org URL key** (`https://<key>.maps.arcgis.com`).

## Org settings (admin)
- [ ] **AI assistants enabled**.
- [ ] **Beta apps not blocked**.

## Web map (created/prepped during the presentation portion)
- [ ] Layers have **good metadata** — field aliases + descriptions + data types.
- [ ] **AI vector embeddings generated** on the web map (Item Details →
      Settings), *after* metadata. Re-generate if the schema/metadata changed.

## Per attendee, before `npm run dev`
- [ ] Registered an **OAuth credentials item** (user auth, Browser, redirect
      `http://localhost:5173` and `http://localhost:5173/`) → copied the
      **Client ID**.
- [ ] Created **`.env.local`** from `.env.example` with:
      `VITE_ARCGIS_OAUTH_APP_ID` (Client ID),
      `VITE_WEBMAP_ID` (their web map),
      `VITE_PORTAL_URL` (their **org URL** if SAML).

## Smoke test (facilitator, morning-of)
- [ ] Clone fresh → open folder in VS → `npm install` → `npm run dev` →
      `http://localhost:5173` → sign in → a suggested prompt returns data.

See `README.md` and `WALKTHROUGH.md` for the full detail behind each item.
