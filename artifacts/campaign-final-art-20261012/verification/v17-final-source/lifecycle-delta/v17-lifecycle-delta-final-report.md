# Task ID V17 — Focused final lifecycle delta

**Focused lifecycle outcome: PASS on frozen S4 source.** The previously reported transport and 100-context rendering results remain PASS in [the parent V17 report](../v17-final-source-report.md). This report closes the four requested lifecycle follow-ups and records the limits and exploratory failures.

## Source and scope

The current-source hashes remained stable across the runs. Key pins are GameScene `481aa2bf4de0bc97ac08d5c5b6be098539d7f1de50f713c97881c93ac6bfcbef`, EnemyView art `e7b31233daae6d72fea9fcd7daf296d15b9f8c8484f5f4e6d89618bf9250e6d2`, and boss system `5c8268f6197413f194044fa23045e87d2caadd620aee1d1035e151f8911eeab7`. Complete 16-file source start/end pins are in the JSON runs.

All probes used fresh local DEV QA pages with ordinary public textures and no candidate substitutions. The natural event checks used the actual `GameScene`/`EnemyView` call path. Only the explicitly labeled death-lock probe called `playAction` directly; it did so against a retained dying view after a real `GameScene.damageEnemy` kill. Profiles remained unchanged, with no account/progression writes.

## Four follow-ups

1. **Hydra special return — PASS.** The natural special completed all eight frames once. Its immediate completion sample still showed `special_7` with the brood-gathering callout; 180 ms later the same live boss was in phase 2 at `phase_two_0/1` with the summoned callout. The delayed state is the valid held phase-two pose for the resolved mechanic. The natural special call count stayed at one, and the phase-two one-shot ran and completed. The immediate special key is therefore a completion-sample timing result, not evidence of a stuck action.

2. **Devourer pause/speed — PASS.** During both the phase-two resistance shift and phase-three portal warning, the real QA controls paused at 3× speed. Game time, animation key, frame, and accepted action count stayed fixed while paused. After resume, the frame and game clock advanced, each action completed all eight frames, the accepted-call count remained one, and the battlefield field geometry was unchanged.

3. **Death priority and cleanup — PASS in the tested QA matrix.** A real lethal hit moved the boss view into `scene.dying` while retaining that exact view in `worldRoot`. Supported `attack`, `special`, and `phase_two` requests made against the dying view returned `null`; the frame stayed at `death_0`, the animation stayed on the death clip, and the view remained active/in the dying queue at the instant of rejection. Hydra was tested one request per fresh run for all three actions; Devourer was tested with all three requests in one run. The death clip then visibly traversed `death_0` through `death_7`. At cleanup, the retained container was inactive and invisible, absent from `worldRoot`, parentless, detached from its Phaser scene, and had zero children; `scene.dying` was empty.

4. **Death-completion callback — no callback contract; timer cleanup PASS.** `EnemyView.playAction` accepts an action and returns `number | null`; it has no optional completion callback. Its Phaser `animationcomplete` handler intentionally returns early for `death`. `GameScene.startDeathAnim` stores the returned duration in the dying queue, and `updateDying` destroys the retained view when the game-time duration expires. The Phaser event was diagnostic only: the Hydra event was not observed before timer cleanup, while Devourer emitted it at game time 14,983.33 ms, about 1,000 ms after start and before cleanup at 15,050 ms. Both views showed all eight frames and were destroyed by the timer. The inconsistent Phaser event is not a missing production callback under this contract.

## Evidence

- [`v17-lifecycle-delta-report.json`](v17-lifecycle-delta-report.json) contains three fresh Hydra death-lock cases, one each for attack, special, and phase_two. It records the natural Hydra return samples and source pin.
- [`v17-lifecycle-delta-attempt-04-combined-pass.json`](v17-lifecycle-delta-attempt-04-combined-pass.json) contains the paired Hydra/Devourer pass, including Devourer phase-two and phase-three pause/resume samples, all three Devourer death-lock attempts, actual retained-view cleanup facts, and callback event timestamps.
- Source evidence: `src/game/art/enemyArt.ts` defines `playAction(action): number | null`, its death guard rejects actions once `deathStarted` is true, and its `animationcomplete` handler returns for death. In `src/game/scenes/GameScene.ts`, `startDeathAnim` records the returned duration and `updateDying` destroys the queued view at expiry.
- Representative captures are under `screenshots/` and `attempt-04-screenshots/`.

## Retained exploratory failures and limits

Earlier lifecycle attempts remain saved: `v17-lifecycle-delta-attempt-01-sampler-fail.json`, `v17-lifecycle-delta-attempt-02-hydra-framefail.json`, and `v17-lifecycle-delta-attempt-03-id-scope-fail.json`, with corresponding screenshot copies. Attempt 01 was a QA sampler error after Phaser destroyed the sprite; the sampler now safely handles the destroyed object. Attempt 03 was a harness closure error. In attempt 02, three same-frame rejected QA requests against one Hydra view left the death sampler observing only `death_0`; that exploratory sequence is preserved. Each action then passed separately on fresh Hydra views, and all three passed together on Devourer. This leaves the combined same-frame multi-request Hydra probe unexplained; it is not evidence of a natural gameplay failure, but it limits claims about repeated rejected requests on that one view.

No source or public asset changes were made. No full suite, build, or typecheck was rerun; the parent S4 check remains producer evidence.
