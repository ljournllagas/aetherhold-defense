# W10-V2 focused map delta: independent runtime report

**Task ID:** W10-V2 focused map delta
**Decision:** The four selected quiet-court replacements pass the focused actual-GameScene map, route, plot-rim, and viewport-fit gate on frozen S3 source. This does not replace the separate independent raw-art review. A conservative square-footprint diagnostic is inconclusive because the source exposes a 64-unit footprint diameter but does not specify a square occupied shape; details below.

## Pinned inputs

The runtime run used the frozen 16-file S3 source snapshot, including `GameScene.ts` SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`. A post-run freshness check at `2026-10-13T19:09:24.480Z` matched all 16 source files and all 11 candidate inputs (0 mismatches). See [source-pin.json](source-pin.json), [candidate-inputs.json](candidate-inputs.json), and [pin-freshness-check.json](pin-freshness-check.json).

| Family | Exact selected candidate | SHA-256 | Runtime map cases |
|---|---|---|---:|
| A | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-a-repair-v2-attempt2.png` | `2a5a18c73d4914f8451b0d8b74c9a936f8a611c2db1879c2269a468fa339daa9` | 18 |
| B | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-b-repair-v2-attempt1.png` | `066eda646130c0847701b1f1694104f276fa24fccd81ec07c688ae445f11097b` | 18 |
| C | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-c-repair-v2-attempt1.png` | `024234dcf969ccea0f76141471a2b200815bb15e0cb4b99be46bbc7b5db2d964` | 18 |
| D | `artifacts/campaign-final-art-20261012/world10/repair-v2/candidates/aether-crown-map-d-repair-v2-attempt1.png` | `49e427473869ca967add41f80d237e2b2978b467dc3218cc0f0493e0da6926cb` | 6 |

The actual campaign textures returned the exact pinned hashes in all 60 stage cases: 18 responses each for A/B/C and 6 for D. The seven previously accepted panel/monster inputs were also hash-pinned and remained unchanged; this focused delta does not re-audit their art.

## Actual GameScene coverage and result

The preserved browser run in [repair-v2-stage-gate-report.json](repair-v2-stage-gate-report.json) ran from `2026-10-13T18:56:45.860Z` to `2026-10-13T18:58:47.929Z`, through `repair-v2-stage-gate.cjs` using the bundled Node runtime and Playwright Chromium. It rendered all ten authored layouts (A/A2/A3, B/B2/B3, C/C2/C3, and the D boss map) at each of six viewport sizes: 1440×900, 1280×720, 1024×768, 844×390, 320×390, and 360×360. This covers the four required sizes plus the two compact boundaries. It used the actual registered GameScene map, route, plot markers, five placed tower views, active enemy views, and the level-100 boss in D; it was not a standalone image fixture.

All 60 map cases passed. The live 1672×940 candidate maps retained the interior route capsule and every authored plot rim inside the battlefield mask. Plot-to-road clearances stayed in the authored 6–14 world-unit band (observed 7.82–10); actual plot counts matched the authored variants, including the 12-plot C2 layout. The five towers were registered and visible in each case. The D boss was registered and visible at every tested size; the 256-cell boss rendered at about 70×70 screen pixels at 844×390 and 57×57 at 320×390. All 60 campaign-profile snapshots were unchanged, and the run recorded zero failed requests, HTTP errors, blocked API calls, browser errors, or assertion failures.

I inspected native GameScene captures for A3, B3, C3, and D at 844×390 and 320×390. The routes and build plots remain readable in the actual stage. The four candidates share a quiet, continuous marble-court material with visible paving and scuffs; their lighting/ground identities are subtle but distinguishable (A warm pale stone, B warmer gold-beige, C cooler violet-gray, D amber-gold). No raised pillars, arches, or dense prop clusters intrude into the reserved playfield. At 320×390, small actor details naturally compress, while the map, route, plot locations, HUD, and boss marker remain visible. The boss map fits with black side margins at the compact views, as expected from the current camera fit.

Representative evidence, with screenshot hashes and per-capture assertions, is indexed in [visual-evidence-index.json](visual-evidence-index.json):

- [A3 at 844×390](screenshots/game-aether_crown_a3-844x390-mixed-walk.png) and [A3 at 320×390](screenshots/game-aether_crown_a3-320x390-mixed-walk.png)
- [B3 at 844×390](screenshots/game-aether_crown_b3-844x390-mixed-walk.png) and [B3 at 320×390](screenshots/game-aether_crown_b3-320x390-mixed-walk.png)
- [C3 at 844×390](screenshots/game-aether_crown_c3-844x390-mixed-walk.png) and [C3 at 320×390](screenshots/game-aether_crown_c3-320x390-mixed-walk.png)
- [D boss at 844×390](screenshots/game-aether_crown_d_boss-844x390-mixed-walk.png) and [D boss at 320×390](screenshots/game-aether_crown_d_boss-320x390-mixed-walk.png)

The images contain the harness’s `DEV QA · UNSAVED` overlay and scripted gold feedback labels. The profile checks confirm no campaign/account state writes. Camera pan/zoom controls, the full action matrix, and boss death lifecycle were not repeated in this focused map delta; prior accepted W10 lifecycle evidence applies to unchanged S3 source.

## Tower-footprint diagnostic and limits

The authored tower contract exposes `footprintPx: 64`; the live base shadow is drawn as an ellipse of roughly 62×25 local world units. The map repair geometry helper treated the 64-unit footprint as a square reserved area. I computed route clearance three ways from the real runtime plot centers and route segments, against the campaign road capsule (radius 25):

- Treating the rendered base shadow as a 62×25 ellipse gives at least 2.5 world units of separation from the road capsule in all ten layouts.
- Treating the 64-unit diameter as a circle gives at least 1.5 world units in all ten layouts.
- Treating it as a 64×64 square produces conservative overlap in four layouts, down to −5.05 units at A3, and detects one adjacent Starfire/Tempest square-footprint overlap in A. This square diagnostic is preserved in [canonical-footprint-diagnostic.json](canonical-footprint-diagnostic.json).

Because the source field does not define whether this 64-unit footprint is a circle, square, or an occupancy rule matching the drawn ellipse, I do not treat the square result as a candidate map-art failure. It is a geometry-contract question for the main to decide if square reservation is required. The actual candidate maps are quiet and contain no painted props at these route/plot contacts. The runtime's explicit plot-rim/road assertions pass.

## Preserved failures and limits

The first full run is retained in [attempt-01-plot-count-catchup](attempt-01-plot-count-catchup/repair-v2-stage-gate-report.json). It stopped at C2 because the verifier initially required at least 13 plots; C2 correctly has 12. The final run checks its authored plot count and passes. Two earlier smoke attempts used the full tower image bounds and then an alpha-art bounding circle as ground occupancy; those were invalid proxies and their smoke JSON was reused, so those logs were overwritten. These attempts and limitations are documented in [harness-attempts.md](harness-attempts.md).

This is a focused runtime/composition gate for the four new maps. It does not confer independent raw-image approval, certify every pose/detail of the existing monster atlases, or repeat the broader World10 action/lifecycle suite. The independent raw review remains the separate gate for art integrity and prompts.
