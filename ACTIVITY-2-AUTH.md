# Activity #2 — Connecting to your ArcGIS Online org: SAML vs built-in users

**Goal:** understand how this app signs a user in to an ArcGIS Online
organization, and the difference between connecting with a **built-in (ArcGIS)
account** and a **SAML (organization-specific / "enterprise") login**.

> All references in this document are to official Esri sources
> (`developers.arcgis.com`, `doc.arcgis.com`). See [References](#references).

> **Activity #2 also has a no-code path** for GIS users without developer
> skills — the Instant Apps **Data Explorer** template. See
> [`ACTIVITY-2-DATA-EXPLORER.md`](./ACTIVITY-2-DATA-EXPLORER.md).

---

## The one big idea

**Both account types use the same OAuth 2.0 user authentication flow**, and the
**app code is identical for both.** The app registers an `OAuthInfo` with the
`IdentityManager`; when a secure resource is hit, the SDK challenges the user to
sign in (see Esri's *Implement user authentication* tutorial).

What differs is **(a) the portal URL you point the app at** and **(b) the
sign-in experience the user sees.** That's the whole of Activity #2.

---

## Background — what the two login types are (per Esri)

- **Built-in account (organizational account):** the username and password are
  created and managed in ArcGIS Online. The organization's password policy
  applies. Sign-in uses token-based OAuth 2.0, with the user entering their
  ArcGIS credentials directly on the ArcGIS sign-in page.
- **SAML login (organization-specific login, *previously called "enterprise
  login"*):** per Esri, *"allows members of your organization to sign in to
  ArcGIS Online using the same logins they use to access your organization's
  internal systems."* The member is **redirected to the organization's identity
  provider** (the "login manager") to enter their enterprise username/password —
  ArcGIS Online never sees the password, and the org's ArcGIS password policy
  does not apply.

Both are **named users** of the org. (This app — and the AI components in
general — requires a named user with AI assistants enabled; that requirement is
the same for built-in and SAML members.)

---

## Side-by-side

| | Built-in account | SAML / organization-specific login |
|---|---|---|
| Where credentials live | In ArcGIS Online | In your org's identity provider (IdP) |
| Where the user types their password | ArcGIS sign-in page | Redirected to the org's IdP login page |
| ArcGIS password policy applies? | Yes | No (the IdP governs it) |
| Username format | e.g. `jsmith` | Includes the **org URL key as a suffix**, e.g. `jsmith@EXAMPLEORG` |
| OAuth 2.0 user-auth flow | Same | Same |
| App code (`OAuthInfo` + `IdentityManager`) | Same | Same |

---

## What YOU configure in this app

The only knob that matters is the **portal URL**, set via `VITE_PORTAL_URL`
in `.env.local` and applied in `src/lib/arcgis.ts` (to both
`esriConfig.portalUrl` and `OAuthInfo.portalUrl`).

`OAuthInfo.portalUrl` accepts either the generic ArcGIS Online URL or an
**organization-specific URL** (Esri: *"an organization URL can be specified …
e.g., `https://yourorg.maps.arcgis.com`"*).

| `VITE_PORTAL_URL` value | Sign-in experience |
|---|---|
| `https://www.arcgis.com` (default) | Generic ArcGIS sign-in. **Built-in** users sign in directly. **SAML** users must pick their organization / choose their enterprise login first, then get redirected to the IdP. Works for both, but adds a step for SAML members. |
| `https://<your-org-key>.maps.arcgis.com` | Targets **your org** directly. If the org is configured for SAML, members are routed to your IdP for sign-in. The cleanest experience when your org uses SAML. |

> Find your org URL key in ArcGIS Online → **Organization → Settings → General**
> (the "URL" / short name). The org URL is `https://<key>.maps.arcgis.com`.

### Try it

1. **Built-in user:** set `VITE_PORTAL_URL=https://www.arcgis.com` (or your org
   URL), `npm run dev`, click **Sign in with ArcGIS**, enter ArcGIS credentials.
2. **SAML user:** set `VITE_PORTAL_URL=https://<your-org-key>.maps.arcgis.com`,
   `npm run dev`, click **Sign in with ArcGIS** — you should be redirected to
   your organization's identity provider. After authenticating there, you land
   back at `http://localhost:5173`, signed in.

No code changes between the two — only the env value.

---

## Prerequisites that apply to BOTH login types

- The user is a **member of the target org** (invited/added) — see Esri's
  *Invite and add members* and *Manage logins*.
- **AI assistants enabled** and **beta apps not blocked** in the org settings.
- The **OAuth Developer credentials** item uses **user authentication**, with
  `http://localhost:5173` registered as a redirect URI. (App authentication has
  no user context and will not work for the assistant — see `CLAUDE.md` §9.)

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| SAML user lands on the generic ArcGIS form instead of your IdP | `VITE_PORTAL_URL` is `www.arcgis.com`; set it to your org URL `https://<key>.maps.arcgis.com`. |
| "You are not a member of this organization" after IdP sign-in | The SAML member isn't provisioned/invited into the target org, or you're pointing at the wrong org URL. |
| Redirect loop / mismatch error | `http://localhost:5173` isn't a registered redirect URI on the credentials item. |
| Built-in user can't sign in to an org URL | The account isn't a member of *that* org; use the org they belong to, or `www.arcgis.com`. |
| Signed in, but the assistant errors on first prompt | Org-level: AI assistants not enabled, or the user isn't a named user. Same for both login types. |

---

## References

Esri-domain sources only:

- OAuthInfo (class & `portalUrl`) — <https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-OAuthInfo.html>
- Implement user authentication (tutorial) — <https://developers.arcgis.com/javascript/latest/tutorials/implement-user-authentication/>
- Authentication and secure resources — <https://developers.arcgis.com/javascript/latest/secure-resources/>
- ArcGIS organization portals (org URL) — <https://developers.arcgis.com/javascript/latest/arcgis-organization-portals/>
- User authentication with ArcGIS APIs — <https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/arcgis-apis/>
- Set up SAML logins — <https://doc.arcgis.com/en/arcgis-online/administer/saml-logins.htm>
- Manage logins (member login types) — <https://doc.arcgis.com/en/arcgis-online/administer/manage-logins.htm>
