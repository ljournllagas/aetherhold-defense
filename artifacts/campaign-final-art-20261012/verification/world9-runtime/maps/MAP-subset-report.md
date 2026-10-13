# Task W9-V2 — World9 repaired-map runtime gate

**Decision: PASS for the four repaired map candidates in unsaved local staging.** The real CampaignScene panel and all 10 authored World9 GameScene layouts rendered with the pinned candidate map responses. Actual route and plot geometry remained visible and inside the battlefield mask at the required viewports. This decision covers maps and map fit only; it does not accept the World9 enemy atlases.

## Frozen inputs

The local runtime used the frozen GameScene SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4` and all 16 source-file hashes in `map-inputs.json`. Candidate files matched their pinned dimensions (1672×940 RGB) and were served only by intercepting their existing provisional map URLs in fresh browser contexts. No production, public, campaign-save, or account state was changed.

| Family | Candidate | SHA-256 | Actual level layouts |
|---|---|---|---|
| A | `astral-rift-map-a-repair-v2.png` | `be0ecbc01bfcd5b4fda7ffedd7a88485e7c9bf02d5978e9a28baa3f57ebd2b2e` | 81 `a`, 82 `a2`, 83 `a3` |
| B | `astral-rift-map-b-repair-v2.png` | `cf0e176ef41c74728f03256a5243bc77e73bc01c46de8d04bebe05b9456f3dab` | 84 `b`, 85 `b2`, 86 `b3` |
| C | `astral-rift-map-c-repair-v2.png` | `94b137421d54dcb87e46cde7adc71c0ab5ff5f1ae790443f66555bcb71652536` | 87 `c`, 88 `c2`, 89 `c3` |
| D | `astral-rift-map-d-repair-v3.png` | `3119f0db247fe479181964205235ed936f182f952362e31c8b75ecdbcd7814ab` | 90 `d_boss` |

## Runtime checks and visual review

The passing run used `w9-map-runtime.cjs` against a fresh local Vite server and Chromium contexts with service workers blocked. Each of the four family URLs returned the exact candidate PNG bytes (A/B/C: 18 requests each; D: 6). The decoded Phaser texture key matched the actual level family. There were 60 successful map cases: levels 81–90 at 1440×900, 1280×720, 1024×768, 844×390, 320×390, and 360×360. The real CampaignScene World9 panel was also captured at 1440×900, 844×390, and 320×390.

At every viewport, all 6 interior route points and all 168 sampled corridor positions per map (centerline plus ±25-world-unit edges along all seven route segments) stayed within the battlefield mask. All 147 build plots across the 10 layouts rendered, and every authored plot circle fit the mask. Each fixture showed five registered tower views and the authored level’s actual registered enemy views; at 844×390, a visible enemy animation frame advanced in each level. Gold/status HUD feedback remained visible. Campaign profile storage was byte-identical before and after every case; no unsupported API calls, browser errors, failed requests, or unexpected HTTP errors were observed.

Manual review of the fresh 844×390 and 320×390 contact sheets found continuous connected Astralstone ground under the complete route and plot footprints, with no painted cliffs or abyss beneath playable geometry. Roads, plot rings, and the five seeded towers remained distinguishable at compact sizes. The 10 route/plot compositions are materially different. The family floors share a restrained violet basalt style: A/B/C are visually close, while D has a more obvious darker, larger-slab treatment. That is a real limitation in family texture differentiation, but does not obscure the distinct live route and plot layouts or compromise ground continuity.

## Evidence

- Full 60-case runtime and source-freshness report: `w9-map-runtime-report.json`.
- Compact per-viewport geometry and review index: `visual-review-summary.json`.
- All 60 individual GameScene screenshots and three CampaignScene panel screenshots: `screenshots/`.
- Actual-render contact sheets: `contact-world9-844x390.png` and `contact-world9-320x390.png`.
- Frozen source/candidate/provenance inputs: `source-pin.json`, `map-inputs.json`, and `candidate-static-audit.json`.
- Producer provenance and selfcheck pins: provenance SHA-256 `060c61d94a5b45c8236d6352b77b2eeddd970bde3d7d524d7d42a8582097fe66`; selfcheck SHA-256 `2fc9f997956980e01d68b24806ab48a888727a62f7146660c241a6d349639b0c`.

The initial harness attempt timed out before launching GameScene because the DEV QA fixture omitted its required `bossPhase: "initial"`. That attempt is preserved in `w9-map-runtime-attempt-1-report.json`; it was a test-setup error, not a product result. The corrected harness run completed all 63 panel/map captures and passed.

**Limit:** this map-only gate did not review the repaired Rift Weaver or Rift Sovereign atlas candidates, animation/body quality, full campaign actions, or natural boss/support lifecycle. Those remain in the separately scoped W9 full-atlas gate.
