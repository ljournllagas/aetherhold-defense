# World 8 local v2 integration report

**Task ID A9. Decision:** the parent accepted all eleven World 8 assets for local integration. The exact pinned candidate bytes are copied to their canonical v2 public paths and registered as final under their existing stable IDs and runtime keys. Independent V14 post-promotion verification passed and O7 deployed World8. Exact live release checks passed; authenticated production gameplay remains unverified behind Google sign-in.

## Promoted candidates

| Asset | Dimensions | SHA-256 | Selected candidate | Canonical public v2 path |
|---|---:|---|---|---|
| Map A (map:dreadmoon:a) | 1672x940 | 1e9948f299017acf0a1831d911496f859666205d9245d8797a3422feb59dc9a8 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-map-a.png | /assets/campaign/maps/dreadmoon_a-v2.png |
| Map B (map:dreadmoon:b) | 1672x940 | b48f3e80abb216782fbc24fc28ce215f126947a7878eeaf3758dec148c07d5e1 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-map-b.png | /assets/campaign/maps/dreadmoon_b-v2.png |
| Map C (map:dreadmoon:c) | 1672x940 | b052f72f6a0e9ef861728d52b0fc39c7e6ef995b618c8378a50519fb5af11095 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-map-c.png | /assets/campaign/maps/dreadmoon_c-v2.png |
| Map D (map:dreadmoon:d) | 1672x940 | 75e57c7913b871523513130b1cbb5d1575e613e6e0a901b38600ff8b02d1a100 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-map-d.png | /assets/campaign/maps/dreadmoon_d-v2.png |
| World panel (world-panel:dreadmoon) | 768x432 | 5265dc72db5643fcc1aeb053de8c0f106257aa7aa383d2bb1f9e412631ff8f57 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-world-panel.png | /assets/campaign/world-map/dreadmoon-v2.png |
| Shadeborn (enemy:shadeborn) | 768x512 | afe8203fd49130e5fc44da7205e941b66f8f552a5ff4753c389e03b048d7ff56 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-shadeborn-atlas.png | /assets/campaign/enemies/dreadmoon/shadeborn-atlas-v2.png |
| Dusk Runner (enemy:dusk_runner) | 768x512 | 7b0cc66af71cc0f62e1fe0e02dbfc93f3f55b34aa096a990c1821e13791e4a33 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-dusk-runner-atlas.png | /assets/campaign/enemies/dreadmoon/dusk_runner-atlas-v2.png |
| Moonstalker (enemy:moonstalker) | 768x512 | d3584094b09d7700617fecc591f9b07435ed727b56567290d38a8517ef1776ff | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-moonstalker-atlas.png | /assets/campaign/enemies/dreadmoon/moonstalker-atlas-v2.png |
| Grave Hulk (enemy:grave_hulk) | 768x512 | 4cf391664b3403e12fc10c8d70dae25e5346232f9e5f39637baa092092e11294 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-grave-hulk-atlas.png | /assets/campaign/enemies/dreadmoon/grave_hulk-atlas-v2.png |
| Echo Shade (enemy:echo_shade) | 768x640 | d51cb8c255ef3abab0ae3d52d2fe281b66408b4d4c96d5a5c3d3e28da16e1b97 | artifacts/campaign-final-art-20261012/world8/candidates/dreadmoon-echo-shade-atlas.png | /assets/campaign/enemies/dreadmoon/echo_shade-atlas-v2.png |
| Umbral Regent (boss:umbral_regent) | 2048x1536 | 84be00d661c6257be484845715d45308b61fb1028fa5e937db2b4b8aec79fba4 | artifacts/campaign-final-art-20261012/world8/repair-v1/candidates/dreadmoon-umbral-regent-boss-atlas.png | /assets/campaign/bosses/umbral_regent-atlas-v2.png |

## Acceptance evidence

The parent accepted the complete World 8 package after the independent raw-art review, W8-V2 current-source runtime PASS, and direct compact capture inspection. W8-V2 pinned src/game/scenes/GameScene.ts to SHA-256 640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4, which remains unchanged.

W8-V2 served the exact candidate hashes across 178 candidate requests with no browser errors, failed requests, HTTP errors, blocked API requests, or assertion failures. It covered 24 real map cases at 1440x900, 1280x720, 1024x768, 844x390, 320x390, and 360x360. Every route point remained inside the battlefield mask, all build-plot circles fit, and the expected towers and enemy views were present. The parent inspected the actual 844x390 and 320x390 captures and accepted the package. At compact sizes, roads, plots, actors, and panel remain visible while fine creature detail is reduced; the Regent is small at 320x390, so its fine facial and costume detail is not promised.

The raw review notes branches and rubble near the outer clearance band on maps A-C. The staged runtime checks kept the route points and plot circles clear, and the raw review found no large prop filling or crossing the open route center.

The selected Regent repair has six complete solo idle poses in cells 1-6, cells 7-8 empty, and rows 1-5 byte-identical to the pinned base. Its independent focused raw review passed. The first W8-V1 batch report remains FAIL overall: ten candidates passed, while the original Regent base candidate failed the idle-row prompt. That rejected base SHA-256 is 48d1313ef42e1d11c877ab3fe1f8dd3deae3be5eb5ec9338e8ca290eadbc6f82; the accepted repair is the selected v2 candidate listed above. The source board's figures touch or cross requested gutters; the extraction used six separated whole-body components, and this limitation remains in the raw report.

The Regent warning stayed active at 1199 ms and resolved at 1200 ms to "Two echoes emerge" with two clones. Echo Shade's support sequence displayed "Doubles forming" with zero buff-action calls during telegraph, then "Decoys emerge" with exactly one buff-action call and two registered decoys at resolution.

## Map C lineage and preserved history

The selected Map C attempt-3 sidecar records reference path candidates/dreadmoon-map-c.png at SHA-256 a33a8124455f36c7022fd5c301c5fbed04c99ca9aa27be74b7a6d42a70a411ea (3,328,614 bytes). That path now contains the selected Map C candidate; the exact sidecar reference bytes are preserved at raw/maps/map-c-attempt2-candidate.png with the recorded SHA and byte length. The supplemental lineage clarification preserves this fact without rewriting the original sidecar.

Three rejected prompt-path sidecars remain historical rejected attempts, not selected source records:
- Map A attempt 1: prompts/maps/map-a-attempt1.references.json, SHA-256 d269ed82e62aac18d50b06d44613e51579fd438b778f385482419bdcee568411.
- Map A attempt 2: prompts/maps/map-a-attempt2.references.json, SHA-256 56151520f56f2f363f712936e6a65d59f31efbccb77d1cedc90bfb7db93152b9.
- Map C attempt 1: prompts/maps/map-c-attempt1.references.json, SHA-256 29103cd8cced8b116e881413aa1858faf2a04f3861bb6f13a382bb9f76e328e2.

The initial W8-V1 report, rejected Regent candidate, rejected attempts, provenance files, and lineage addendum are retained unchanged.

## Contract and rollback

The manifest preserves all eleven IDs, stable runtime keys, state/frame definitions, animation names, and consumers. Only their paths, final status, temporary value, and the two disproven provisional/unverified quality flags changed. Existing v1 public starters remain available for older bundles and rollback.

The v1 baseline remains 43 original final assets plus all 77 expansion v1 starters. All 44 previously deployed World4-7 v2 files remain unchanged. Cumulative state after O7 release is 55 deployed and 22 pending; 98 final manifest paths and 22 provisional paths remain. V14 independently passed the local public gate, followed by O7 live release verification.

## Integration checks

- Exact-file audit: all 120 original/v1 baseline paths match the preflight SHA-256 values and dimensions; all 55 accepted candidate/public v2 pairs match SHA-256 and dimensions.
- Focused contract suite: 8 files passed, 33 tests passed. This covers manifest allowlists, world-map art, atlas contracts, campaign compatibility, fixture/runtime registration, geometry, and maintained integration fixtures.
- Full serialized suite: 106 files passed, 4 skipped; 1,518 tests passed, 11 skipped. The campaign registry suite continues to cover all 100 levels and route geometry.
- TypeScript typecheck passed. Production build passed; Vite emitted a large-chunk warning for the 2.17 MB JavaScript bundle.
- `git diff --check` passed.

## Evidence and verification surfaces

- Raw review: ../verification/world8-raw/REPORT.md.
- Focused Regent idle repair review: ../verification/world8-raw/regent-idle-recheck.md.
- Runtime review: ../verification/world8-runtime/W8-V2-verification-report.md.
- Exact candidate pins: ../verification/world8-runtime/candidate-inputs.json.
- Map C lineage addendum: ../world8/repair-v1/provenance/world8-lineage-clarification-20261013.json.
- Live registry fixture: ../../../tests/fixtures/campaign-v5/registry-art-contract.json.
- Per-asset statuses, hashes, ownership, acceptance scope, rollback facts, counts, and pending local gate: asset-status.json.

The independent V14 local public gate passed. O7 completed the authorized deployment and verified exact production bytes.

## O7 production release

Version `645072e7-4cf7-4426-94e2-0cbb440319a3` at https://aetherhold-defense.ljournllagas.workers.dev. Serialized deploy verification passed 1518 tests with 11 skipped; typecheck and build passed. `VITEST_MAX_WORKERS=1` was set for deployment. The large-chunk build warning remains.

Live HTML and current JavaScript return HTTP 200. Bundle `/assets/index-DDRbdTep.js` SHA-256 `19388b4603455f05fb8b65f79cd3e5ba4bdccd867fd174782d9024564a08475b` exactly matches the local build. `/api/health` returns HTTP 200, `ok: true`, `scoreVersion: 3`. All 11 new World8 PNGs and all 44 retained World4–7 PNGs return HTTP 200 with accepted hashes and PNG content type; repeat cache observations are recorded in [o7-live-check.json](o7-live-check.json).

Fresh headless public-page rendering and the 768×432 Dreadmoon world panel passed visual inspection. The sign-in gate prevents authenticated production gameplay verification; no account sign-in, account writes, or D1 writes occurred. Local V14 runtime verification passed. Physical touch, full uninterrupted campaign matches, World8 compact fine-detail loss, and prior crowding limits remain.
