# Developer setup — Register the app & create OAuth credentials in ArcGIS Online

**Audience:** developers building the JavaScript SDK app (this repo). To sign
users in, the app needs a **Client ID** from an **OAuth credentials** item you
create in ArcGIS Online. This is a one-time, ArcGIS-Online-side task — no code.

> The no-code Instant Apps **Data Explorer** path does **not** need this — ArcGIS
> Online handles sign-in for hosted Instant Apps. These credentials are only for
> the SDK app you build and host yourself. References are Esri-domain; see
> [References](#references).

---

## What you're creating and why

User authentication uses **OAuth 2.0**. Per Esri, *"OAuth credentials are an
item that contains parameters required to implement user authentication … 
including a client_id, client_secret, and redirect URIs."* Your browser app uses
the **`client_id`** (and a registered **redirect URI**) to start the sign-in
flow — it does **not** use the client secret (the SDK uses PKCE for SPAs).

Use **user authentication**, not app authentication: the assistant's LLM/AI
calls are made on behalf of — and gated on — the **signed-in user** and their
org's entitlements (AI assistants enabled). App auth has no user context.

---

## Prerequisite

Per Esri, *"You need an ArcGIS account with a user type of Creator or higher"* to
create the credentials item. (Your end users — the people signing in to the app —
can be any named member with access to the web map; see `ACTIVITY-2-AUTH.md`.)

---

## Steps (ArcGIS Online)

1. **Sign in** to ArcGIS Online (`https://www.arcgis.com`, or your org URL).
2. Go to **Content → My Content → New item**, and select **Developer
   credentials**. *(Esri: "Click Content > My content > New item and select
   Developer credentials.")*
3. If prompted to choose a credential type, select **OAuth credentials** (OAuth
   2.0). Choose the **user authentication** flow.
4. **Add a redirect URL.** A redirect URL is **required** for user
   authentication — it's where ArcGIS sends the user back after they sign in.
   For this app:
   - **Local dev:** add **`http://localhost:5173`** — and, to be safe, also add
     **`http://localhost:5173/`** (with trailing slash). Registering both avoids
     a redirect-mismatch error from a slash difference.
   - The dev server is pinned to port **5173** (`vite.config.ts` sets
     `strictPort: true`), so the redirect URL is stable. If you see "port in
     use," free port 5173 rather than letting it change — a different port won't
     match the registered redirect.
   - **Deployed app:** add your site's origin too, e.g.
     `https://your-app.example.com`.
   - The value must **match exactly** (scheme, host, port).
5. **Create** the item, then open its page and **copy the Client ID** (this is
   the `client_id` / "App ID"). You do **not** need the client secret for a
   browser app.
6. **Put the Client ID in the app:** in `.env.local`, set
   `VITE_ARCGIS_OAUTH_APP_ID=<your client id>`. (`lib/arcgis.ts` passes it to
   `OAuthInfo`; see `WALKTHROUGH.md` Step 3 and `CLAUDE.md` §8.)

### Editing redirect URLs later

Per Esri, redirect URLs *"can be added … during the creation process, or any
time through the Settings panel of the credentials item page. Go to the item
page of the credentials and click **Settings > Application**. Under **Redirect
URLs**, add the URL…"* Use this when you deploy to a new origin.

---

## How the app uses it (this repo)

```
.env.local:  VITE_ARCGIS_OAUTH_APP_ID = <client id>
             VITE_PORTAL_URL          = https://www.arcgis.com  (or your org URL — see ACTIVITY-2-AUTH.md)
                       │
                       ▼
lib/arcgis.ts:  new OAuthInfo({ appId: <client id>, portalUrl: <portal> })
                IdentityManager.registerOAuthInfos([...])
                       │
                       ▼
AuthGate → IdentityManager challenges the user → redirect back to the
registered redirect URL (http://localhost:5173) → signed in.
```

The redirect URL you register in step 4 **must** equal the origin the app runs
on, or sign-in fails with a redirect-mismatch error.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `redirect_uri` mismatch / "not a valid redirect" | The app's origin isn't registered on the credentials item. Add it under Settings > Application > Redirect URLs (exact match). |
| First prompt to the assistant errors immediately | Using app auth instead of user auth, or the signed-in user's org doesn't have AI assistants enabled. |
| "Invalid client_id" | Wrong value in `VITE_ARCGIS_OAUTH_APP_ID`, or you copied an API-key item's id instead of an OAuth credentials Client ID. |
| Can't create the credentials item | Your account isn't Creator or higher. |

---

## References

Esri-domain sources only:

- OAuth credentials (for user authentication) — <https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/oauth-credentials-user/>
- Tutorial: Create OAuth credentials for user authentication — <https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/tutorials/create-oauth-credentials-user-auth/>
- Implement user authentication (JS Maps SDK) — <https://developers.arcgis.com/javascript/latest/tutorials/implement-user-authentication/>
- OAuthInfo (API reference) — <https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-OAuthInfo.html>
