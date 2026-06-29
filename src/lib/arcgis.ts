import esriConfig from "@arcgis/core/config";
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import OAuthInfo from "@arcgis/core/identity/OAuthInfo";

// Register custom elements. SDK 5.x is Lumina-based — the bare-package
// imports (e.g. `import "@arcgis/map-components"`) do NOT register elements;
// the `/loader` entry point exports a `defineCustomElements()` function that
// must be called explicitly. Without these calls, the React wrappers throw
// "Custom element 'arcgis-map' not found" at first render.
import { defineCustomElements as defineCalciteElements } from "@esri/calcite-components/loader";
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/loader";
import { defineCustomElements as defineAiElements } from "@arcgis/ai-components/loader";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "https://www.arcgis.com";
const OAUTH_APP_ID = import.meta.env.VITE_ARCGIS_OAUTH_APP_ID;

let initialized = false;

/**
 * Configure the JS Maps SDK portal + register OAuth.
 *
 * Idempotent — safe to call under React StrictMode's double-invoke, and safe
 * to call before/after sign-in.
 */
export function initArcgis(): void {
  if (initialized) return;
  initialized = true;

  // Register custom elements before React mounts so the React wrappers find
  // them at first render. defineCustomElements is idempotent under the hood
  // (Lumina guards against re-registration) but we still gate on `initialized`.
  defineCalciteElements();
  defineMapElements();
  defineAiElements();

  esriConfig.portalUrl = PORTAL_URL;

  if (!OAUTH_APP_ID) {
    // Don't throw — let AuthGate render a helpful message instead of a blank
    // white screen during a live demo.
    // eslint-disable-next-line no-console
    console.warn(
      "[arcgis] VITE_ARCGIS_OAUTH_APP_ID is not set. Copy .env.example to .env.local and fill it in.",
    );
    return;
  }

  const oauthInfo = new OAuthInfo({
    appId: OAUTH_APP_ID,
    portalUrl: PORTAL_URL,
    popup: false,
    flowType: "auto",
  });

  IdentityManager.registerOAuthInfos([oauthInfo]);
}

/**
 * Returns the signed-in user's credential if one is already established,
 * otherwise rejects. AuthGate uses this on mount to decide whether to show
 * the sign-in wall or render the app.
 */
export async function checkSignInStatus(): Promise<{
  username: string;
} | null> {
  try {
    await IdentityManager.checkSignInStatus(`${PORTAL_URL}/sharing`);
    const credential = IdentityManager.findCredential(`${PORTAL_URL}/sharing`);
    return credential ? { username: credential.userId } : null;
  } catch {
    return null;
  }
}

/**
 * Trigger OAuth sign-in. The Identity Manager handles the redirect dance —
 * we just need to call getCredential() against the sharing endpoint to kick
 * it off.
 */
export async function signIn(): Promise<void> {
  await IdentityManager.getCredential(`${PORTAL_URL}/sharing`, {
    oAuthPopupConfirmation: false,
  });
}

export async function signOut(): Promise<void> {
  IdentityManager.destroyCredentials();
  // Force a reload so the assistant and map components fully tear down.
  // They cache layer references that are tied to the previous credential.
  window.location.reload();
}
