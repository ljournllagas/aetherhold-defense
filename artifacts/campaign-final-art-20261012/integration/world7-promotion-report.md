# Task ID A8 — World 7 local art promotion

World 7 was promoted locally as eleven exact v2 PNGs after the independent W7-V1 raw review, W7-V2 staged runtime review, and parent direct inspection of the compact captures. The frozen gameplay source remained unchanged. World4–6 remain preserved. Independent V13 post-promotion verification passed and O6 deployed World7. Exact live release checks passed; authenticated production gameplay remains unverified behind Google sign-in.

## Accepted evidence and scope

- Raw candidate review: artifacts/campaign-final-art-20261012/verification/world7-raw/REPORT.md (11/11 exact candidate hashes, dimensions, provenance and atlas/map checks passed).
- Staged runtime review: artifacts/campaign-final-art-20261012/verification/world7-runtime/W7-V2-report.md (registration, candidate transport, route/plot clearance, movement, interaction and lifecycle gates passed).
- Candidate and source input pins: artifacts/campaign-final-art-20261012/verification/world7-runtime/candidate-inputs.json.
- Frozen GameScene SHA-256: 640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4.
- The runtime report leaves compact readability parent-owned. Parent inspection accepted the actual 320×390 and 360×360 captures while retaining the measured fine-detail limitation: Stormmaw occupies about 46×31 rendered pixels at 320×390 and 39×28 at 360×360. Route and plots remain visible.
- Compact boss captures reviewed: `artifacts/campaign-final-art-20261012/verification/world7-runtime/screenshots/stormmaw-visible-320x390.png` and `stormmaw-visible-360x360.png`. Representative Map A–C contexts: `artifacts/campaign-final-art-20261012/verification/world7-runtime/screenshots/game-sky_isles_a-844x390-mixed-walk.png`, `game-sky_isles_b-844x390-mixed-walk.png`, and `game-sky_isles_c-844x390-mixed-walk.png`.
- Map A–C decorative edge detail passed direct review with roads and plots clear. Tempest Herald produced one buff action on natural support resolution and none during its telegraph.
- Tempest support capture: `artifacts/campaign-final-art-20261012/verification/world7-runtime/screenshots/tempest-natural-support-resolution-844x390.png`.
- No full uninterrupted campaign match is claimed. The separate independent V13 post-promotion local public gate passed, followed by O6 live release verification.

## Exact promoted assets

| Stable ID | Candidate SHA-256 | Dimensions | Candidate | Public v2 path |
|---|---|---:|---|---|
| world-panel:sky_isles | dc83257253d0f9906f916153aa236ee5b693cb988e2b760503df7de5d83b9494 | 768×432 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-world-panel.png | /assets/campaign/world-map/sky_isles-v2.png |
| map:sky_isles:a | 98f5adff17d7b9b8e469238b12ef09bc39ab95ec3c8eb9b7fcad1c665e023a26 | 1672×940 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-map-a.png | /assets/campaign/maps/sky_isles_a-v2.png |
| map:sky_isles:b | 79c4bb5d3831c648b35c192f0c35aeeec1fa14db73830c75f915cce3eef9a660 | 1672×940 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-map-b.png | /assets/campaign/maps/sky_isles_b-v2.png |
| map:sky_isles:c | e8967fcf6b32700efcf0105183313fc3fd6015bb43eaed681147d06d3b556fb0 | 1672×940 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-map-c.png | /assets/campaign/maps/sky_isles_c-v2.png |
| map:sky_isles:d | b1e1caddce8899a663f8bb6312584fc102e6bba3df111c91c24ed0643d02818c | 1672×940 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-map-d.png | /assets/campaign/maps/sky_isles_d-v2.png |
| enemy:aether_drake | 6127080ff7abdbe60dbf514836e59ac1fce1a398fe7c74b5e958701b89dc8d3a | 768×512 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-aether-drake-atlas.png | /assets/campaign/enemies/sky_isles/aether_drake-atlas-v2.png |
| enemy:cloud_skitter | f2581cf68be8769764dc2b347be104a0f9b8fbb5b4ea88bbfb345920f879de96 | 768×512 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-cloud-skitter-atlas.png | /assets/campaign/enemies/sky_isles/cloud_skitter-atlas-v2.png |
| enemy:galeclaw | b2b8cde192c826776fabb8356490928c4c80611d0b203f6d70da8d27f0cfb2ec | 768×512 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-galeclaw-atlas.png | /assets/campaign/enemies/sky_isles/galeclaw-atlas-v2.png |
| enemy:stormguard | ee13c36d209f3a750bce70b5fe16b408b225434ebe5007556944eca4fa37c5f3 | 768×512 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-stormguard-atlas.png | /assets/campaign/enemies/sky_isles/stormguard-atlas-v2.png |
| enemy:tempest_herald | 8aac34b5a6783fc943b1333c8e035c19689840f26d03d2ada6a20bef86e20d49 | 768×640 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-tempest-herald-atlas.png | /assets/campaign/enemies/sky_isles/tempest_herald-atlas-v2.png |
| boss:stormmaw_prime | 43eb4be1cda70caa1aa89830ecce8964952370312ffeb08110845864e6cb165b | 2048×1536 | artifacts/campaign-final-art-20261012/world7/candidates/sky-isles-stormmaw-prime-boss-atlas.png | /assets/campaign/bosses/stormmaw_prime-atlas-v2.png |

## Preserved contracts and current counts

- All 43 original final assets and all 77 v1 expansion rollback PNGs remain byte-identical to the A0 inventory hashes.
- All 33 previously promoted World4–6 v2 PNGs remain byte-identical to their accepted candidate hashes. The O5 production record remains unchanged.
- Stable runtime keys, declared dimensions, animation rows, frame contracts and quality flags are retained. Only the promoted v1-only provisional/unverified flags were removed; the accepted registrations use the canonical v2 paths and final state.
- Current status: 44 cumulative v2 deployments for Worlds4–7; 33 assets remain pending. The manifest exposes 87 final paths and 33 provisional starter paths.
- V13 independently passed the World7 post-promotion public gate. O6 verified the deployed World7 bytes and all prior World4–6 bytes.

## Validation references

Maintained coverage remains in tests/campaign-art-manifest.test.ts, tests/world-map-art-independent.test.ts, tests/monster-production-art.test.ts, tests/campaign-v5-compatibility.test.ts, tests/verification-v5-registry-geometry.test.ts, artifacts/campaign-final-art-20261012/preflight/manifest-snapshot.test.ts, artifacts/integration-v5/tests/templates/campaignWorlds4to10.test.ts, and artifacts/campaign-production-completion-20261010/verification/functional/atlas-handoff.test.ts.

## O6 production release

Version `7d5df65a-355f-41ad-8ee4-8da215147930` at https://aetherhold-defense.ljournllagas.workers.dev. Serialized deploy verification passed 1518 tests with 11 skipped; typecheck and build passed. `VITEST_MAX_WORKERS=1` was set for deployment. The large-chunk build warning remains.

Live HTML and current JavaScript return HTTP 200. Bundle `/assets/index-D9yVZ9fU.js` SHA-256 `85f367d99d7c0ad26cdd04791b8b505f7e6a3f1d66e745a1a1ed4bbe331c289e` exactly matches the local build. `/api/health` returns HTTP 200, `ok: true`, `scoreVersion: 3`. All 11 new World7 PNGs and all 33 retained World4–6 PNGs return HTTP 200 with accepted hashes and PNG content type; repeat cache observations are recorded in [o6-live-check.json](o6-live-check.json).

Fresh headless public-page rendering and the 768×432 Sky Isles world panel passed visual inspection. The sign-in gate prevents authenticated production gameplay verification; no account sign-in, account writes, or D1 writes occurred. Local V13 runtime verification passed. Physical touch, full uninterrupted campaign matches, World7 compact fine-detail loss, and prior crowding limits remain.
