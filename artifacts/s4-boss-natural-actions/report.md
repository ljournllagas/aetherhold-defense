# Task ID S4 — Natural boss action integration

## Outcome

Expansion boss events now request authored `special` and `phase_two` actions through the existing typed `CampaignBossEvent.presentationAction` seam. The scene applies summon and route effects before consuming the marker, and the Hydra art-state hook now keeps its phase-pose fallback without issuing a duplicate one-shot request.

The natural event contract is:

- All seven expansion bosses request `special` at their warning edge. Devourer's warning is its Phase 3 portal telegraph; its HP-driven phase changes have no preceding warning.
- `phase_two` is requested when Oracle resolves into Arcane resistance, Tyrant resolves its first armor break, Regent spawns its echoes, Sovereign completes its first portal jump, Devourer crosses into HP Phase 2, and Hydra resolves its first brood summon.
- Stormmaw has no Phase 2 mechanic and emits no `phase_two` marker.

Presentation markers do not change warning duration, callout text, combat effects, summons, route advance, stats, or save state. `EnemyView.playAction()` remains responsible for missing clips, priority, completion pose, locomotion, and death lock.

## Changes and verification

- `src/game/campaign/bosses.ts` adds the two marker values at the event boundaries above.
- `src/game/scenes/GameScene.ts` dispatches any typed marker once after the event's summons and route advance are applied.
- `src/game/art/enemyArt.ts` removes Hydra's overlapping state-edge action requests while preserving its warning/phase pose fallback.
- Real-system mechanics and scene tests cover warning versus resolution timing, Oracle's pending resistance, exact-once action dispatch across all seven bosses, Hydra's phase/telegraph collision and summon-before-clip order, pause/resume, and Stormmaw's unchanged Phase 1. Animation tests cover Hydra pose retention, no duplicate state-hook replay, and death lock.

Red/green evidence: the new transition-marker tests initially failed for missing Oracle, Hydra, and Stormmaw warning markers. An added scene-order assertion also failed while Hydra's phase action ran before its summons; moving marker dispatch after event effects made it pass.

Checks passed:

- `rtk npm test -- tests/campaign-v5-boss-mechanics.test.ts` — 19 passed.
- `rtk npm test -- tests/campaign-callout.test.ts` — 26 passed.
- `rtk npm test -- tests/campaign-enemy-animation.test.ts` — 14 passed.
- `rtk npm run typecheck` — passed.
- `rtk npm test -- --no-file-parallelism` — 106 files passed, 4 skipped; 1,524 tests passed, 11 skipped.
- `rtk npm run build` — passed. Vite warned that the generated application JavaScript chunk is 2,169.52 kB, above its 500 kB advisory threshold.
- `rtk git diff --check -- <S4 source and test files>` — passed.

## Source handoff and remaining verification

The frozen V16 transport report pins the pre-S4 `GameScene` SHA-256 `640c9ea6a52bc611465e56c0f16a03e2a04b58206ef6805c69a4551ce91cb5f4`. The final S4 `GameScene` is `481aa2bf4de0bc97ac08d5c5b6be098539d7f1de50f713c97881c93ac6bfcbef`; the V16 transport evidence therefore does not verify this source. A source-pinned browser/runtime recheck is still needed if the main agent's final gate requires rendered-current-source evidence. S4 did not perform deployment or Git synchronization.

Final SHA-256 pins:

- `src/game/campaign/bosses.ts` — `5c8268f6197413f194044fa23045e87d2caadd620aee1d1035e151f8911eeab7`
- `src/game/scenes/GameScene.ts` — `481aa2bf4de0bc97ac08d5c5b6be098539d7f1de50f713c97881c93ac6bfcbef`
- `src/game/art/enemyArt.ts` — `e7b31233daae6d72fea9fcd7daf296d15b9f8c8484f5f4e6d89618bf9250e6d2`
- `tests/campaign-v5-boss-mechanics.test.ts` — `fe6f51c8634718493eb61a4dc40b32ad590cee1fe0928bb738e4d8b16bd2410c`
- `tests/campaign-callout.test.ts` — `321642035c1877b6d3cc7087087d8fe24d6ec9ee63c2774614a5b9ab4d30b486`
- `tests/campaign-enemy-animation.test.ts` — `1e09e64b4c1270ee53a456d7a5d72742d155306fd8d5bfaa1d912f21ba3b48b7`
