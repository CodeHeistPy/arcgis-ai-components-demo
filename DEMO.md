# Demo Run Sheet (template)

A fill-in template for presenting the app live. Replace the `<PLACEHOLDERS>`
with prompts and results you've **verified against your own web map**, then
delete this note. The structure below is ordered to build from a simple opener
to your strongest hook — keep that arc.

> **Pre-flight:** signed in as a named ArcGIS Online user with AI assistants
> enabled; web map embeddings generated (exclude any wide-schema layer that 504s
> — see `CLAUDE.md` §9); dev server running (`npm run dev`,
> http://localhost:5173). Run each prompt once beforehand and confirm the result.

---

## 1. Opener — establish the dataset

> **"Show me the &lt;high-priority&gt; &lt;records&gt;."**

- **Returns:** _&lt;what it filters/highlights — e.g. N records&gt;_
- **Say:** _"This map shows &lt;dataset&gt;. The assistant just isolated &lt;subset&gt;
  from &lt;the key metric&gt; — no query builder, just plain language."_
- **Verify:** the count and IDs are stable when you re-run.

## 2. Quantify — a single-group statistic

> **"What's the average &lt;metric&gt; for &lt;one category&gt;?"**

- **Returns:** _&lt;the number&gt;_
- **Say:** _"It runs statistics on demand, not just filtering."_
- **Caution:** keep it single-group. Do **not** ask it to *compare* two
  categories live — verified weak spot; it degrades to one overall number.
  A comparison ask is a Phase 2 teaser.

## 3. Centerpiece — a multi-attribute insight

> **"Which &lt;high-priority&gt; &lt;records&gt; also &lt;second condition&gt;?"**

- **Returns:** _&lt;the subset&gt;_
- **Say:** _&lt;the one-sentence executive takeaway — the "so what" of this
  combination&gt;._
- **This is the money moment.** Chain two attributes into an actionable
  insight. **Verify the breakdown reconciles** (itemized list sums to the total)
  before relying on it.

## 4. Cross-layer reveal — bring in a reference layer

> **"Which &lt;records&gt; in &lt;state/region&gt; intersect &lt;reference layer&gt;?"**

- **Returns:** _&lt;named record(s) + the specific reference attributes&gt;_
- **Say:** _"Now it's reasoning across layers — your data against &lt;reference
  dataset&gt;."_
- **Must stay scoped** ("in &lt;state/region&gt;"). The unbounded version 413s
  (`CLAUDE.md` §9). Pick a scope you've verified returns a clean **positive**.

## Optional follow-up (only if it's landing well)

> **"Is &lt;named record&gt; in &lt;condition&gt;? Give the specific attributes."**

- Pointed single-subject form — the most reliable shape. Good for the
  "traceable to source data, not hand-waving" beat if someone gets skeptical.

---

## Rules for driving it live

- **Use the suggested-prompt chips, don't free-type.** The chips are verified
  verbatim; rephrasings are non-deterministic.
- **Pointed, not broad.** Off-script, ask about *one named thing*, never a broad
  sweep.
- **Never ask it to list fields or "what can you do?" live** — it hallucinates
  schema confidently (`CLAUDE.md` §9). You answer the capability question.
- **Don't promise determinism.** It's an LLM orchestrator; different phrasing
  can route differently.
- **Keep your key numbers in your head** so you can speak them even if the agent
  phrases its answer differently than in rehearsal.

## Known-bad — do NOT use live (Phase 2 candidates)

| Prompt shape | Why it fails |
|---|---|
| "How does &lt;A&gt; compare to &lt;B&gt;?" | Silently degrades to one overall number (no GROUP BY). |
| "What fields are in the layer?" / "What can I ask?" | Hallucinates — can return contradictory field lists. |
| Unbounded cross-layer ("which records intersect &lt;layer&gt;", no scope) | 413 Content Too Large. |
| A scope whose honest answer is "no / not really" | Correct but reads poorly to an exec — pick a verified positive. |
| Charts · forecasts · email · user location | Not supported by the OOB agents. |
