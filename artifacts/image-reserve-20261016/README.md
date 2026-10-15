# Victory, relic and Living Archive art reserve

Authorized scope: 27 images: ten world victory paintings, ten existing relic showcases and seven Living Archive preproduction assets. This is the next batch after ../image-reserve-20261015/; the previous 44 masters remain unchanged. No game integration or deployment is part of this reserve task.

## Use this with another AI model
Open index.html, choose one image and provide it with its matching integration-prompts/*.md file plus repository access. Every entry has a saved generation prompt and stable relative image path. manifest.json records identity, intended use, source lineage and completion state; file-validation.json records actual size, alpha bounds and SHA256. references/index.json maps portable reference copies to original paths. Resolve old-machine reference paths through that index when moving this package.

## Generic integration prompt
Read README.md, manifest.json, file-validation.json, visual-review.md and the selected actual image. Preserve unrelated work. Integrate only this selected use case, reuse current loaders/UI and retain accessible runtime text. Measure actual dimensions and alpha bounds; generation instructions are intentions, not proof. Add proportional tests and desktop/phone visual checks. For application changes follow AGENTS.md: npm run deploy must pass tests/build before publishing; verify live HTML/current JS bundle and /api/health; commit/push the bounded verified change and verify remote HEAD.

## Compatibility
Victory paintings are result illustrations; never replace runtime terrain with them. Use existing world IDs and real boss completion boundaries. Relic showcases retain current PowerUpId values and effects and supplement the combat icon atlas. Living Archive is new, unimplemented content: its five cutouts are single static design masters. No animation, atlas frames, gameplay rules or save schema changes are supplied by the images. Terrain is a quiet background for separately verified runtime geometry. Keep text and controls outside raster art; fit illustrations around accessible phone controls.

Retain lossless masters. Derive WebP during integration, and measure real alpha/ground/muzzle bounds rather than assuming requested margins were achieved. Raw alpha residue and any edge warnings must remain visible in validation/review notes. No image pixels are modified by the verifier. Use imagegen for any needed image corrections, save versioned candidates and retain rejected drafts.

## Resume and verify
Inspect generation-jobs.json, manifest.json, actual files and any live generation handle before restarting. Never regenerate an already saved master solely because a stale status says pending. One built-in imagegen call per distinct asset. Run python verify_assets.py (Python 3 and Pillow required). A decoded image is not runtime acceptance. Finish individual visual review and any repairs before declaring the package complete. Commit/push only this bounded package under AGENTS.md authorization; do not deploy an inert reserve.

## Completed review
All 27 masters were individually inspected. File validation confirms 27 original-to-copy SHA256 matches. All 15 transparent masters have faint raw-alpha edge residue; none has alpha >=16 touching the canvas edge. Preserve this warning and review exports against light/dark backgrounds. Use measured bounds for scaling. No runtime phone layout, animation or gameplay acceptance is claimed. See visual-review.md.
