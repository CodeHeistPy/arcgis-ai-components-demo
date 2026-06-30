const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaDatabase, FaCloud, FaMapMarkedAlt, FaRobot, FaComments, FaLayerGroup,
  FaCubes, FaKey, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaBolt, FaSearchLocation, FaProjectDiagram, FaCog, FaListOl, FaCode,
  FaFlagCheckered, FaBalanceScale, FaWater, FaArrowRight, FaUser, FaUserShield
} = require("react-icons/fa");

// ---- Palette (content-informed: navy=enterprise/exec, teal=geospatial, amber=risk) ----
const NAVY   = "0B2545";
const NAVY2  = "13315C";
const TEAL   = "1C7293";
const TEALLT = "5DA9C4";
const AMBER  = "E8A33D";
const GREEN  = "2A9D6F";
const RED    = "C24A45";
const INK    = "1E293B";
const MUTED  = "5B6B7F";
const LIGHT  = "F4F7FA";
const CARD   = "FFFFFF";
const WHITE  = "FFFFFF";

const HEAD = "Bookman Old Style"; // safe-list serif w/ personality
const BODY = "Calibri";           // safe-list sans

const pres = new pptxgen();
pres.defineLayout({ name: "W", width: 13.333, height: 7.5 });
pres.layout = "W";
pres.author = "ArcGIS AI Components Demo";
pres.title = "Building an ArcGIS AI Components Demo App";

const W = 13.333, H = 7.5;

// ---- icon helper ----
async function icon(IconComponent, hexNoHash, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color: "#" + hexNoHash, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

function shadow() {
  return { type: "outer", color: "000000", blur: 7, offset: 3, angle: 90, opacity: 0.12 };
}

// icon inside a colored circle
async function iconCircle(slide, IconComponent, circleHex, iconHex, x, y, d) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: circleHex }, line: { type: "none" } });
  const pad = d * 0.26;
  slide.addImage({ data: await icon(IconComponent, iconHex), x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

function footer(slide) {
  slide.addText("ArcGIS Maps SDK 5.0 · AI Components Demo", {
    x: 0.55, y: H - 0.42, w: 8, h: 0.3, fontFace: BODY, fontSize: 9, color: MUTED, align: "left", margin: 0
  });
  slide.addText(String(pres.slides.length), {
    x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 9, color: MUTED, align: "right", margin: 0
  });
}

(async () => {
  // ============================================================ Slide 1 — Title
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    // subtle geo motif: faint concentric ovals top-right
    s.addShape(pres.shapes.OVAL, { x: 9.6, y: -1.8, w: 5.6, h: 5.6, fill: { color: NAVY2 }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: 10.6, y: -0.8, w: 3.6, h: 3.6, fill: { color: TEAL, transparency: 55 }, line: { type: "none" } });
    await iconCircle(s, FaMapMarkedAlt, AMBER, NAVY, 0.85, 1.5, 1.15);

    s.addText("Conversational maps, for free", {
      x: 0.85, y: 2.95, w: 11, h: 0.5, fontFace: BODY, fontSize: 16, color: TEALLT, bold: true, charSpacing: 2, margin: 0
    });
    s.addText("Building an ArcGIS AI Components Demo App", {
      x: 0.85, y: 3.45, w: 11.2, h: 1.5, fontFace: HEAD, fontSize: 42, color: WHITE, bold: true, lineSpacing: 46, margin: 0
    });
    s.addText("A reproducible Vite + React + TypeScript template for the AI components (beta) in the ArcGIS Maps SDK for JavaScript 5.0 — putting an assistant beside a web map over your own hosted feature layer.", {
      x: 0.9, y: 5.0, w: 10.6, h: 1.0, fontFace: BODY, fontSize: 15, color: "C9D6E5", lineSpacing: 22, margin: 0
    });
    s.addText([
      { text: "Phase 1: out-of-the-box agents", options: { color: WHITE, bold: true } },
      { text: "   ·   Phase 2: custom LangGraph agent", options: { color: TEALLT } },
    ], { x: 0.9, y: 6.15, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, margin: 0 });
  }

  // ============================================================ Slide 2 — The concept (architecture flow)
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The idea: AI on top of the spatial stack", {
      x: 0.55, y: 0.45, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("A well-modeled hosted feature layer unlocks a natural-language interface with no extra data work — the assistant queries the same layer that drives your dashboard.", {
      x: 0.55, y: 1.18, w: 11.8, h: 0.6, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    const steps = [
      { ic: FaDatabase, t: "Your pipeline", d: "Compute your metric and shape the data however you like", c: NAVY },
      { ic: FaCloud, t: "ArcGIS Online", d: "Publishes a hosted feature layer", c: TEAL },
      { ic: FaMapMarkedAlt, t: "Web Map", d: "Layer + embeddings; the agent's semantic index", c: TEAL },
      { ic: FaComments, t: "This App", d: "<arcgis-assistant> chat beside the map", c: AMBER },
    ];
    const cardW = 2.78, gap = 0.42, startX = 0.55, y = 2.35, cardH = 3.0;
    for (let i = 0; i < steps.length; i++) {
      const x = startX + i * (cardW + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
      await iconCircle(s, steps[i].ic, steps[i].c, WHITE, x + cardW / 2 - 0.55, y + 0.35, 1.1);
      s.addText(steps[i].t, { x: x + 0.15, y: y + 1.6, w: cardW - 0.3, h: 0.45, fontFace: BODY, fontSize: 15, bold: true, color: NAVY, align: "center", margin: 0 });
      s.addText(steps[i].d, { x: x + 0.2, y: y + 2.05, w: cardW - 0.4, h: 0.85, fontFace: BODY, fontSize: 11.5, color: MUTED, align: "center", lineSpacing: 15, margin: 0 });
      if (i < steps.length - 1) {
        s.addImage({ data: await icon(FaArrowRight, TEALLT), x: x + cardW + 0.04, y: y + cardH / 2 - 0.17, w: 0.34, h: 0.34 });
      }
    }
    s.addText([
      { text: "The payoff:  ", options: { bold: true, color: AMBER } },
      { text: "the dashboard and the assistant read the same feature layer. The conversational interface comes ", options: { color: INK } },
      { text: "almost for free.", options: { bold: true, color: NAVY } },
    ], { x: 0.55, y: 5.7, w: 12.2, h: 0.7, fontFace: BODY, fontSize: 15, align: "center", margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 3 — The GIS side comes first
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The GIS side comes first", {
      x: 0.55, y: 0.45, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("Answer quality comes from ArcGIS Online configuration, not app code. Do both — in order — before you touch the app.", {
      x: 0.55, y: 1.18, w: 12.0, h: 0.6, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    // Step A — metadata
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.95, w: 6.0, h: 3.5, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaLayerGroup, TEAL, WHITE, 0.95, 2.3, 0.95);
    s.addText("Step A — Populate metadata", { x: 2.05, y: 2.4, w: 4.3, h: 0.75, fontFace: BODY, fontSize: 16, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "Layer: a meaningful name + a description of its purpose", options: { bullet: true, breakLine: true } },
      { text: "Fields: descriptive aliases AND descriptions (the layer item's Data → Fields)", options: { bullet: true, breakLine: true } },
      { text: "Agents reason over this — cryptic field names lead to wrong answers", options: { bullet: true } },
    ], { x: 0.95, y: 3.4, w: 5.25, h: 2.0, fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 18, paraSpaceAfter: 9, margin: 0 });

    // Step B — embeddings
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.95, w: 6.0, h: 3.5, fill: { color: LIGHT }, line: { color: TEAL, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaProjectDiagram, AMBER, NAVY, 7.2, 2.3, 0.95);
    s.addText("Step B — Generate embeddings", { x: 8.3, y: 2.4, w: 4.3, h: 0.75, fontFace: BODY, fontSize: 16, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "Web map item → Settings → Manage AI vector embeddings → Generate", options: { bullet: true, breakLine: true } },
      { text: "Builds a semantic index of layer titles + field metadata", options: { bullet: true, breakLine: true } },
      { text: "Run it AFTER Step A; re-generate after any metadata/schema change", options: { bullet: true } },
    ], { x: 7.2, y: 3.4, w: 5.25, h: 2.0, fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 18, paraSpaceAfter: 9, margin: 0 });

    // callout
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.7, w: 12.25, h: 1.0, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "Order matters: metadata first, then embed.  ", options: { bold: true, color: AMBER } },
      { text: "The app is the easy 20% — this GIS prep is the 80% that decides answer quality.", options: { color: "C9D6E5" } },
    ], { x: 0.95, y: 5.7, w: 11.5, h: 1.0, fontFace: BODY, fontSize: 14, valign: "middle", lineSpacing: 18, margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 4 — Get started with the repo
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Get started with the repo", {
      x: 0.55, y: 0.45, w: 9.0, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("see README.md", {
      x: 9.5, y: 0.62, w: 3.3, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, align: "right", margin: 0
    });
    s.addText("Clone, configure, run — the repo carries the detail.", {
      x: 0.55, y: 1.18, w: 12.0, h: 0.5, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });
    const steps = [
      "Clone:  git clone https://github.com/CodeHeistPy/arcgis-ai-components-demo.git",
      "Install:  npm install",
      "Configure:  cp .env.example .env.local  →  set VITE_ARCGIS_OAUTH_APP_ID + VITE_WEBMAP_ID",
      "Run:  npm run dev  →  http://localhost:5173, then sign in",
      "Make it yours:  edit src/scenarios/scenario-01-sample (config.ts + prompts.ts)",
    ];
    const y0 = 1.8, rh = 0.72;
    for (let i = 0; i < steps.length; i++) {
      const y = y0 + i * rh;
      s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.02, w: 0.56, h: 0.56, fill: { color: i % 2 ? TEAL : NAVY }, line: { type: "none" } });
      s.addText(String(i + 1), { x: 0.6, y: y + 0.02, w: 0.56, h: 0.56, fontFace: BODY, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(steps[i], { x: 1.38, y, w: 11.4, h: 0.6, fontFace: BODY, fontSize: 13, color: INK, valign: "middle", lineSpacing: 16, margin: 0 });
    }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.5, w: 12.25, h: 1.0, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "Prereqs first:  ", options: { bold: true, color: AMBER } },
      { text: "the GIS prep (metadata + embeddings) and an OAuth credentials item. The README and WALKTHROUGH.md carry the rest.", options: { color: "C9D6E5" } },
    ], { x: 0.95, y: 5.5, w: 11.5, h: 1.0, fontFace: BODY, fontSize: 13.5, valign: "middle", lineSpacing: 17, margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 5 — Register the app (OAuth credentials)
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Register the app: OAuth credentials", {
      x: 0.55, y: 0.45, w: 8.8, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("see DEV-OAUTH-CREDENTIALS.md", {
      x: 9.4, y: 0.62, w: 3.4, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, align: "right", margin: 0
    });
    s.addText("The SDK app signs users in with a Client ID from ArcGIS Online — one-time, no code. (The no-code Data Explorer path skips this.)", {
      x: 0.55, y: 1.18, w: 12.2, h: 0.5, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    const steps = [
      "ArcGIS Online → Content → New item → Developer credentials → OAuth credentials (user auth)",
      "Add a redirect URL: http://localhost:5173  (add your deployed origin later)",
      "Copy the Client ID — no client secret needed (PKCE for single-page apps)",
      "Set it in .env.local → VITE_ARCGIS_OAUTH_APP_ID",
    ];
    const y0 = 1.9, rh = 0.78;
    for (let i = 0; i < steps.length; i++) {
      const y = y0 + i * rh;
      s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.02, w: 0.58, h: 0.58, fill: { color: i % 2 ? TEAL : NAVY }, line: { type: "none" } });
      s.addText(String(i + 1), { x: 0.6, y: y + 0.02, w: 0.58, h: 0.58, fontFace: BODY, fontSize: 17, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(steps[i], { x: 1.4, y, w: 11.3, h: 0.62, fontFace: BODY, fontSize: 13.5, color: INK, valign: "middle", lineSpacing: 16, margin: 0 });
    }

    // callout
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.25, w: 12.25, h: 1.0, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "Requires a Creator user type or higher.  ", options: { bold: true, color: AMBER } },
      { text: "Use USER authentication, not app auth — the assistant's AI calls are gated on the signed-in user.", options: { color: "C9D6E5" } },
    ], { x: 0.95, y: 5.25, w: 11.5, h: 1.0, fontFace: BODY, fontSize: 13.5, valign: "middle", lineSpacing: 17, margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 6 — Connecting users (SAML vs built-in)
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Connecting users: SAML vs built-in", {
      x: 0.55, y: 0.45, w: 12.2, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("Both use the same OAuth 2.0 user-auth flow and the same app code — the only lever is the portal URL.", {
      x: 0.55, y: 1.18, w: 12.0, h: 0.6, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    // Built-in card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.95, w: 6.0, h: 3.4, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaUser, TEAL, WHITE, 0.95, 2.25, 0.9);
    s.addText("Built-in account", { x: 1.95, y: 2.3, w: 4.4, h: 0.8, fontFace: BODY, fontSize: 16, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "Credentials live in ArcGIS Online", options: { bullet: true, breakLine: true } },
      { text: "Signs in directly on the ArcGIS sign-in page", options: { bullet: true, breakLine: true } },
      { text: "Org password policy applies", options: { bullet: true, breakLine: true } },
      { text: "Username, e.g. jsmith", options: { bullet: true } },
    ], { x: 0.95, y: 3.25, w: 5.25, h: 2.0, fontFace: BODY, fontSize: 12.5, color: INK, lineSpacing: 18, paraSpaceAfter: 8, margin: 0 });

    // SAML card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.95, w: 6.0, h: 3.4, fill: { color: LIGHT }, line: { color: TEAL, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaUserShield, AMBER, NAVY, 7.2, 2.25, 0.9);
    s.addText("SAML / org-specific login", { x: 8.2, y: 2.3, w: 4.45, h: 0.8, fontFace: BODY, fontSize: 16, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "Credentials live in your identity provider (IdP)", options: { bullet: true, breakLine: true } },
      { text: "Redirected to your IdP to sign in", options: { bullet: true, breakLine: true } },
      { text: "Formerly called \"enterprise logins\"", options: { bullet: true, breakLine: true } },
      { text: "Username carries the org-key suffix: jsmith@ORG", options: { bullet: true } },
    ], { x: 7.2, y: 3.25, w: 5.25, h: 2.0, fontFace: BODY, fontSize: 12.5, color: INK, lineSpacing: 18, paraSpaceAfter: 8, margin: 0 });

    // callout
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.6, w: 12.25, h: 1.05, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "The only lever is VITE_PORTAL_URL:  ", options: { bold: true, color: AMBER } },
      { text: "www.arcgis.com (generic sign-in)  vs  https://<org-key>.maps.arcgis.com (targets your org → routes SAML members to your IdP).", options: { color: "C9D6E5" } },
    ], { x: 0.95, y: 5.6, w: 11.5, h: 1.05, fontFace: BODY, fontSize: 13, valign: "middle", lineSpacing: 17, margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 7 — Two ways to ship it (code vs no-code)
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Two ways to ship it: code vs no-code", {
      x: 0.55, y: 0.45, w: 12.2, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("Same prepared web map, two front ends — the no-code path is for GIS users without developer skills.", {
      x: 0.55, y: 1.18, w: 12.0, h: 0.6, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    // Code card (navy)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.95, w: 6.0, h: 3.2, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaCode, AMBER, NAVY, 0.95, 2.25, 0.9);
    s.addText("Code — JavaScript SDK", { x: 1.95, y: 2.3, w: 4.4, h: 0.8, fontFace: BODY, fontSize: 15, bold: true, color: WHITE, valign: "middle", margin: 0 });
    s.addText([
      { text: "This repo: Vite + React + TypeScript", options: { bullet: true, breakLine: true } },
      { text: "Custom UI, OAuth, your branding", options: { bullet: true, breakLine: true } },
      { text: "Optional Phase 2 custom agent", options: { bullet: true } },
    ], { x: 0.95, y: 3.3, w: 5.2, h: 1.7, fontFace: BODY, fontSize: 13, color: "C9D6E5", lineSpacing: 20, paraSpaceAfter: 8, margin: 0 });

    // No-code card (light)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.95, w: 6.0, h: 3.2, fill: { color: LIGHT }, line: { color: TEAL, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaComments, TEAL, WHITE, 7.2, 2.25, 0.9);
    s.addText("No-code — Instant Apps Data Explorer", { x: 8.2, y: 2.25, w: 4.45, h: 0.9, fontFace: BODY, fontSize: 15, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "Preset template, assistant wired in", options: { bullet: true, breakLine: true } },
      { text: "Configure welcome message + sample questions", options: { bullet: true, breakLine: true } },
      { text: "Publish & share from ArcGIS Online", options: { bullet: true } },
    ], { x: 7.2, y: 3.3, w: 5.2, h: 1.7, fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 20, paraSpaceAfter: 8, margin: 0 });

    // callout
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.4, w: 12.25, h: 1.0, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "Both build on the same Activity #1 prep:  ", options: { bold: true, color: AMBER } },
      { text: "field metadata → vector embeddings. Going no-code does not skip the GIS work.", options: { color: "C9D6E5" } },
    ], { x: 0.95, y: 5.4, w: 11.5, h: 1.0, fontFace: BODY, fontSize: 13.5, valign: "middle", lineSpacing: 17, margin: 0 });
    footer(s);
  }

  // ============================================================ Slide 8 — Set up Data Explorer (no code)
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Set up Data Explorer (no code)", {
      x: 0.55, y: 0.45, w: 9.5, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("doc.arcgis.com → Instant Apps", {
      x: 9.5, y: 0.62, w: 3.3, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, align: "right", margin: 0
    });
    s.addText("From a prepared web map to a shared app — no developer tools.", {
      x: 0.55, y: 1.18, w: 12.0, h: 0.5, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    const steps = [
      "Prep the web map: field metadata → generate embeddings (item Settings, or in the app config)",
      "Open ArcGIS Instant Apps from your web map",
      "Choose the Data Explorer (beta) template",
      "Configure: welcome message, up to 5 sample questions, a help panel",
      "Preview (auto-saves); check tablet & mobile via the Views menu",
      "Publish, then share (owner / organization / everyone) → Launch",
    ];
    const y0 = 1.75, rh = 0.82;
    for (let i = 0; i < steps.length; i++) {
      const y = y0 + i * rh;
      s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.02, w: 0.58, h: 0.58, fill: { color: i % 2 ? TEAL : NAVY }, line: { type: "none" } });
      s.addText(String(i + 1), { x: 0.6, y: y + 0.02, w: 0.58, h: 0.58, fontFace: BODY, fontSize: 17, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(steps[i], { x: 1.4, y, w: 11.3, h: 0.66, fontFace: BODY, fontSize: 14, color: INK, valign: "middle", lineSpacing: 16, margin: 0 });
    }
    footer(s);
  }

  // ============================================================ Slide 9 — The repo handles the rest
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addShape(pres.shapes.OVAL, { x: -1.6, y: 4.4, w: 5.2, h: 5.2, fill: { color: NAVY2 }, line: { type: "none" } });
    await iconCircle(s, FaListOl, AMBER, NAVY, 0.85, 0.7, 1.0);
    s.addText("The repo handles the rest", {
      x: 2.05, y: 0.7, w: 10.5, h: 1.0, fontFace: HEAD, fontSize: 30, color: WHITE, bold: true, valign: "middle", margin: 0
    });
    s.addText("Everything below ships in the repo — start at the README, which links the rest.", {
      x: 0.9, y: 1.85, w: 11.8, h: 0.5, fontFace: BODY, fontSize: 14, color: "C9D6E5", margin: 0
    });
    s.addText([
      { text: "README.md", options: { bold: true, color: AMBER } },
      { text: "  — start here: setup + GIS-side-first", options: { color: "C9D6E5", breakLine: true } },
      { text: "WALKTHROUGH.md", options: { bold: true, color: AMBER } },
      { text: "  — full build from scratch", options: { color: "C9D6E5", breakLine: true } },
      { text: "DEV-OAUTH-CREDENTIALS.md", options: { bold: true, color: AMBER } },
      { text: "  — register the app / Client ID", options: { color: "C9D6E5", breakLine: true } },
      { text: "ACTIVITY-2-AUTH.md", options: { bold: true, color: AMBER } },
      { text: "  — SAML vs built-in sign-in", options: { color: "C9D6E5" } },
    ], { x: 0.9, y: 2.6, w: 6.0, h: 3.3, fontFace: BODY, fontSize: 13.5, lineSpacing: 18, paraSpaceAfter: 12, margin: 0 });
    s.addText([
      { text: "ACTIVITY-2-DATA-EXPLORER.md", options: { bold: true, color: AMBER } },
      { text: "  — no-code path", options: { color: "C9D6E5", breakLine: true } },
      { text: "LESSONS-LEARNED.md", options: { bold: true, color: AMBER } },
      { text: "  — gotchas + guidelines", options: { color: "C9D6E5", breakLine: true } },
      { text: "DEMO.md", options: { bold: true, color: AMBER } },
      { text: "  — run-sheet for presenting", options: { color: "C9D6E5", breakLine: true } },
      { text: "CLAUDE.md", options: { bold: true, color: AMBER } },
      { text: "  — full project context + gotchas", options: { color: "C9D6E5" } },
    ], { x: 7.1, y: 2.6, w: 5.7, h: 3.3, fontFace: BODY, fontSize: 13.5, lineSpacing: 18, paraSpaceAfter: 12, margin: 0 });
    s.addText("Start at the README — it links everything else.", {
      x: 0.9, y: 6.35, w: 11.8, h: 0.5, fontFace: BODY, fontSize: 13, italic: true, color: TEALLT, margin: 0
    });
  }


  await pres.writeFile({ fileName: "ArcGIS-AI-Components-Walkthrough.pptx" });
  console.log("WROTE ArcGIS-AI-Components-Walkthrough.pptx");
})();
