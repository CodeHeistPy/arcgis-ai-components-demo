const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaDatabase, FaCloud, FaMapMarkedAlt, FaRobot, FaComments, FaLayerGroup,
  FaCubes, FaKey, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaBolt, FaSearchLocation, FaProjectDiagram, FaCog, FaListOl, FaCode,
  FaFlagCheckered, FaBalanceScale, FaWater, FaArrowRight
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

function footer(slide, n) {
  slide.addText("ArcGIS Maps SDK 5.0 · AI Components Demo", {
    x: 0.55, y: H - 0.42, w: 8, h: 0.3, fontFace: BODY, fontSize: 9, color: MUTED, align: "left", margin: 0
  });
  slide.addText(String(n), {
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
    footer(s, 2);
  }

  // ============================================================ Slide 3 — Stack & why
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The stack — and why each piece", {
      x: 0.55, y: 0.45, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });

    const rows = [
      { ic: FaCubes, c: TEAL, t: "Vite + React + TypeScript", d: "Custom agents can't run from CDN — bundler required from day one, even for Phase 1." },
      { ic: FaRobot, c: AMBER, t: "@arcgis/ai-components", d: "Ships <arcgis-assistant> + the OOB agents. Web components only — there is NO React-wrapper package." },
      { ic: FaMapMarkedAlt, c: NAVY, t: "@arcgis/map-components-react", d: "The map (<ArcgisMap>) does have a React wrapper. All @arcgis/* pinned at 5.0.x." },
      { ic: FaKey, c: TEAL, t: "OAuth 2.0 — user auth (PKCE)", d: "AI calls are gated on the signed-in user's org. App auth has no user context and won't work." },
      { ic: FaLayerGroup, c: AMBER, t: "Web map + embeddings", d: "The agent discovers layers through the web map's semantic index — generated upstream in AGO." },
    ];
    let y = 1.5;
    const rowH = 1.02;
    for (const r of rows) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y, w: 12.25, h: rowH - 0.16, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.08 });
      await iconCircle(s, r.ic, r.c, WHITE, 0.78, y + 0.1, 0.66);
      s.addText(r.t, { x: 1.65, y: y + 0.08, w: 4.4, h: 0.7, fontFace: BODY, fontSize: 15, bold: true, color: NAVY, valign: "middle", margin: 0 });
      s.addText(r.d, { x: 6.2, y: y + 0.06, w: 6.45, h: 0.74, fontFace: BODY, fontSize: 12.5, color: MUTED, valign: "middle", lineSpacing: 15, margin: 0 });
      y += rowH;
    }
    footer(s, 3);
  }

  // ============================================================ Slide 4 — Phase 1 vs Phase 2
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Two phases — ship the wow first", {
      x: 0.55, y: 0.45, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });

    // Phase 1 card (navy)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.5, w: 6.0, h: 5.0, fill: { color: NAVY }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaBolt, AMBER, NAVY, 0.95, 1.85, 0.95);
    s.addText("Phase 1 — OOB agents", { x: 2.05, y: 1.95, w: 4.3, h: 0.75, fontFace: BODY, fontSize: 19, bold: true, color: WHITE, valign: "middle", margin: 0 });
    s.addText([
      { text: "Three public out-of-the-box agents:", options: { bold: true, color: TEALLT, breakLine: true } },
      { text: "navigation · data-exploration · help", options: { color: WHITE, breakLine: true } },
      { text: "Loads the web map, runs queries / stats / filters / spatial intersects.", options: { color: "C9D6E5", breakLine: true } },
      { text: "Most of the exec wow, none of the LangGraph.", options: { italic: true, color: WHITE } },
    ], { x: 0.95, y: 3.0, w: 5.2, h: 3.2, fontFace: BODY, fontSize: 14, lineSpacing: 24, paraSpaceAfter: 10, margin: 0 });

    // Phase 2 card (light)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.5, w: 6.0, h: 5.0, fill: { color: LIGHT }, line: { color: TEAL, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaProjectDiagram, TEAL, WHITE, 7.2, 1.85, 0.95);
    s.addText("Phase 2 — custom agent", { x: 8.3, y: 1.95, w: 4.3, h: 0.75, fontFace: BODY, fontSize: 19, bold: true, color: NAVY, valign: "middle", margin: 0 });
    s.addText([
      { text: "LangGraph portfolio-reasoning agent", options: { bold: true, color: TEAL, breakLine: true } },
      { text: "Closes the measured OOB gaps:", options: { color: INK, breakLine: true } },
      { text: "cross-category comparison (GROUP BY)", options: { bullet: true, color: MUTED, breakLine: true } },
      { text: "correct-direction cross-layer queries", options: { bullet: true, color: MUTED, breakLine: true } },
      { text: "ranking, what-if, exec summaries", options: { bullet: true, color: MUTED } },
    ], { x: 7.2, y: 3.0, w: 5.2, h: 3.2, fontFace: BODY, fontSize: 14, lineSpacing: 22, paraSpaceAfter: 8, margin: 0 });
    footer(s, 4);
  }

  // ============================================================ Slide 5 — Build in 10 steps
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Build it in 10 steps", {
      x: 0.55, y: 0.45, w: 9, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("Full detail in WALKTHROUGH.md", {
      x: 8.5, y: 0.62, w: 4.3, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, align: "right", margin: 0
    });

    const steps = [
      "Upstream prereqs first — web map, embeddings, OAuth, org settings",
      "Scaffold Vite + React + TS; scenarios/ folder from day one",
      "Pin real versions — all @arcgis/* at 5.0.x; no ai-components-react",
      "Register elements — defineCustomElements() from each /loader",
      "Declare AI web-component tags in vite-env.d.ts (no React wrappers)",
      "Map + assistant layout; set referenceElement to the real <arcgis-map>",
      "AuthGate (named-user OAuth) + ErrorBoundary",
      "Scenario config + prompts; copy stays out of components",
      "Env vars + npm run dev → localhost:5173",
      "Verify: force decompositions that reconcile before you trust it",
    ];
    const colX = [0.55, 6.9], colW = 6.0;
    const y0 = 1.45, rh = 1.0;
    for (let i = 0; i < steps.length; i++) {
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      const x = colX[col], y = y0 + row * rh;
      s.addShape(pres.shapes.OVAL, { x, y: y + 0.04, w: 0.62, h: 0.62, fill: { color: i % 2 ? TEAL : NAVY }, line: { type: "none" } });
      s.addText(String(i + 1), { x, y: y + 0.04, w: 0.62, h: 0.62, fontFace: BODY, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(steps[i], { x: x + 0.78, y, w: colW - 0.85, h: 0.85, fontFace: BODY, fontSize: 12.5, color: INK, valign: "middle", lineSpacing: 15, margin: 0 });
    }
    footer(s, 5);
  }

  // ============================================================ Slide 6 — Gotchas
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Gotchas that cost us a day", {
      x: 0.55, y: 0.45, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });

    const cards = [
      { ic: FaCog, t: "Elements don't auto-register", d: "SDK 5.x is Lumina-based. Bare imports do nothing — call defineCustomElements() or you get \"Custom element not found.\"" },
      { ic: FaCode, t: "No ai-components-react", d: "AI components ship as raw web components only. Declare the tags in vite-env.d.ts; set props imperatively via refs." },
      { ic: FaExclamationTriangle, t: "Embeddings 504 ≠ CORS", d: "Generic error looks like CORS but is a 504 timeout. Wide-schema reference layers trigger it; narrow ones succeed." },
      { ic: FaProjectDiagram, t: "Cross-layer 413", d: "OOB agent submits national polygons as a spatial filter → 413. Fix: state-scope the prompt or pre-compute the attribute." },
      { ic: FaSearchLocation, t: "Schema introspection lies", d: "\"List fields\" returned two contradictory lists in one turn. Verify schema via AGO Data → Fields — never the assistant." },
      { ic: FaBalanceScale, t: "Verify, don't infer", d: "Filenames in dist/ aren't docs. We mounted a non-existent agent on a guess. Confirm against developers.arcgis.com." },
    ];
    const cw = 4.0, ch = 2.35, gx = 0.26, gy = 0.3, sx = 0.55, sy = 1.45;
    for (let i = 0; i < cards.length; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = sx + col * (cw + gx), y = sy + row * (ch + gy);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.08, shadow: shadow() });
      await iconCircle(s, cards[i].ic, AMBER, NAVY, x + 0.28, y + 0.28, 0.78);
      s.addText(cards[i].t, { x: x + 1.2, y: y + 0.3, w: cw - 1.4, h: 0.75, fontFace: BODY, fontSize: 14.5, bold: true, color: NAVY, valign: "middle", lineSpacing: 16, margin: 0 });
      s.addText(cards[i].d, { x: x + 0.28, y: y + 1.12, w: cw - 0.56, h: 1.1, fontFace: BODY, fontSize: 11.5, color: MUTED, lineSpacing: 14.5, margin: 0 });
    }
    footer(s, 6);
  }

  // ============================================================ Slide 7 — Prompt engineering
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Prompt engineering: what the OOB agent can do", {
      x: 0.55, y: 0.45, w: 12.2, h: 0.7, fontFace: HEAD, fontSize: 28, color: NAVY, bold: true, margin: 0
    });

    // Works column
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.5, w: 6.0, h: 5.0, fill: { color: "EAF4EF" }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaCheckCircle, GREEN, WHITE, 0.9, 1.8, 0.8);
    s.addText("Reliable — demo these", { x: 1.85, y: 1.8, w: 4.5, h: 0.8, fontFace: BODY, fontSize: 18, bold: true, color: GREEN, valign: "middle", margin: 0 });
    s.addText([
      { text: "Attribute filters  (\"show the high-priority records\")", options: { bullet: true, breakLine: true } },
      { text: "Single-group stats  (\"average metric for a group\")", options: { bullet: true, breakLine: true } },
      { text: "Multi-attribute combos  (filter on two fields)", options: { bullet: true, breakLine: true } },
      { text: "State / region-scoped cross-layer intersects", options: { bullet: true, breakLine: true } },
      { text: "Pointed, single-subject questions", options: { bullet: true } },
    ], { x: 0.95, y: 2.9, w: 5.4, h: 3.4, fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 22, paraSpaceAfter: 12, margin: 0 });

    // Fails column
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.5, w: 6.0, h: 5.0, fill: { color: "FBEDEC" }, line: { type: "none" }, rectRadius: 0.1, shadow: shadow() });
    await iconCircle(s, FaTimesCircle, RED, WHITE, 7.15, 1.8, 0.8);
    s.addText("Fails / degrades — keep out", { x: 8.1, y: 1.8, w: 4.5, h: 0.8, fontFace: BODY, fontSize: 18, bold: true, color: RED, valign: "middle", margin: 0 });
    s.addText([
      { text: "Schema introspection  (\"list fields\") — hallucinates", options: { bullet: true, breakLine: true } },
      { text: "Cross-category comparison — silently degrades", options: { bullet: true, breakLine: true } },
      { text: "Unbounded cross-layer  — 413 error", options: { bullet: true, breakLine: true } },
      { text: "Broad sweeps  (vague, unscoped questions)", options: { bullet: true, breakLine: true } },
      { text: "Charts · forecasts · email · user location", options: { bullet: true } },
    ], { x: 7.2, y: 2.9, w: 5.4, h: 3.4, fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 22, paraSpaceAfter: 12, margin: 0 });
    footer(s, 7);
  }

  // ============================================================ Slide 8 — Demo run sheet
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The demo run sheet — prompt shapes that work", {
      x: 0.55, y: 0.45, w: 12.2, h: 0.7, fontFace: HEAD, fontSize: 30, color: NAVY, bold: true, margin: 0
    });
    s.addText("Fill these with prompts you've verified against your data. Build from simple to the strongest hook.", {
      x: 0.55, y: 1.18, w: 12, h: 0.5, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0
    });

    const prompts = [
      { ic: FaSearchLocation, t: "\"Show me the <high-priority> <records>.\"", d: "Opener — single-attribute filter. Verify the count is stable.", c: TEAL },
      { ic: FaBalanceScale, t: "\"Average <metric> for <one category>?\"", d: "Single-group stat. (Don't ask it to COMPARE two categories live.)", c: TEAL },
      { ic: FaFlagCheckered, t: "\"Which <high-priority> <records> also <2nd condition>?\"", d: "Centerpiece — a multi-attribute insight with a clear takeaway.", c: AMBER },
      { ic: FaWater, t: "\"Which <records> in <region> intersect <layer>?\"", d: "Cross-layer reveal — must stay region-scoped (else 413).", c: NAVY },
    ];
    let y = 1.95; const rh = 1.18;
    for (let i = 0; i < prompts.length; i++) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y, w: 12.25, h: rh - 0.16, fill: { color: LIGHT }, line: { type: "none" }, rectRadius: 0.08, shadow: shadow() });
      s.addShape(pres.shapes.OVAL, { x: 0.8, y: y + 0.22, w: 0.62, h: 0.62, fill: { color: prompts[i].c }, line: { type: "none" } });
      s.addText(String(i + 1), { x: 0.8, y: y + 0.22, w: 0.62, h: 0.62, fontFace: BODY, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(prompts[i].t, { x: 1.65, y: y + 0.12, w: 11.0, h: 0.48, fontFace: BODY, fontSize: 15.5, bold: true, color: NAVY, margin: 0 });
      s.addText(prompts[i].d, { x: 1.65, y: y + 0.55, w: 11.0, h: 0.42, fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0 });
      y += rh;
    }
    footer(s, 8);
  }

  // ============================================================ Slide 9 — Guidelines & next steps
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addShape(pres.shapes.OVAL, { x: -1.6, y: 4.4, w: 5.2, h: 5.2, fill: { color: NAVY2 }, line: { type: "none" } });
    await iconCircle(s, FaListOl, AMBER, NAVY, 0.85, 0.75, 1.0);
    s.addText("Guidelines to expedite the next build", {
      x: 2.05, y: 0.85, w: 10.5, h: 0.8, fontFace: HEAD, fontSize: 28, color: WHITE, bold: true, valign: "middle", margin: 0
    });

    const lines = [
      { b: "Start the upstream prep first.", r: "Embeddings + OAuth are the long pole — they gate all app code." },
      { b: "Verify against docs, not filenames.", r: "Confirm every element/version/API against developers.arcgis.com." },
      { b: "Prefer narrow-schema reference layers.", r: "Wide composite-index layers 504 the embedding pipeline." },
      { b: "Write pointed, data-querying prompts.", r: "Never demo schema introspection; force results that reconcile." },
      { b: "Treat reasoning gaps as Phase 2.", r: "Comparison & query-direction are agent-shaped, not layer-shaped." },
    ];
    let y = 2.15;
    for (const l of lines) {
      s.addImage({ data: await icon(FaCheckCircle, AMBER), x: 0.95, y: y + 0.04, w: 0.34, h: 0.34 });
      s.addText([
        { text: l.b + "  ", options: { bold: true, color: WHITE } },
        { text: l.r, options: { color: "C9D6E5" } },
      ], { x: 1.5, y, w: 11.0, h: 0.55, fontFace: BODY, fontSize: 15, valign: "middle", lineSpacing: 18, margin: 0 });
      y += 0.72;
    }

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.9, y: 5.95, w: 11.5, h: 1.0, fill: { color: NAVY2 }, line: { type: "none" }, rectRadius: 0.08 });
    s.addText([
      { text: "Read next:  ", options: { bold: true, color: AMBER } },
      { text: "WALKTHROUGH.md", options: { bold: true, color: WHITE } },
      { text: " (build)  ·  ", options: { color: "C9D6E5" } },
      { text: "LESSONS-LEARNED.md", options: { bold: true, color: WHITE } },
      { text: " (why)  ·  ", options: { color: "C9D6E5" } },
      { text: "DEMO.md", options: { bold: true, color: WHITE } },
      { text: " (present)  ·  ", options: { color: "C9D6E5" } },
      { text: "CLAUDE.md", options: { bold: true, color: WHITE } },
      { text: " (full context)", options: { color: "C9D6E5" } },
    ], { x: 1.2, y: 6.2, w: 11.0, h: 0.5, fontFace: BODY, fontSize: 13.5, valign: "middle", margin: 0 });
  }

  await pres.writeFile({ fileName: "ArcGIS-AI-Components-Walkthrough.pptx" });
  console.log("WROTE ArcGIS-AI-Components-Walkthrough.pptx");
})();
