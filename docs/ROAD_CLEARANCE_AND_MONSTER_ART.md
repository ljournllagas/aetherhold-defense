# Road clearance and monster artwork — 2026-10-11

The approved change applies to Classic and all thirty Campaign levels. Build plots now sit beside the road under one world-space policy, and all fifteen Campaign enemies and three bosses use painted animation atlases. Classic's nine existing painted archetypes were audited and retained.

## Placement

The visible 22-unit plot circle, including its widest 3-unit stroke, targets a 10-unit gap from the road shoulder. The accepted band is 6–14 units. Campaign uses its 25-unit outer road radius; Classic has a separately traced, varying-width painted-road envelope. Every plot covers at least 100 continuous route units with every base tower, remains inside the field, and is at least 52 units from other plot centers. Plot counts and indices, enemy routes, tower stats, monster stats and progression remain unchanged.

Existing candidates are relocated deterministically. Two difficult layouts have authored return-bend candidates so the original paid foundation-tower strategies remain viable. Classic has small soil clearings at its relocated tower footprints. Marker rendering and road rendering consume the same policy constants used for placement.

## Artwork and playback

All eighteen exact Campaign atlas paths are present under `public/assets/campaign/enemies/` and `public/assets/campaign/bosses/`, manifest-final, and allowlisted. The 472 required frames include idle, movement, attack, death, both support buffs and every declared boss phase/special state. Production PNGs retain transparent unused cells and consistent ground anchors. Painted content occupies 78% of each cell; the renderer compensates for that gutter and anchors the ground at 90% of cell height. Boss overlays use the same transform.

Artwork was produced with the built-in imagegen tool. Initial crowded sheets and one Marchling repair were rejected; widely separated poses were generated and boxed through transparent gutters. Packaging extracts complete individual poses, applies one scale per monster, aligns their ground baseline, and assembles the declared grid. It does not reuse a static pose to fill an animation.

Selected raw sources are preserved in [sources](../artifacts/road-monster-20261011/sources/). The exact final prompts and source hashes are in [generation.json](../artifacts/road-monster-20261011/generation.json); extraction rectangles, scale and output hashes are in [packaging.json](../artifacts/road-monster-20261011/packaging.json). Rejected attempts are recorded separately in [rejected-generation.json](../artifacts/road-monster-20261011/rejected-generation.json). Review boards cover [Borderkeep](../artifacts/road-monster-20261011/borderkeep-atlas-review.png), [Emberfall](../artifacts/road-monster-20261011/emberfall-atlas-review.png), and [Frostveil](../artifacts/road-monster-20261011/frostveil-atlas-review.png).

## Verification

- Full suite: 980 passed, 11 existing skips. Both existing natural-economy simulations retain their original victory, lives, score, boss and paid-purchase assertions. Independent code review identified no required fixes.
- [Pixel audit](../artifacts/road-monster-20261011/pixel-verification.json): all eighteen Campaign sheets, 472 distinct required frames and nine Classic archetypes passed dimensions, frame bounds, silhouette fit, transparency and anchor checks.
- [Animation review](../artifacts/road-monster-20261011/monster-runtime.json): 92 desktop/portrait cases cover both facings, declared states and Phaser pause/resume/speed behavior.
- [Actual wave review](../artifacts/road-monster-20261011/path-results.json): twelve captures across Classic and all three Campaign worlds show moving waves on the road. Living enemy route positions remain on the centerline within 0.000001 world units. Earlier animation galleries intentionally placed sprites at fixed review positions; they were not wave-path evidence.
- [Placement sweep](../artifacts/road-monster-20261011/placement-results.json) covers Classic and all thirty Campaign levels at 1280×720 and 390×844. [Viewport lifecycle checks](../artifacts/road-monster-20261011/viewport/v9-viewport-mask-results.json) cover overview, zoom/pan, resize, rotation and re-entry. [Boss checks](../artifacts/road-monster-20261011/boss-phases/boss-overlay-results.json) cover phases, thresholds, summons and pause/speed/restart.

Portrait/touch checks use browser emulation; physical-device verification is not claimed. Production release verification is recorded in [release-verification.json](../artifacts/road-monster-20261011/release-verification.json).

## Production release

Published to https://aetherhold-defense.ljournllagas.workers.dev/ using `npm run deploy`, which passed 980 tests and the TypeScript/Vite build before publishing. Worker version: `ab840606-6594-4732-9cc8-e05344a699a5`; bundle: `index-A85rsaQ4.js`. Live HTML, JavaScript, CSS and all eighteen new atlases are compared byte-for-byte to the built files; `/api/health` and browser startup are checked in the release record.
