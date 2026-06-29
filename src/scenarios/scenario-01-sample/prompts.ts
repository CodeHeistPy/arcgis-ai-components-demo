/**
 * Sample scenario — prompt copy.
 *
 * ⚠️ TEMPLATE: replace the entry message and prompts below with ones that fit
 * YOUR web map and data. Keep the *shapes* that the OOB data-exploration agent
 * handles well (it only does query / statistics / spatial-proximity / filter —
 * no visualization, no symbology, no external data):
 *
 *   1. Single-attribute filter      — "Show me the <high-priority> <records>."
 *   2. Single-group aggregate       — "What's the average <metric> for <group>?"
 *   3. Multi-attribute combo        — "Which <records> have <A> and <B>?"
 *   4. State/region-scoped X-layer  — "Which <records> in <state> intersect <layer>?"
 *
 * Prompt-shape rule (see CLAUDE.md §5/§9): POINTED, single-subject prompts are
 * reliable; broad sweeps degrade. Always verify a prompt returns correct,
 * self-consistent data against YOUR layer before shipping it in a demo.
 */

export const ENTRY_MESSAGE = [
  "Welcome. This map shows <DESCRIBE YOUR DATA — how many records, what they",
  "represent, the key metric and its range>. Ask me about it — I can filter the",
  "map, run statistics, and answer questions about individual features.",
].join(" ");

export const SUGGESTED_PROMPTS: readonly string[] = [
  // 1 — single-attribute filter
  "Show me the <high-priority> <records>.",
  // 2 — single-group aggregate (single-group is reliable; multi-group COMPARISON is not)
  "What's the average <metric> for <category> <records>?",
  // 3 — multi-attribute combo
  "Which <records> have <attribute A> and <attribute B>?",
  // 4 — cross-layer intersect — MUST be state/region-scoped to avoid a 413
  //     (the agent otherwise sends the whole reference layer as a spatial filter)
  "Which <records> in <state/region> intersect <reference layer>?",
];

/**
 * Out-of-scope prompts the OOB agent fails, hallucinates, or silently degrades
 * on. NOT wired into the UI — reference for the README and as Phase 2
 * custom-agent candidates. (All confirmed against the SDK behavior; see
 * CLAUDE.md §9.)
 */
export const OUT_OF_SCOPE_PROMPTS: readonly string[] = [
  // Multi-group comparison silently degrades to one overall number (no GROUP BY).
  "How does <group A>'s average <metric> compare to <group B>?",
  // Schema introspection HALLUCINATES — never demo. Verify schema via AGO Data → Fields.
  "What fields are in the <layer> layer?",
  // No forecast / chart-gen / external integrations / user-location.
  "Predict next quarter's <metric>.",
  "Plot <metric> over time on a chart.",
  "Find the nearest <record> to me.",
  "Email the <record> list to my team.",
];
