/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARCGIS_OAUTH_APP_ID: string;
  readonly VITE_PORTAL_URL: string;
  readonly VITE_WEBMAP_ID: string;
  readonly VITE_FEATURE_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// @arcgis/ai-components ships as web components without React wrappers (no
// `@arcgis/ai-components-react` package exists). Declare the elements we use
// in JSX so TS doesn't choke. Props are typed loosely on purpose — the real
// API surface is set imperatively in ScenarioShell.tsx via refs.
declare namespace JSX {
  interface IntrinsicElements {
    "arcgis-assistant": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "feedback-enabled"?: boolean;
      "reference-element"?: HTMLElement | string;
    };
    "arcgis-assistant-navigation-agent": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    "arcgis-assistant-data-exploration-agent": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    "arcgis-assistant-help-agent": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
  }
}
