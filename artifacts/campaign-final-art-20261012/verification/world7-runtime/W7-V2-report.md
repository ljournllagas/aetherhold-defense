# Task ID W7-V2 — World 7 staged runtime verification

## Outcome

**Runtime, registration, movement, interaction, lifecycle, and route/plot-clearance gates: PASS.** The frozen S3 source served all 11 exact World 7 candidates through their existing stable keys in local unsaved DEV QA, with no candidate URL substitutions in public assets. I found no runtime, console, network, source-freshness, or account-profile failures.

**Final compact-screen readability decision: UNVERIFIED / parent-owned.** At 320×390 and 360×360, the route and all plot geometry remain in the field and the real boss produces visible pixels, but the actors, towers, and terrain are small. The captures and measured extents below are provided for the parent’s visual decision.

## Pinned inputs and freshness

The actual runtime run was 2026-10-13 12:42:35–12:44:12 UTC. The 16-file frozen-source pin was rechecked after the run and matched `source-pin.json`; see `freshness-and-input-check.json`. Key source hashes:

| Source | SHA-256 |
|---|---|
| `src/game/scenes/GameScene.ts` | `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4` |
| `src/game/ui/layout.ts` | `3dc634f192e79863359e7866781c0e33182cd339521b49f7d0bfd00069877e0a` |
| `src/game/ui/viewport.ts` | `d1df0b9f753c429fa3e57cd8d2af87ea087533f315038fd5cb796c7b52642c31` |
| `src/game/art/enemyArt.ts` | `1cebc2b6dc9f5bbca348ca206619c88e13ae939c84f18c80ecc2f85dfaae5045` |
| `src/game/campaign/artManifest.ts` | `68acbb0606954c18193441c7f022dd7b285653f49cc27f095a9734d4d5f80800` |

Every candidate was checked against the raw-reviewed exact bytes before use and the served response hash matched throughout the run (`candidateTransport.allExact: true`).

| Candidate | SHA-256 |
|---|---|
| World panel | `dc83257253d0f9906f916153aa236ee5b693cb988e2b760503df7de5d83b9494` |
| Map A | `98f5adff17d7b9b8e469238b12ef09bc39ab95ec3c8eb9b7fcad1c665e023a26` |
| Map B | `79c4bb5d3831c648b35c192f0c35aeeec1fa14db73830c75f915cce3eef9a660` |
| Map C | `e8967fcf6b32700efcf0105183313fc3fd6015bb43eaed681147d06d3b556fb0` |
| Map D | `b1e1caddce8899a663f8bb6312584fc102e6bba3df111c91c24ed0643d02818c` |
| Aether Drake | `6127080ff7abdbe60dbf514836e59ac1fce1a398fe7c74b5e958701b89dc8d3a` |
| Cloud Skitter | `f2581cf68be8769764dc2b347be104a0f9b8fbb5b4ea88bbfb345920f879de96` |
| Galeclaw | `b2b8cde192c826776fabb8356490928c4c80611d0b203f6d70da8d27f0cfb2ec` |
| Stormguard | `ee13c36d209f3a750bce70b5fe16b408b225434ebe5007556944eca4fa37c5f3` |
| Stormmaw | `43eb4be1cda70caa1aa89830ecce8964952370312ffeb08110845864e6cb165b` |
| Tempest Herald | `8aac34b5a6783fc943b1333c8e035c19689840f26d03d2ada6a20bef86e20d49` |

## Per-candidate verdict

| Candidate | Result | Runtime evidence / limitation |
|---|---|---|
| World panel | PASS | Existing campaign selection renders exact candidate at all four required sizes. |
| Map A | PASS | Exact texture/key in GameScene; 8 route points, 20 plot circles, five towers, and all five candidate views in field at all four required sizes. |
| Map B | PASS | Exact texture/key in GameScene; 8 route points, 15 plot circles, five towers, and all five candidate views in field at all four required sizes. |
| Map C | PASS | Exact texture/key in GameScene; 8 route points, 14 plot circles, five towers, and all five candidate views in field at all four required sizes. |
| Map D | PASS | Exact texture/key in boss GameScene; 8 route points, 14 plot circles, five towers, and all five candidate views in field at all four required sizes plus 320×390 and 360×360. Compact visual readability remains parent-owned. |
| Aether Drake | PASS | Actual registered view visible; idle, walk, attack, and death frames checked, including both facings. |
| Cloud Skitter | PASS | Actual registered view visible; idle, walk, attack, and death frames checked, including both facings. |
| Galeclaw | PASS | Actual registered view visible; idle, walk, attack, and death frames checked, including both facings. |
| Stormguard | PASS | Actual registered view visible; idle, walk, attack, and death frames checked, including both facings. |
| Tempest Herald | PASS | Actual registered view visible; idle/walk/attack/death and both facings checked. Natural authored support resolution emitted exactly one registered buff action; no action during telegraph. |
| Stormmaw | PASS | Actual registered boss view visible; idle, walk, attack, special, phase-two, and death checked. Warning, movement, field fit, cleanup, and 320×390/360×360 visible-pixel evidence retained. Compact visual readability remains parent-owned. |

## Checks and results

- Loaded the real campaign panel at 1440×900, 1280×720, 1024×768, and 844×390. Each rendered the candidate 768×432 panel. Evidence: `screenshots/panel-{1440x900,1280x720,1024x768,844x390}.png`.
- Ran all four map families at those same viewports and Map D at 320×390 and 360×360. Each map had its expected key and dimensions, 8 route points, five registered visible towers, and all five registered candidate enemy views. Every plot center and circle stayed in the battlefield field; no interior route point or build geometry fell outside it. Counts by family: A 20 plots, B 15, C 14, D 14. A/B/C/D map and field evidence is in `w7-stage-gate-report.json`; representative captures are `screenshots/game-sky_isles_{a,b,c,d_boss}-{1440x900,844x390}-mixed-walk.png`.
- Inspected actual Map A–C terrain, road, plot rings, and tower context at desktop and 844×390 sizes. The near-edge decorative terrain did not cover or stain the road surface or consume plot clearance in the rendered views. This is a bounded visual check, not an exhaustive pixel collision proof.
- Checked all five enemy views’ supported idle/walk/attack/death registrations and both facings; action frames advanced where expected. Tempest’s buff is a supported presentation action. These are explicit DEV-QA presentation calls, not claims about naturally occurring ordinary combat attacks. Evidence: `screenshots/actions-*.png` and `screenshots/candidate-facing-*.png`.
- Checked the actual Stormmaw registered view at all four required sizes, both facings, idle/walk and its attack, special, and phase-two clips. All six actions (including death) were exercised; moving the boss among first, middle, and last interior route positions did not change the fitted camera. Its native atlas cell is 256 px; runtime cap and actual rendered bounds/pixel differences are recorded per viewport in `w7-stage-gate-report.json`. Stable hidden-image baselines were 0 changed pixels.
- Exercised real boss death/removal in GameScene: the death frame advanced, the view was cleaned up, the boss status panel disappeared, and field/camera fit restored. Evidence: `screenshots/stormmaw-death-cleanup-844x390.png`.
- Checked pause/resume, speed 1→2→3→1, 1.25× zoom, deliberate pan, reset, resize from 844×390 to 320×390 and back, and field/camera restoration. Evidence: `interactions` in `w7-stage-gate-report.json`.
- Verified the Tempest support path with the authored level-67 setup and a nearby surviving ally, explicitly labeled QA setup. During its telegraph there were zero buff calls/actions and no ally speed buff. At resolution, the real consumer emitted one registered buff action, the ally’s speed-buff timer advanced, and the callout changed to the resolved state. Evidence: `supportCase` in the main report and `screenshots/tempest-natural-support-resolution-844x390.png`.
- Re-ran the Stormmaw warning capture at the actual warning interval. It showed a live `storm_surge` telegraph, visible blue ring/lightning cue, and “Stormmaw · Storm Surge gathering” callout without a camera/fit change. Evidence: `stormmaw-warning-recheck.json`, `screenshots/stormmaw-warning-active-844x390.png`, and `screenshots/stormmaw-warning-before-844x390.png`.
- 23 local profile snapshots remained unchanged. No browser errors, HTTP errors, failed requests, blocked API calls, or assertion failures were recorded. No account, production, public asset, or source writes were made.

## Compact view and limits

The actual Stormmaw render changed 897 pixels within a 46×31 px extent at 320×390 and 746 pixels within 39×28 px at 360×360; stable hidden baselines were zero. At 844×390 it changed 1,581 pixels within 57×43 px. These are real rendered-pixel measurements, not atlas bounds. The compact captures show the field fitting with routes and plots present, while fine terrain and unit detail is smaller; parent review should decide whether that compact presentation meets the product’s readability bar.

The first gate attempt was retained as `w7-stage-gate-attempt-01-fail.json`: its assertion incorrectly expected a Stormmaw special clip during telegraph. Source behavior and the corrected capture establish that Stormmaw uses a vector warning cue during telegraph and a separate registered `special` action; this was a harness expectation error, not a product failure. The earlier `stormmaw-phase-warning-844x390.png` was captured after resolution and is not used as warning evidence. A focused warning rerun corrected the timing. The first warning-recheck startup failure (`stormmaw-warning-recheck-startup-fail.png`) was also harness-only: a broad mock intercepted `/src/api/...`; the corrected route mocks only `/api/` endpoints.

The runtime used Chromium/Playwright against local Vite with response interception for the 11 exact candidate assets. This verifies staged consumers and interactions, not production publication. Root-owned final compact readability judgement remains open.

## Reproduction

From the project root, the prepared input audit and actual runtime harness were run with:

```text
rtk node artifacts/campaign-final-art-20261012/verification/world7-runtime/prepare-w7-inputs.cjs
rtk node artifacts/campaign-final-art-20261012/verification/world7-runtime/w7-stage-gate.cjs
rtk node artifacts/campaign-final-art-20261012/verification/world7-runtime/recheck-stormmaw-warning.cjs
```

The raw run, source pin, hashes, fixtures, screenshots, focused correction, and derived metrics are preserved beside this report under `verification/world7-runtime/`.
