# World 10 local v2 promotion

**Task ID:** A10
**Decision:** Parent accepted the exact eleven selected World 10 candidates for local integration. The exact public v2 files and final manifest entries were deployed by O8 after independent V15 post-promotion PASS. Live bytes and public render checks passed; authenticated gameplay remains unverified behind Google sign-in.

## Accepted gate and evidence

- Independent selected raw-art review: PASS 11/11 ([report](../verification/world10-raw/REPORT.md); [primary audit](../verification/world10-raw/audit.json); [repair-v2 map audit](../verification/world10-raw/repair-v2-audit.json)).
- Current-source runtime action/hooks and boss lifecycle: PASS for the seven previously pinned non-map candidates in [W10-V2 runtime report](../verification/world10-runtime/W10-V2-runtime-report.md).
- Four repaired map replacements: PASS 60 actual GameScene map cases across ten layouts and six viewports in [focused W10-V2 map report](../verification/world10-runtime/repair-v2/W10-V2-repair-v2-runtime-report.md).
- Parent A10 directly accepted native 844×390 and 320×390 captures. The frozen `GameScene.ts` SHA remains `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`.
- Runtime reports retain all 100 loader contexts, level and save coverage, asset hashes, viewport coverage, failed attempts, and guard outcomes. The original v1 43-file and 77-file rollback sets remain intact.

## Exact selected candidates

| Stable ID | Candidate | Canonical v2 path | SHA-256 | Dimensions / mode | Provenance sidecar (SHA-256) |
|---|---|---|---|---|---|
| `world-panel:aether_crown` / `campaign_worldmap_aether_crown` | `artifacts/campaign-final-art-20261012/world10/candidates/aether-crown-world-panel.png` | `/assets/campaign/world-map/aether_crown-v2.png` | `f8f435616240ba841b84bcd472bae3eeb961f0a6408c8d236363b94a0eeef083` | 768×432 RGB | `artifacts/campaign-final-art-20261012/world10/provenance/panel-candidate.json` (`1cebc0da7165a188a7d524ffe6301a4175b87cc4d0334c16367ca470aa96c948`) |
| `map:aether_crown:a` / `campaign_aether_crown_a` | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-a-repair-v2-attempt2.png` | `/assets/campaign/maps/aether_crown_a-v2.png` | `2a5a18c73d4914f8451b0d8b74c9a936f8a611c2db1879c2269a468fa339daa9` | 1672×940 RGB | `artifacts/campaign-final-art-20261012/world10/provenance/map-a-candidate.json` (`8af0150190f40e80fae6dd802851dab7b3dc794cd05789b335bcacb96320b564`) |
| `map:aether_crown:b` / `campaign_aether_crown_b` | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-b-repair-v2-attempt1.png` | `/assets/campaign/maps/aether_crown_b-v2.png` | `066eda646130c0847701b1f1694104f276fa24fccd81ec07c688ae445f11097b` | 1672×940 RGB | `artifacts/campaign-final-art-20261012/world10/provenance/map-b-candidate.json` (`f092f13a2d021d71fd8cd2626b9eb106a4ac422ce1a79b9ac0f7c7eb7917afee`) |
| `map:aether_crown:c` / `campaign_aether_crown_c` | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-c-repair-v2-attempt1.png` | `/assets/campaign/maps/aether_crown_c-v2.png` | `024234dcf969ccea0f76141471a2b200815bb15e0cb4b99be46bbc7b5db2d964` | 1672×940 RGB | `artifacts/campaign-final-art-20261012/world10/provenance/map-c-candidate.json` (`0ee7a41fa83b1ff394b99847b2a9c21d6b4119a3aaf538adc1d9f0b9e3eb2082`) |
| `map:aether_crown:d` / `campaign_aether_crown_d` | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-d-repair-v2-attempt1.png` | `/assets/campaign/maps/aether_crown_d-v2.png` | `49e427473869ca967add41f80d237e2b2978b467dc3218cc0f0493e0da6926cb` | 1672×940 RGB | `artifacts/campaign-final-art-20261012/world10/provenance/map-d-candidate.json` (`10b59fcd20b26b20e87eea9147e88716d28742bf2bf177434422dbeb332b163e`) |
| `enemy:aetherborn` / `campaign_enemy_aetherborn` | `artifacts/campaign-final-art-20261012/world10/candidates/aetherborn-atlas.png` | `/assets/campaign/enemies/aether_crown/aetherborn-atlas-v2.png` | `17323698c1f2bf34939390e56726bb2f5cd8b1f1f2307e1098fe81bdaa7beb30` | 768×512 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/aetherborn-atlas-candidate.json` (`84b19d53f904ef22e7824fce49c80c08617a02a5ed93e79caaf85d27ee38c55b`) |
| `enemy:crown_runner` / `campaign_enemy_crown_runner` | `artifacts/campaign-final-art-20261012/world10/candidates/crown-runner-atlas.png` | `/assets/campaign/enemies/aether_crown/crown_runner-atlas-v2.png` | `e177eae916c36c576c0190e411e6f46239e2c6bbe9f8f9600705486c1e6cf417` | 768×512 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/crown-runner-atlas-candidate.json` (`dc7966c2adb320ed16b3a84233116a511c06c578ab44d0ae218ffd1800861f03`) |
| `enemy:aether_seer` / `campaign_enemy_aether_seer` | `artifacts/campaign-final-art-20261012/world10/candidates/aether-seer-atlas.png` | `/assets/campaign/enemies/aether_crown/aether_seer-atlas-v2.png` | `026c459442aaa6e98ed9ce5be856b90005edafa1bfed6f54a26db401939c7c05` | 768×512 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/aether-seer-atlas-candidate.json` (`86e748630e6af082dc777fee41215db16bb2576d9181d99af6a87a4b8839e651`) |
| `enemy:sentry_colossus` / `campaign_enemy_sentry_colossus` | `artifacts/campaign-final-art-20261012/world10/candidates/sentry-colossus-atlas.png` | `/assets/campaign/enemies/aether_crown/sentry_colossus-atlas-v2.png` | `31c9a5eda829070c05e0b2571eafaece2af1382859a0a26ee3ffd953932f2edc` | 768×512 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/sentry-colossus-atlas-candidate.json` (`97bbf368852e7c15cb1c181dc986219aa40ae0cfb25624932239167b15da7e0d`) |
| `enemy:crown_archon` / `campaign_enemy_crown_archon` | `artifacts/campaign-final-art-20261012/world10/candidates/crown-archon-atlas.png` | `/assets/campaign/enemies/aether_crown/crown_archon-atlas-v2.png` | `28098ac3e6433f91759c2327ab01614322e2e1e3152fd3ee78d7750fc91e9fb9` | 768×640 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/crown-archon-atlas-candidate.json` (`d7c05941b81eaf017288cfcfa1643fd6f0c36ac9cc8316574c48b5030d57f9f3`) |
| `boss:aether_devourer` / `campaign_enemy_aether_devourer` | `artifacts/campaign-final-art-20261012/world10/candidates/aether-devourer-atlas.png` | `/assets/campaign/bosses/aether_devourer-atlas-v2.png` | `4ce4f9d0d079ae04968c6f4659f10822f8e603a84e68565602d5c9c7e03a103c` | 2048×1536 RGBA | `artifacts/campaign-final-art-20261012/world10/provenance/aether-devourer-atlas-candidate.json` (`ab62cfb18e0aa2d29ab22ecbf8c4dedb61af7281b6f381a7ac33e03d604fe4b0`) |

The map candidates are repair-v2 A attempt 2 and B/C/D attempt 1. The panel and six atlases are the earlier selected candidates whose exact hashes and source sidecars passed the independent raw gate. Each public file was copied byte-for-byte from its pinned candidate; no v1 starter was overwritten.

## Art direction, failures, and limits

The accepted maps use one continuous, quiet marble-court material with restrained tone differences, paving, and scuffs. The raw review found only low-contrast paving joints, mineral grain, and faint scuffs in the reserved areas; no pillars, arches, crystals, walls, steps, medallions, major props, or dense clusters. The runtime review found the courts coherent and readable, with routes, build plots, towers, actors, and boss visible at the reviewed compact sizes. Fine actor detail compresses at 320×390. This treatment should remain described as quiet court flooring; it does not claim a prop-rich architectural map.

The four replacement plates were generated from scratch. Provenance records that the approved Whisperfen A plate was used only for brushwork and broad RTS camera distance; its scenery, composition, and palette were excluded. Families B–D use that same single reference with explicit palette and scenery overrides. Candidate source hashes, prompts, pre-call reference sidecars, output IDs, and image processing are summarized in the [repair-v2 self-check report](../world10/repair-v2/selfchecks/REPORT.md) and [self-check summary](../world10/repair-v2/selfchecks/summary.json), with the exact sidecar hashes listed above. Family D trims one right-edge pixel; no resampling or paint-over was used. The weaker initial text-only Family A output remains retained but unselected.

The earlier map candidate hashes failed build-plot rim clearance and remain recorded as superseded in the raw report. The selected repair-v2 hashes pass the new per-variant plot-rim and route checks. Every rejected generation and prior audit remains in the candidate/verification folders; this curated handoff points to the decision record without adding the raw asset pack.

The focused runtime report also preserves the conservative 64×64-square footprint diagnostic. The source contract exposes only a 64-unit footprint diameter; the actual rendered ellipse and circle checks keep plot rims clear. Parent A10 accepted the selected maps while retaining the square result as a non-art geometry ambiguity. No geometry or gameplay contract was changed.

## Local contract changes

- Added `aether_crown` to the released expansion allowlist; stable IDs, runtime keys, stage, atlas states, dimensions, and animation names/playback are preserved.
- All eleven World 10 entries now resolve to canonical v2 paths, `state: final`, `temporary: null`; only `final_art_unverified` and `provisional_starter_art` were removed. The remaining 11 World 9 starters remain provisional.
- `AVAILABLE_CAMPAIGN_ART_PATHS` now has 109 paths: the 43 unchanged original final assets and 66 accepted expansion v2 assets. The provisional list has 11 paths.
- Fixture baseline assets (77), legacy final baseline assets (43), and their immutable hashes were preserved; 11 live promotions and their accepted hashes were appended.
- Existing campaign loaders and consumer keys were sufficient; no new loader, animation binding, dependency, geometry, save, score, or gameplay behavior was introduced.

## Remaining gate

V15 independently passed the local public gate. O8 completed the authorized deployment and exact live verification. There are 66 deployed expansion assets and 11 pending World9 assets; 109 final paths and 11 provisional paths remain.

## Verification

- `npm test -- --maxWorkers=1`: 106 test files passed, 4 skipped; 1,518 tests passed, 11 skipped. The maintained registry/geometry suite covered all 100 level contexts while retaining route, plot, and save-digest assertions.
- `npm run typecheck`: passed.
- `npm run build`: passed. Vite retained the existing warning for a JavaScript chunk larger than 500 kB.
- Exact-byte checks passed for all 66 promoted v2 candidates and their public copies, all 120 v1 baseline files and dimensions, the 77 immutable fixture baseline rows, all 43 original final assets, and the frozen `GameScene.ts` hash.
- `git diff --check`: passed after the final ledger/report update.

## O8 production release

Version `b5e0a607-12fc-4852-8898-477cca86e649` at https://aetherhold-defense.ljournllagas.workers.dev. Serialized deploy verification passed 1518 tests with 11 skipped; typecheck and build passed. `VITEST_MAX_WORKERS=1` was set for deployment. The large-chunk build warning remains.

Live HTML and current JavaScript return HTTP 200. Bundle `/assets/index-Diwsj0b-.js` SHA-256 `0f44b527e6002d57cdad1a2334bc413bfd88f636adaf2fd3bd56d561e57b9b5d` exactly matches the local build. `/api/health` returns HTTP 200, `ok: true`, `scoreVersion: 3`. All 11 new World10 PNGs and all 55 retained World4–8 PNGs return HTTP 200 with accepted hashes and PNG content type; repeat cache observations are recorded in [o8-live-check.json](o8-live-check.json).

Fresh headless public-page rendering and the 768×432 Aether Crown world panel passed visual inspection. The sign-in gate prevents authenticated production gameplay verification; no account sign-in, account writes, or D1 writes occurred. Local V15 runtime verification passed. Physical touch, full uninterrupted campaign matches, World10 compact fine-detail loss, and prior crowding limits remain.
