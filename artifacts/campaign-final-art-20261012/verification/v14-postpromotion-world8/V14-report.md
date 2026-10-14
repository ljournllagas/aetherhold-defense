# Task ID V14 — Independent World8 local post-promotion verification

**Decision: PASS for the local post-promotion World8 gate.** A fresh local Vite app loaded the 11 promoted World8 assets from their ordinary public v2 URLs, with no campaign-asset substitutions. Public bytes, loader contracts, all 100 campaign contexts, the previous 44 integrated v2 files, and the 120-file approved-original/rollback inventory matched their pins. The current GameScene rendered the panel and four real maps at the four required viewports and compact sizes; the registered Regent, its six actions, the 1200 ms transition, the real Echo Shade support hook, and normal lifecycle controls passed focused runtime checks.

This is a local pre-deployment result. No remote or live Worker check was attempted; World8 being absent remotely before the deployment operator runs is expected.

## Freshness and exact public assets

The fresh Vite server ran at `http://127.0.0.1:5220/`. The 16-file S3 pin matched at the end of the test. `src/game/scenes/GameScene.ts` is SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`; `src/game/campaign/artManifest.ts` is `6e016e7e476faf5fa319b80d1aa38d186745cdd6b9cd520f29e23923bf395129`.

The independent runtime observed **178** ordinary Vite responses across the 11 public paths. Each response was HTTP 200 PNG content and every observed body for a path matched its expected hash; no asset request was intercepted or fulfilled by the QA harness. The local promotion ledger recorded 11 newly promoted assets, 44 earlier World4–7 deployed assets, and 22 pending assets (55 integrated v2 assets total).

| Asset | Ordinary public v2 path | SHA-256 |
|---|---|---|
| World panel | `/assets/campaign/world-map/dreadmoon-v2.png` | `5265dc72db5643fcc1aeb053de8c0f106257aa7aa383d2bb1f9e412631ff8f57` |
| Map A | `/assets/campaign/maps/dreadmoon_a-v2.png` | `1e9948f299017acf0a1831d911496f859666205d9245d8797a3422feb59dc9a8` |
| Map B | `/assets/campaign/maps/dreadmoon_b-v2.png` | `b48f3e80abb216782fbc24fc28ce215f126947a7878eeaf3758dec148c07d5e1` |
| Map C | `/assets/campaign/maps/dreadmoon_c-v2.png` | `b052f72f6a0e9ef861728d52b0fc39c7e6ef995b618c8378a50519fb5af11095` |
| Map D | `/assets/campaign/maps/dreadmoon_d-v2.png` | `75e57c7913b871523513130b1cbb5d1575e613e6e0a901b38600ff8b02d1a100` |
| Shadeborn | `/assets/campaign/enemies/dreadmoon/shadeborn-atlas-v2.png` | `afe8203fd49130e5fc44da7205e941b66f8f552a5ff4753c389e03b048d7ff56` |
| Dusk Runner | `/assets/campaign/enemies/dreadmoon/dusk_runner-atlas-v2.png` | `7b0cc66af71cc0f62e1fe0e02dbfc93f3f55b34aa096a990c1821e13791e4a33` |
| Moonstalker | `/assets/campaign/enemies/dreadmoon/moonstalker-atlas-v2.png` | `d3584094b09d7700617fecc591f9b07435ed727b56567290d38a8517ef1776ff` |
| Grave Hulk | `/assets/campaign/enemies/dreadmoon/grave_hulk-atlas-v2.png` | `4cf391664b3403e12fc10c8d70dae25e5346232f9e5f39637baa092092e11294` |
| Echo Shade | `/assets/campaign/enemies/dreadmoon/echo_shade-atlas-v2.png` | `d51cb8c255ef3abab0ae3d52d2fe281b66408b4d4c96d5a5c3d3e28da16e1b97` |
| Umbral Regent | `/assets/campaign/bosses/umbral_regent-atlas-v2.png` | `84be00d661c6257be484845715d45308b61fb1028fa5e937db2b4b8aec79fba4` |

The full response list and per-path counts are in `v14-public-runtime-report.json`; source and candidate pins are in `source-and-candidate-pins.json`, `source-pin.json`, and `final-freshness-check.json`.

## Contracts and preservation

The actual local manifest exposes 120 rows, 98 final paths, and 22 provisional paths. In the fresh browser audit, `campaignGameplayAssetsForLevel` matched `requiredAssetsForRequest` for all **100** campaign contexts; every context had unique keys. The 55 integrated v2 rows had globally unique IDs, keys, and paths, with final metadata and no provisional markers. All 11 promoted rows matched their expected stable key, path, type, dimensions, atlas state rows, and quality flags; the World8 maps and enemy/boss IDs were selected by actual Dreadmoon level contexts, and its panel was selected by the campaign panel loader.

All **44** earlier World4–7 public v2 files still match the independent V13 path/hash pins. The **120** approved-original and v1 rollback files also match the preflight inventory: 43 approved originals and 77 v1 rollback assets. The detailed records are in `local-contract-audit.json`.

## Actual runtime and visual observations

The fresh Phaser GameScene rendered the Dreadmoon panel at **1440×900, 1280×720, 1024×768, 844×390, 320×390, and 360×360**. It rendered maps A–D at all four required sizes plus both compact sizes (**24 map cases**). Each case asserted the registered map texture, actual route and build plots, five registered visible tower views, five visible registered World8 enemy views, and visible gold-cost feedback. Routes, plot circles, occupied towers, and the field mask remained present in all inspected 844×390 and compact samples. At 844×390 the Regent field is 844×258 with fit scale 0.3861 versus 0.4418 on ordinary maps; its registered sprite has a 55×54 actual changed-pixel footprint. At 320×390 the boss map remains in frame and the Regent is visible, though creature and terrain details are necessarily small. Representative captures: `screenshots/panel-844x390.png`, `screenshots/game-dreadmoon_d_boss-844x390-mixed-walk.png`, and `screenshots/game-dreadmoon_d_boss-320x390-mixed-walk.png`.

Five actual registered ordinary enemy views advanced idle, walk, attack, buff where supported, and death over all four required viewport sizes. The Regent’s real registered EnemyView completed idle, walk, attack, special, phase-two, and death in both facings on the public v2 path at 844×390. Frames advanced for every action and one-shots returned to locomotion where expected. See `v14-regent-actions-public-report.json` and its twelve action captures.

The real level-80 Regent threshold entered the active “Echoes forming” telegraph. In a paused local QA fixture, the actual boss system remained telegraphing at game time +1199 ms and resolved at +1200 ms to “Two echoes emerge” with two registered clones. The separate clean active-warning screenshot is `screenshots/regent-warning-active-844x390.png`; the 1200 ms resolution is `screenshots/regent-warning-resolution-1200ms-844x390.png`. The older `regent-phase-warning-844x390.png` emitted by the inherited broad harness shows the post-resolution callout, so it is retained as a non-warning-stage capture and not used to support the warning verdict. `v14-regent-warning-public-report.json` contains the exact public boss response hash and state assertions.

The real unpaused level-76 Echo Shade support path was exercised with an explicitly labeled, unsaved QA setup and adjacent injured Shadeborn target. At “Doubles forming,” the actual consumer made zero buff-animation calls. At resolution, it requested the registered Echo Shade buff exactly once and created two decoys. This support summons decoys rather than healing the seeded ally, so unchanged ally HP is expected. No direct `playAction` call served as proof; instrumentation counted only the existing consumer call. Captures: `screenshots/echo-shade-natural-telegraph-844x390.png` and `screenshots/echo-shade-natural-resolution-844x390.png`.

The real GameScene control pass exercised pause/resume, speed 1→2→3→1, 1.25× zoom, deliberate pan, reset, resize to 320×390, and restoration to 844×390. The Regent’s standard warning/death path hid the boss panel, removed the dying view, and restored ordinary map fit after cleanup. All 31 campaign-profile snapshots were unchanged. Browser errors, failed requests, unexpected HTTP errors, blocked API calls, and assertion failures were zero.

## Evidence, method, and limits

- `local-contract-audit.json` — 100 loader contexts, 55 integrated manifest rows, 44 prior public files, 120 rollback/original files, and source hashes.
- `v14-public-runtime-report.json` — 6 panel cases, 24 map cases, ordinary public response hashes, enemy actions, field fit, controls, lifecycle, profile checks, and screenshot hashes.
- `v14-regent-actions-public-report.json` — six Regent actions in both facings using ordinary public bytes.
- `v14-regent-warning-public-report.json` — active 1200 ms warning and exact resolution using the ordinary public Regent atlas.
- `source-and-candidate-pins.json`, `final-freshness-check.json`, `candidate-inputs.json` — exact source, promotion-ledger, candidate/public bytes, dimensions, and freshness.
- Main reproduction commands: `rtk node .../prepare-v14-inputs.cjs`; `rtk node .../v14-local-contract-audit.cjs`; `rtk node .../v14-public-runtime.cjs`; `rtk node .../v14-regent-warning-public-recheck.cjs`; `rtk node .../v14-regent-actions-public-recheck.cjs`; and `rtk node .../v14-final-freshness-check.cjs`.

The browser harness instrumented only local `src/main.ts` startup to expose the Phaser game object and stubbed local account/session GETs. It did not intercept `/assets/campaign/` responses. The compact panel and level strip are dense at 320×390; their focused UI acceptance is reused from the earlier World8 staging review. Campaign fixtures and profile checks were local and unsaved. No account, D1, production, source, public-file, Git, or deployment writes were made. The already accepted World8 raw/staging reviews cover the same exact PNG hashes; this pass focuses on the promoted public consumers and their local v2 paths rather than repeating raw atlas segmentation review.
