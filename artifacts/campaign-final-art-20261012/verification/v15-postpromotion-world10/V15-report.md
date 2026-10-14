# Task ID V15 — World10 local postpromotion public-consumer gate

**Decision: PASS for the local postpromotion public-consumer gate.** This is not a live/deployment check.

## Pinned inputs and local integrity

- GameScene SHA-256: `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`.
- Frozen source pin covers 16 game files. Final freshness recheck passed; the 16 files still match the pin.
- Exact promoted World10 candidates and canonical public paths are pinned in [`candidate-inputs.json`](candidate-inputs.json). All 11 local public PNGs match their promoted SHA-256 and dimensions.
- Offline preservation audit passed: all 66 final v2 public files match, including the exact 11 World10 files and 55 earlier v2 files. All 120 approved original/rollback assets remain hash- and dimension-identical (43 originals, 77 v1 rollback files).
- Current local status at the audit: 55 previously deployed, 11 promoted locally, 11 pending. Remote availability was not checked; World10 being absent remotely before publication is the expected state.

## Actual local public runtime

Ran a fresh Vite server at `http://127.0.0.1:5272/` and Playwright Chromium with fresh browser contexts and service workers blocked. No `/assets/` requests were intercepted or substituted. Only local account configuration/session API routes were handled; no blocked API routes or account/progression writes occurred. Campaign-profile snapshots were unchanged in every context.

The actual imported manifest contained 120 unique rows, and all 100 campaign level contexts selected the same campaign assets as `requiredAssetsForRequest`. The campaign panel loader selected the World10 panel. The manifest contained all 66 promoted v2 rows with exact keys, paths, dimensions, sheet states, final state, no temporary marker, and no provisional quality flags. It listed 109 final paths and 11 provisional paths, leaving the pending World9 cohort provisional. Playback animation definitions live in the runtime animation contract rather than the campaign manifest rows; registered EnemyView playback was exercised below.

All 11 World10 resources were fetched from ordinary public URLs. Each was HTTP 200, `image/png`, and its captured response-body SHA-256 matched the promoted file. Phaser exposes decoded image sources as `blob:` URLs, so exact public provenance is established by the captured request path/body hash together with the live texture key and rendered entity, rather than by the internal blob URL.

| Public asset | Runtime key | SHA-256 |
|---|---|---|
| `/assets/campaign/maps/aether_crown_a-v2.png` | `campaign_aether_crown_a` | `2a5a18c73d4914f8451b0d8b74c9a936f8a611c2db1879c2269a468fa339daa9` |
| `/assets/campaign/maps/aether_crown_b-v2.png` | `campaign_aether_crown_b` | `066eda646130c0847701b1f1694104f276fa24fccd81ec07c688ae445f11097b` |
| `/assets/campaign/maps/aether_crown_c-v2.png` | `campaign_aether_crown_c` | `024234dcf969ccea0f76141471a2b200815bb15e0cb4b99be46bbc7b5db2d964` |
| `/assets/campaign/maps/aether_crown_d-v2.png` | `campaign_aether_crown_d` | `49e427473869ca967add41f80d237e2b2978b467dc3218cc0f0493e0da6926cb` |
| `/assets/campaign/world-map/aether_crown-v2.png` | `campaign_worldmap_aether_crown` | `f8f435616240ba841b84bcd472bae3eeb961f0a6408c8d236363b94a0eeef083` |
| `/assets/campaign/enemies/aether_crown/aetherborn-atlas-v2.png` | `campaign_enemy_aetherborn` | `17323698c1f2bf34939390e56726bb2f5cd8b1f1f2307e1098fe81bdaa7beb30` |
| `/assets/campaign/enemies/aether_crown/crown_runner-atlas-v2.png` | `campaign_enemy_crown_runner` | `e177eae916c36c576c0190e411e6f46239e2c6bbe9f8f9600705486c1e6cf417` |
| `/assets/campaign/enemies/aether_crown/aether_seer-atlas-v2.png` | `campaign_enemy_aether_seer` | `026c459442aaa6e98ed9ce5be856b90005edafa1bfed6f54a26db401939c7c05` |
| `/assets/campaign/enemies/aether_crown/sentry_colossus-atlas-v2.png` | `campaign_enemy_sentry_colossus` | `31c9a5eda829070c05e0b2571eafaece2af1382859a0a26ee3ffd953932f2edc` |
| `/assets/campaign/enemies/aether_crown/crown_archon-atlas-v2.png` | `campaign_enemy_crown_archon` | `28098ac3e6433f91759c2327ab01614322e2e1e3152fd3ee78d7750fc91e9fb9` |
| `/assets/campaign/bosses/aether_devourer-atlas-v2.png` | `campaign_enemy_aether_devourer` | `4ce4f9d0d079ae04968c6f4659f10822f8e603a84e68565602d5c9c7e03a103c` |

## Render and lifecycle evidence

- Captured the actual CampaignScene World10 panel at 1440×900, 1280×720, 1024×768, 844×390, 320×390, and 360×360. It loaded the public panel key and opened at level 91; profile snapshots were unchanged.
- Captured real GameScene levels 91/map A, 94/map B, 98/map C, and 100/map D across those same six viewports: 24 stage renders. Every case had the exact public map texture key, five registered visible tower views, registered real EnemyViews for that level’s authored roster, visible gold feedback, and all authored plot circles inside the live field. All interior route points were inside the camera field. Map C rendered the five World10 regular enemies; map D rendered the registered Aether Devourer boss. No browser errors, failed requests, or unexpected HTTP errors occurred.
- At 844×390, the actual walk animation advanced from `walk_0` to `walk_2` over 300 ms for map A, B, C, and D (including the actual Aether Devourer view); each kept its registered `_walk` animation.
- The seeded level-100 QA boss was killed through the regular GameScene `killEnemy` path at 844×390. The registered view advanced from `death_0` to `death_3` after 320 ms; death cleanup completed, removed the boss view, hid its panel, and restored the ordinary field/camera field. QA was unsaved and did not write a campaign result.
- The World10 level-98 QA context advanced on the normal unpaused GameScene clock with an injured nearby Aetherborn and a registered Crown Archon. The observed pre-resolution state had zero buff actions and `telegraph: false`. At the authored resolution, the actual registered EnemyView received exactly one `campaign_enemy_crown_archon_buff` event, showed the `Aether ward raised` callout, and still reported no telegraph. No direct `playAction` call was used as proof. This check verifies presentation routing; it does not assert a health change.
- Manually inspected the saved compact panel, map A/B/C/D at 844×390, map D at 320×390, and Crown resolution capture. The public terrain families are distinct in the actual stage, and the authored tower, unit, and boss views render in their expected positions. The compact battlefield is smaller than the window due to aspect-fit: ordinary maps at 320×390 use a 320×158 field with fit scale about 0.271; boss map D uses 320×210 with fit scale about 0.251. The 844×390 ordinary map field is 844×258 at fit scale about 0.442. Screenshots preserve the actual compact-size detail; this gate does not claim fine-detail readability at that scale.

## Evidence and method

- [`v15-public-runtime-report.json`](v15-public-runtime-report.json) — final browser run, response hashes, 100-level contract audit, 32 screenshots’ paths/checksums, stage assertions, profile snapshots, boss lifecycle, and Crown resolution observations.
- [`local-public-audit.json`](local-public-audit.json) — 66 v2, 55 prior v2, 120 baseline, and 16-file source integrity audit.
- [`source-and-candidate-pins.json`](source-and-candidate-pins.json) — frozen source hashes plus 66 final-v2 manifest pins.
- [`screenshots/`](screenshots/) — final run’s actual Chromium captures. The final runtime JSON records each relative path and SHA-256.
- Commands/method: `rtk npm run dev -- --host 127.0.0.1 --port 5272 --strictPort`; then bundled Node + Playwright running `v15-public-runtime.cjs`. The server was stopped after capture.
- Earlier harness-attempt reports are retained as `v15-public-runtime-attempt-1-report.json` through `v15-public-runtime-attempt-9-report.json`. Those failures came from harness routing/metadata assumptions or Phaser’s blob-backed source behavior; they did not modify application code. The passing final run uses the exact public-response body hashes and live rendered consumers.

The producer’s full test/build checks were not repeated because this bounded gate found no production issue. This report verifies the frozen local postpromotion source and local public files only; the deployment operator must perform the separate publication and live check.
