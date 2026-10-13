# Task ID V13 — Independent World 7 local post-promotion verification

**Decision: PASS for the local post-promotion World 7 gate.** The fresh local Vite app loaded the promoted v2 assets through their normal public URLs, with no `/assets/campaign/` route substitutions. All 11 World 7 files matched the promoted hashes, the all-campaign loader contracts passed, the prior integrated files and rollback inventory remained unchanged, and the representative real GameScene checks passed. This is a local pre-deployment result; it makes no live Worker claim.

## Freshness and public-file integrity

The runtime used a fresh Vite server at `http://127.0.0.1:5200/` on 2026-10-13. The 16-module S3 source pin matched at runtime start and end. `src/game/scenes/GameScene.ts` remains SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`. The only difference from the pre-promotion W7 source pin is the expected A8 `src/game/campaign/artManifest.ts` promotion update: prior `68acbb0606954c18193441c7f022dd7b285653f49cc27f095a9734d4d5f80800`, current `6356ea9f0b104c8440a25bf09f1bb9974f5c1c949db606ef0b7309c4b3c9c0e3`. All other pinned modules, including `enemyArt.ts`, remained byte-identical. See `source-and-candidate-pins.json` and the runtime `sourcePin` record.

All 11 promoted public PNGs were checked on disk and then hashed from their ordinary Vite HTTP responses during real campaign use. The runtime recorded **134 responses** across all promoted paths; every path returned HTTP 200, PNG content, and only its expected hash (`candidateTransport.allExact: true`).

| Asset | Public v2 path | SHA-256 |
|---|---|---|
| World panel | `/assets/campaign/world-map/sky_isles-v2.png` | `dc83257253d0f9906f916153aa236ee5b693cb988e2b760503df7de5d83b9494` |
| Map A | `/assets/campaign/maps/sky_isles_a-v2.png` | `98f5adff17d7b9b8e469238b12ef09bc39ab95ec3c8eb9b7fcad1c665e023a26` |
| Map B | `/assets/campaign/maps/sky_isles_b-v2.png` | `79c4bb5d3831c648b35c192f0c35aeeec1fa14db73830c75f915cce3eef9a660` |
| Map C | `/assets/campaign/maps/sky_isles_c-v2.png` | `e8967fcf6b32700efcf0105183313fc3fd6015bb43eaed681147d06d3b556fb0` |
| Map D | `/assets/campaign/maps/sky_isles_d-v2.png` | `b1e1caddce8899a663f8bb6312584fc102e6bba3df111c91c24ed0643d02818c` |
| Aether Drake | `/assets/campaign/enemies/sky_isles/aether_drake-atlas-v2.png` | `6127080ff7abdbe60dbf514836e59ac1fce1a398fe7c74b5e958701b89dc8d3a` |
| Cloud Skitter | `/assets/campaign/enemies/sky_isles/cloud_skitter-atlas-v2.png` | `f2581cf68be8769764dc2b347be104a0f9b8fbb5b4ea88bbfb345920f879de96` |
| Galeclaw | `/assets/campaign/enemies/sky_isles/galeclaw-atlas-v2.png` | `b2b8cde192c826776fabb8356490928c4c80611d0b203f6d70da8d27f0cfb2ec` |
| Stormguard | `/assets/campaign/enemies/sky_isles/stormguard-atlas-v2.png` | `ee13c36d209f3a750bce70b5fe16b408b225434ebe5007556944eca4fa37c5f3` |
| Tempest Herald | `/assets/campaign/enemies/sky_isles/tempest_herald-atlas-v2.png` | `8aac34b5a6783fc943b1333c8e035c19689840f26d03d2ada6a20bef86e20d49` |
| Stormmaw | `/assets/campaign/bosses/stormmaw_prime-atlas-v2.png` | `43eb4be1cda70caa1aa89830ecce8964952370312ffeb08110845864e6cb165b` |

The post-promotion manifest contains 120 assets and 44 globally unique integrated v2 IDs/keys/paths (33 previously deployed plus 11 World7 promotions), with all 44 final and no provisional flags. It exposes 87 final paths and 33 provisional paths. The independent loader audit compared `campaignGameplayAssetsForLevel` with `requiredAssetsForRequest` for all 100 campaign contexts, verified request-key uniqueness in each context, and confirmed every World7 gameplay ID and the panel are selected by real World7 contexts/loaders. The 11 new World7 rows also matched their key, path, kind, dimensions, final state, atlas frame size, state rows, and quality flags. The engine’s action clips were verified through registered EnemyView playback below; animation definitions are owned by the pinned `enemyArt.ts` module rather than duplicated in the campaign manifest.

All **33** earlier World4–6 deployed v2 files still match their recorded deployed hashes and dimensions. The **43** approved original PNGs and **77** v1 rollback PNGs also match the A0 inventory hashes and dimensions. The full records are in `local-contract-audit.json`.

## Real runtime coverage

The browser gate recorded **4 panel cases**, **16 standard map cases** (four families at 1440×900, 1280×720, 1024×768, and 844×390), and **2 compact boss cases** (320×390 and 360×360). It observed 20 action rounds, seven boss/lifecycle evidence cases, and 23 unchanged local profile snapshots. Browser errors, unexpected HTTP errors, failed requests, blocked API calls, assertion failures, and profile changes were all zero.

In all 18 stages the actual GameScene loaded the expected World7 map key and its real route, build plots, five visible registered towers, and five candidate enemy views. Each route had 8 points. The field held all 20 Map A plots, 15 Map B plots, and 14 plots each on Maps C and D; plot circles and interior route turns stayed inside the field. The candidate views used their stable registered keys and remained visible. The 844×390 captures were manually inspected: Maps A–C keep the roads, plot rings, and towers visible, including where decorative terrain approaches the road edge. Representative output: `screenshots/game-sky_isles_{a,b,c,d_boss}-844x390-mixed-walk.png`.

All five ordinary enemy views exercised registered idle/walk/attack/death actions and both facings across the standard viewport suite. Stormmaw’s real view exercised idle, walk, attack, special, phase-two, and death; its registered frame advanced, movement across interior route points did not re-fit or shift the camera, and the normal death/removal path hid the boss panel and removed the dying view while restoring the field. Its active `storm_surge` warning was separately captured from the promoted public files: telegraph state and callout were correct, the warning ROI changed 219 actual rendered pixels, and fit/camera remained stable. Evidence: `runtime-report.json`, `stormmaw-public-warning-recheck.json`, `screenshots/stormmaw-warning-active-844x390.png`, and `screenshots/stormmaw-death-cleanup-844x390.png`.

The authored Tempest support pulse used the real World7 level-67 roster plus a nearby stopped Cloud Skitter target in an unsaved QA fixture. During `tempest_haste` telegraph it made zero buff-animation calls and applied no speed buff. At resolution, the real consumer requested the registered `campaign_enemy_tempest_herald_buff` exactly once, applied the existing target speed effect, and changed the callout to “Nearby enemies hastened.” No direct action call or combat timing changes were used as proof. Evidence: `runtime-report.json` and `screenshots/tempest-natural-support-resolution-844x390.png`.

The real 844×390 GameScene gate also exercised pause/resume, speed 1→2→3→1, 1.25× zoom, pan, reset, resize to 320×390, and restoration. At both compact boss sizes the route/plot field remained visible and Stormmaw produced visible rendered pixels, consistent with the already accepted W7 compact captures. Fine terrain and sprite detail remain small at these sizes. The campaign panel screenshot shows W7 locked in the fresh profile; levels were launched through local QA fixtures without modifying profile data. Transient gold callouts appear in some seeded-tower screenshots and are part of the QA scene state, not part of the promoted map texture.

## Evidence, failures, and limits

- `local-contract-audit.json` — public file hashes, 100 loader contexts, 44 integrated rows, 120 rollback/original checks.
- `runtime-report.json` — actual local public HTTP responses and GameScene case/action/lifecycle details.
- `stormmaw-public-warning-recheck.json` — focused active warning screenshot and exact public map/boss response hashes.
- `candidate-inputs.json` and `source-and-candidate-pins.json` — selected public inputs, expected hashes, dimensions, source freshness, and manifest promotion delta.
- Representative manual captures: `screenshots/panel-844x390.png`, Map A–D 844×390 screenshots above, `screenshots/compact-stage-sky_isles_d_boss-320x390.png`, and the Tempest/Stormmaw captures above.

Two initial audit failures were harness expectation errors and are preserved in `harness-attempt-notes.md`. First, the check compared a previously deployed row’s `runtimeContract.path` (historical v1 baseline) with its deployed v2 path; the corrected check uses the deployed path/hash in the integration ledger and verifies the current manifest’s final metadata. Second, it expected animation definitions in `CAMPAIGN_ART_MANIFEST`; that manifest provides the atlas state rows while animation clips are registered through the pinned `enemyArt.ts` consumer. The corrected gate validates World7 row metadata and then verifies the actual registered EnemyView clips and frame advancement. Neither failure reproduced as a product defect.

Runtime QA instrumented the local `src/main.ts` response to expose the Phaser game object and stubbed only local GET account-configuration/session responses. `/assets/campaign/` responses were neither routed nor fulfilled by the harness. No real account, D1, public asset, source, Git, or production writes were made. The inherited QA badge in the screenshots still says `W7-V2`; the response records and v2 paths above establish that these captures came from the post-promotion public-file run.

No full application suite was rerun because the application source did not change beyond the intended local art-manifest promotion and the parent’s promotion report already records its suite/build/hash-preservation gates. No deployment or live Worker check was attempted; the old remote baseline before deployment is expected and is outside this local gate.

## Reproduction

```text
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/prepare-v13-inputs.cjs
rtk npm run dev -- --host 127.0.0.1 --port 5200
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/v13-local-contract-audit.cjs
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/build-v13-public-gate.cjs
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/v13-world7-public-gate.cjs
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/build-v13-warning-recheck.cjs
rtk node artifacts/campaign-final-art-20261012/verification/v13-postpromotion-world7/v13-stormmaw-public-warning.cjs
```
