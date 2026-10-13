# Task ID V17 — Final current-source verification

**Outcome: PASS for pinned local public-texture transport, 100-context actual GameScene rendering, seven natural boss/support presentation flows, and the focused lifecycle delta.** This is fresh local DEV QA evidence, not a live deployment result.

## Frozen source and method

I pinned 16 source files before running the fresh local Vite/Chromium probes and confirmed the same hashes at the end. Key pins:

| File | SHA-256 |
|---|---|
| `src/game/scenes/GameScene.ts` | `481aa2bf4de0bc97ac08d5c5b6be098539d7f1de50f713c97881c93ac6bfcbef` |
| `src/game/campaign/bosses.ts` | `5c8268f6197413f194044fa23045e87d2caadd620aee1d1035e151f8911eeab7` |
| `src/game/art/enemyArt.ts` | `e7b31233daae6d72fea9fcd7daf296d15b9f8c8484f5f4e6d89618bf9250e6d2` |

The complete 16-file start/end pin is in each JSON result. Local public texture URLs were exercised directly without candidate-route substitutions. Browser runs used a fresh profile; local/session storage remained `[]`. No account, progression, public, source, art, or Git writes were made.

## Public transport and all-level render probe

- Fresh HTTP checks passed for **197/197** exact texture rows: 77 promoted v2, 43 original v1, and 77 rollback v1. Each row returned HTTP 200 with PNG content type and passed decode, expected SHA-256, dimensions, and alpha-contract checks. There were no failures.
- The manifest audit found 120 unique IDs, keys, and paths; all 120 paths were final, with zero provisional, temporary, or non-final rows. All 43 originals were present.
- **100/100 loader contexts** produced a current `GameScene` render. There were zero missing manifest IDs, browser errors, failed requests, HTTP errors, or blocked API requests. The final level 100 probe loaded `campaign_aether_crown_d`, showed the registered Aether Devourer at `walk_0`, and retained five tower views. A representative original Classic-mode smoke also loaded and rendered.
- Captures are the 11 level samples in `screenshots/all100-level-*.png` plus `screenshots/classic-original-smoke-1024x768.png`. The all-level probe JSON contains all 100 per-level observations.

## Natural boss-action and support presentation

The preliminary run below left lifecycle items UNVERIFIED; those statuses are historical and superseded by the focused lifecycle delta that follows.

Each of the seven actual registered boss views was observed at 1440×900, 1280×720, 1024×768, 844×390, and 320×390. The observed warning/action calls were consumed by the real `GameScene`/`EnemyView` path; the harness made **zero direct `playAction` calls**. Each recorded boss action traversed all eight registered frames and completed. Post-resolution snapshots showed the expected held phase animation for the phase-two actors, and locomotion after Stormmaw and Devourer resolutions. The immediate completion sample for Hydra's `special` still reported the special animation; the sequence proceeded into its phase-two action, so a distinct delayed locomotion sample after that special was not obtained. Hydra-special return is therefore **UNVERIFIED**.

| Boss | Observed event-to-view sequence |
|---|---|
| Mireheart Hydra | `special` warning, then one `phase_two` when the summon resolves; summon count reached 2, with no duplicate action. |
| Drowned Oracle | `special` while arcane resistance was pending and physical resistance active; `phase_two` at resolution, then arcane active and pending cleared. |
| Iron Tyrant | `special` armor-break warning, then `phase_two` on armor break. |
| Stormmaw Prime | `special` storm-surge warning and the existing haste resolution. It stayed in phase 1 and did not emit a natural `phase_two`, consistent with its authored mechanics. |
| Umbral Regent | `special` echoes-forming warning, then `phase_two` when echoes appeared. |
| Rift Sovereign | `special` portal warning, then `phase_two` on its first portal jump; route advancement was observed. |
| Aether Devourer | `phase_two` resistance shift and a later `special` portal warning/resolution in phase 3. |

For the support case, the authored level 88 Astral Rift roster was used as a QA setup and the existing combat clock was resumed through resolution. The real Rift Weaver view emitted zero action calls during its warning and exactly one registered six-frame `buff` action at resolution, with the authored phase-jump callout and route advance. No direct animation call was used as proof. This confirms the caller path in the authored scenario; it is not evidence of a full earned campaign completion.

Pause/speed controls were checked during the active event in six boss cases: speed reached 3×, pausing froze game time, and resume continued the event. The Devourer phase-two branch did not record a pause/speed check. A lower-priority action attempt after death had begun was not independently exercised through a natural event, so death-action priority is **UNVERIFIED** here.

Representative event captures: [Hydra phase two](screenshots/v17-boss-mireheart_hydra-phase-two-844x390.png), [Oracle phase two](screenshots/v17-boss-drowned_oracle-phase-two-844x390.png), [Stormmaw warning](screenshots/v17-boss-stormmaw_prime-special-844x390.png), [Sovereign phase two](screenshots/v17-boss-rift_sovereign-phase-two-844x390.png), [Devourer phase-three portal](screenshots/v17-boss-aether_devourer-phase-three-portal-844x390.png), [Rift Weaver warning](screenshots/v17-weaver-natural-telegraph-844x390.png), and [Rift Weaver resolution](screenshots/v17-weaver-natural-resolution-844x390.png). Each boss also has a compact 320×390 fit capture.

## Historical original-run death cleanup observation

The following paragraph records the original-run observation only. Its callback and retained-view uncertainty is superseded by the focused lifecycle delta below.

All seven bosses visibly traversed `death_0` through `death_7`. Immediately after each kill, the entity view was null/detached and the dying-view queue contained one entry; after the authored death interval, `scene.dying` returned to zero and the world root had no remaining death-screen-scale-tagged view. This supports visual death playback and queue cleanup. The harness's later `entityViewDetached` field is false because it looks up the already-removed entity in the active-enemy list and compares the result to `null`; I do not treat that ambiguous field as evidence that a view remained attached. The death animation completion callback itself was not consistently observed: the returned death action had `completed: false` in the recorded samples, and the callback event was captured for only four of seven bosses. Therefore, **death callback completion is UNVERIFIED**, even though frame progression and queue cleanup passed. No production defect is inferred from this harness observation alone.

## Focused lifecycle delta — final status

The follow-up passed on the same frozen source. See [the detailed lifecycle report](lifecycle-delta/v17-lifecycle-delta-final-report.md), [isolated Hydra cases](lifecycle-delta/v17-lifecycle-delta-report.json), and [the paired Hydra/Devourer run](lifecycle-delta/v17-lifecycle-delta-attempt-04-combined-pass.json).

- **Hydra special return: PASS.** The immediate completion sample showed special_7 and the brood-gathering callout; 180 ms later the live boss held its valid phase-two pose with the summoned callout. The natural special occurred once, and the phase-two one-shot completed.
- **Devourer pause/speed: PASS.** During both phase-two resistance shift and phase-three portal warning, pausing at 3× froze game time, animation frame, and accepted action count. Resume advanced the animation; both actions completed all eight frames once, with field geometry unchanged.
- **Death priority and cleanup: PASS for the tested QA matrix.** A real GameScene lethal hit retained the exact view in the dying queue and world root. Valid lower-priority attack, special, and phase_two presentation requests returned null and did not change the death clip/frame. Hydra was checked one request per fresh view; Devourer was checked with all three requests. Each death animation traversed death_0 through death_7; the retained view was then destroyed and removed from the scene, root, and queue.
- **Death completion contract: PASS.** playAction has no optional completion callback. The Phaser animationcomplete handler intentionally returns early for death; GameScene records the returned duration and its updateDying timer destroys the view. The Phaser event is diagnostic only: it was observed for Devourer before cleanup, but not for Hydra. Timer cleanup passed for both.

Hydra lower-priority requests directly invoked playAction only as explicitly labeled presentation QA after a real GameScene kill; they do not claim a naturally triggered lower-priority action during death.

## Evidence and limits

- All-100 render probe: [`v17-global-public-renderprobe-report.json`](v17-global-public-renderprobe-report.json)
- 197-row transport check: [`v17-all-assets-transport-report.json`](v17-all-assets-transport-report.json)
- Final natural boss/support run: [`v17-boss-natural-runtime-attempt-04.json`](v17-boss-natural-runtime-attempt-04.json)
- Curated current source pins and gate counts: [`v17-final-gate-summary.json`](v17-final-gate-summary.json)
- Harnesses and source pin inputs: `v17-global-public-renderprobe.cjs`, `v17-all-assets-transport.cjs`, `v17-boss-natural-runtime.cjs`, and `v17-inputs.json`.
- Earlier lifecycle attempts and the unexplained same-frame Hydra probe remain preserved under `lifecycle-delta/`. One exploratory sequence of three synchronous rejected QA requests on one Hydra view observed only death_0; it is retained as an explicit limitation, not claimed as passed or as a natural gameplay defect. Separate fresh-view Hydra cases and the combined Devourer case passed.
- The main agent reports S4's full 1,524-test run (11 skipped), typecheck, build, and diff check passed. I did not rerun those broad checks; this report records the independent runtime/transport gate only.
- The Classic check is a representative smoke, not a full Classic campaign regression. No live Worker or post-deployment URL was tested.
