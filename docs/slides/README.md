# Slide deck — source & regeneration

`ArcGIS-AI-Components-Walkthrough.pptx` is the presentation companion to
`WALKTHROUGH.md` / `LESSONS-LEARNED.md` (repo root). It's generated from
`build.js` (pptxgenjs), so edit the script and rebuild rather than hand-editing
the `.pptx`.

## Regenerate

```bash
cd docs/slides
npm install                 # pptxgenjs, react-icons, react, react-dom, sharp, jszip
node build.js               # writes the .pptx
```

The deck is a lean **9 slides** focused on getting started + the upfront setup,
deferring detail to the repo's docs: title · concept/architecture · the GIS side
comes first (metadata + embeddings) · **get started with the repo** · register
the app (OAuth credentials) · connecting users (SAML vs built-in) · code vs
no-code · set up Data Explorer (no-code) · **the repo handles the rest** (docs
map). Deeper material (stack, phases, build steps, gotchas, prompt patterns,
demo run sheet) lives in the repo docs, not the deck.

Footers auto-number from `pres.slides.length`, so inserting/reordering slides
needs no manual page-number changes.

## Visual QA (Windows, PowerPoint installed)

This environment had no LibreOffice/Poppler, so slides were rendered for QA via
PowerPoint COM automation:

```powershell
$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open("$PWD\ArcGIS-AI-Components-Walkthrough.pptx", $true, $false, $false)
foreach ($i in 1..$pres.Slides.Count) {
  $pres.Slides.Item($i).Export("$PWD\render\slide-$i.jpg", "JPG", 1480, 833)
}
$pres.Close(); $ppt.Quit()
```

(`render/` is gitignored.) On a box with LibreOffice + Poppler you can instead
use the pptx skill's standard `soffice.py` + `pdftoppm` pipeline.
