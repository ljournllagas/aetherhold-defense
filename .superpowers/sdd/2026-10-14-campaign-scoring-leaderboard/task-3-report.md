# Task 3 report: validated Campaign results and scheduled scoring

## Implementation

- Split Campaign terminal payloads into the unchanged legacy shape and a version-1 current shape. The validator keeps accepting the exact legacy payload, rejects partial/current unknown-key payloads, and validates current safe-integer bounds, wave-prefix kill counts, authored boss eligibility/timing, exact score arithmetic, and outcome/lives rules. Current siege failures require an authored boss, positive remaining lives, and zero mission-boss kills; `quit` is not a terminal result.
- Added authored wave-queue enemy identity tracking in `GameScene`. Only a scheduled enemy's first eligible kill earns Campaign kill points; escaped/cleaned enemies and same-identity summons/clones do not. Only the scheduled authored mission boss earns the boss bonus. Existing combat/bounty counters remain unchanged.
- Campaign HUD score now uses scheduled kills, completed waves, and mission-boss kills only, including after settlement. Settlement calculates and retains one `CampaignScoreBreakdown`, adds remaining lives once, sends all current counters with the result, and keeps the final completed-wave count before clear settlement.
- Current guest victories use `applyCampaignClear` and retain `result: null` plus the run ID; legacy guest victory projection and failure behavior remain unchanged. The minimal presentation accessor exposes current best, legacy best, and current target for Task 5.
- QA results fixtures use metadata-derived current counters and continue to avoid durable writes/uploads. `worker/accountScores.ts` needed no source edit: its existing generic canonicalization includes all payload fields; tests now verify that each current scoring field affects run identity and that upload retries/conflicts behave correctly.

## Red/green evidence

- Initial contract tests were red before implementation: `rtk npm test -- tests/campaign-score-results.test.ts tests/guest-run-settlement.test.ts` reported 2 files with 3 failures and 3 passes. Current payload validation, an active-final-wave boss result, and current guest progress were not implemented yet.
- A later regression test exposed an outcome-specific gap: `rtk npm test -- tests/campaign-score-results.test.ts` accepted `siege-failed` with `missionBossesKilled: 1` (3 passed, 1 failed). After adding the zero-boss-kill constraint and a `quit` rejection, the focused result and guest settlement tests passed (2 files, 7 tests).
- For the fixed-step battle fixtures, I temporarily restored the previous purchase and targeting policy and ran `rtk npm test -- tests/campaign-scene.test.ts -t "level 5|level 8"`. It failed all 4 profile cases on the unchanged score-target assertion. Level 5 scored 2,670 against 2,680: kill 1,120 + wave 800 + lives 750, with 112 scheduled/combat kills and 5 escapes. Level 8 scored 2,650 against 2,660: kill 900 + wave 1,000 + lives 750, with 90 kills and 5 escapes. Each was short by one ordinary kill worth 10 points.
- Restored the final legal strategies and reran the same level 5/8 cases: 4 passed. Level 5's authored physical-resistance warning now prompts early damage-type diversification and strongest-target selection; level 8's mixed-resistance warning uses weakest-target selection. These are ordinary tower purchases/targeting decisions. The score formula, production tuning, test target, and acceptance assertions were not changed or weakened.
- Final expanded focused gate: `rtk npm test -- tests/campaign-score-results.test.ts tests/guest-run-settlement.test.ts tests/guest-progress.test.ts tests/account-scores.test.ts tests/campaign-independent-lifecycle.test.ts tests/scene-siege.test.ts tests/earned-score.test.ts tests/campaign-scene.test.ts tests/account-integration.test.ts tests/campaign-presentation.test.ts tests/qa.test.ts tests/campaign-v5-expansion-paid-resource.test.ts` — 12 files passed, 319 tests passed.
- Final full gate: `rtk npm test` — 120 files passed, 4 skipped; 1,579 tests passed, 11 skipped (1,590 total). The baseline skips remain unchanged.
- Final build: `rtk npm run build` — `tsc -b && vite build` passed. `rtk git diff --check` passed.

## Changed files

- `src/shared/account.ts`
- `src/shared/campaignResult.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/systems/GuestProgress.ts`
- `src/game/campaign/presentation.ts`
- `tests/campaign-score-results.test.ts`
- `tests/guest-run-settlement.test.ts`
- `tests/guest-progress.test.ts`
- `tests/account-scores.test.ts`
- `tests/account-integration.test.ts`
- `tests/campaign-independent-lifecycle.test.ts`
- `tests/campaign-scene.test.ts`
- `tests/campaign-v5-expansion-paid-resource.test.ts`
- `tests/campaign-presentation.test.ts`
- `tests/qa.test.ts`

## Self-review and concerns

- Reviewed scheduled identity registration, consumption, escape/cleanup removal, one-time boss credit, final-wave ordering, current/legacy payload distinction, guest failure behavior, captured-owner settlement, QA exclusions, and current/legacy view-model separation.
- Restart and shutdown tests assert no settlement or clear is recorded; failure and assisted-run tests remain in place. Current and legacy account-result coverage remains explicit.
- No production scoring weights or balance values were changed. The only remaining build notice is Vite's existing large-chunk warning for the 2,189.75 kB main JavaScript bundle; it does not fail the build.
- Deployment and push were intentionally omitted per the Task 3 execution instruction.
