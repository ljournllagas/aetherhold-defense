# Task ID W10-V2 — World10 staging runtime verification

## Decision

**Runtime integration: PASS for the pinned local staging build and exact candidate substitutions. Complete 11-asset package: FAIL / not ready for promotion.** The independent raw-art gate reports all four map candidates fail authored build-plot clearance; this runtime pass does not override that result. The panel and six monster atlases have independent raw PASS status in [W10-V1](../world10-raw/REPORT.md).

## Pinned inputs

- Frozen source: `src/game/scenes/GameScene.ts` SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`; 16 source inputs were pinned and remained unchanged during the run.
- Candidate package self-check SHA-256: `1a7e5441173cac919a342a2eb5c04838129d1457449baaa4f98986ea5802ee0c`.
- All eleven candidates were pinned before runtime, and the local browser transport served the expected bytes for every candidate path:

| Candidate | SHA-256 |
|---|---|
| World10 panel | `f8f435616240ba841b84bcd472bae3eeb961f0a6408c8d236363b94a0eeef083` |
| Map A | `9e8dcd07641684aa7bfc62b1526b850b63b8a110834e89b5774a1dbf8bbe2a9c` |
| Map B | `585893ced89df56dbafb42705b34fa6cbe09cd2cba8c3ca9d1dd751528b66776` |
| Map C | `66b32463a86e20f19b661d0e53a265ada6283d0ce069c8e8cf5f7690f20ac697` |
| Map D | `3d47e9cd2dc749ee8231fd39b91f83e6fd7bb9554d135a2b773aee9df408890b` |
| Aetherborn | `17323698c1f2bf34939390e56726bb2f5cd8b1f1f2307e1098fe81bdaa7beb30` |
| Crown Runner | `e177eae916c36c576c0190e411e6f46239e2c6bbe9f8f9600705486c1e6cf417` |
| Aether Seer | `026c459442aaa6e98ed9ce5be856b90005edafa1bfed6f54a26db401939c7c05` |
| Sentry Colossus | `31c9a5eda829070c05e0b2571eafaece2af1382859a0a26ee3ffd953932f2edc` |
| Crown Archon | `28098ac3e6433f91759c2327ab01614322e2e1e3152fd3ee78d7750fc91e9fb9` |
| Aether Devourer | `4ce4f9d0d079ae04968c6f4659f10822f8e603a84e68565602d5c9c7e03a103c` |

## Runtime coverage and results

Ran the real local Phaser/GameScene consumers with exact candidate responses, with unsaved DEV QA fixtures and profile/network guards. The final runtime artifact is [`w10-stage-gate-report.json`](w10-stage-gate-report.json); it records `runtimeOutcome: PASS`, no assertion failures, browser errors, failed requests, HTTP errors, or blocked API calls, and 178 exact candidate response fulfillments.

- Loaded the panel and all four map families at 1440×900, 1280×720, 1024×768, and 844×390, plus each map at 320×390 and 360×360. This produced six panel cases and 24 map cases. Each map case asserted the registered map texture, eight route waypoints, 13–15 authored build plots, five placed/registered towers, and five visible registered candidate enemies. Map/boss screenshots include the HUD and actual scene; for example, [`game-aether_crown_d_boss-844x390-mixed-walk.png`](screenshots/game-aether_crown_d_boss-844x390-mixed-walk.png).
- Exercised idle, walk, attack, buff where supported, and death through registered `EnemyView` actions on all five ordinary candidates at the four required viewports. Verified both facings and loop frame advancement. Unsupported buffs on non-support enemies were treated as unsupported, not as failures.
- Exercised the Aether Devourer at native 256-pixel frame resolution: both facings; idle and walk loops; attack, special, and phase-two actions; normal death/removal; boss status/callouts; and camera/field restoration. At 844×390 the visible figure and exposed violet core remain identifiable in the runtime capture; fine details are naturally small. See [`devourer-visual-review-crop-844.png`](screenshots/devourer-visual-review-crop-844.png) and the viewport captures referenced by the JSON report.
- Stepped authored boss events in 100 ms increments. The sequence recorded resistance, rift, Aether Ward, portal warning, rift-jump resolution, and exposed-core callouts without overlap. The portal warning remained visible through its 1,399 ms telegraph interval. Dying boss cleanup removed the view and status panel and restored the prior field/camera fit.
- Verified a natural Crown Archon support pulse in an unsaved level-96 QA setup by advancing the unpaused GameScene clock. The existing resolution path emitted one registered `campaign_enemy_crown_archon_buff` event (`buff_1`), one Aether Ward callout, and a resolution presentation with `telegraph:false`; no direct `playAction` call was used. This is an authored-caller QA setup, not earned gameplay. The screenshot is [`crown-archon-natural-resolution-844x390.png`](screenshots/crown-archon-natural-resolution-844x390.png).
- Verified zoom in, pan, reset, pause/resume, speed cycle and restore, resize from 844×390 to 320×390 and back, and boss removal restoration. Thirty-one QA profile snapshots were unchanged.

The separate [100-context contract audit](w10-contract-audit.json) passed: 100 campaign loader contexts, all ten World10 levels and their map-family assignments, 385 selected asset occurrences, and the World10 panel loader entry resolved to the expected manifest keys/paths. The eleven candidates remained in provisional manifest slots; the audit did not modify them or public assets. All 120 inventoried public/rollback assets were unchanged (43 original approved assets plus 77 other assets).

## Blocking acceptance finding

The runtime composition can render the maps and place towers, but the independent raw geometry/visual review finds major map scenery intersecting authored 23.5-unit build-plot rims across all four map families. Examples include a ruin at A0-04, columns at B0-11/B0-12, a broken wall and arch at C0-01/C0-04, and masonry/arch/tower structures at D0-02/D0-04/D0-05. The exact coordinates and contact sheets are in [W10-V1](../world10-raw/REPORT.md). That is a real candidate-art acceptance failure, not a runtime transport or fixture failure. Keep the panel and six atlas raw PASS decisions separate from the four failed map rows; rerun the raw plot-rim review and this staging gate on replacement map hashes.

## Attempts, limits, and evidence

An earlier boss warning capture appeared to combine two callouts. The harness had advanced the clock directly from zero past multiple authored events. That attempt is preserved in `w10-stage-gate-attempt-02-harness-catchup.json`; the final run uses 100 ms steps and shows the ordered event sequence above, so the earlier apparent overlap is classified as a verifier timing defect, not a product finding. The first contract audit attempt also caught a Vite source-module request as if it were an API; the route guard was narrowed to `/api/`, and the final audit has zero blocked API calls.

This was local staging with exact candidate substitutions only. No public assets, source, Git state, deployment, or account/profile data were changed. Runtime coverage does not certify raw pixel provenance; the independent raw gate remains required. Conversely, the raw map defect does not erase the observed runtime facts for this pinned build.

Primary evidence: [`source-and-candidate-pins.json`](source-and-candidate-pins.json), [`w10-stage-gate-report.json`](w10-stage-gate-report.json), [`w10-contract-audit.json`](w10-contract-audit.json), and the screenshots directory. The combined release decision remains **blocked on four replacement map candidates and fresh independent raw/runtime verification**.
