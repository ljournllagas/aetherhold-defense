# SDD ledger — plan: docs/superpowers/plans/2026-10-11-responsive-game-experience.md

Branch: codex/responsive-game-experience. Base: 30ffadc80d12de62cd2af739815e28261ca5001b.
Ruling: use safe-area-cropped host dimensions — prevents double inset subtraction — cost if wrong: real-device inset calibration.
Ruling: portrait HUD 104px instead of 88px — real controls extend to y98 — cost: 16px less battlefield height.
Ruling: drop validation in handleTrayIntent instead of forwarding finishTowerDrop — no later consumer needs that method — cost: test via scene input.
Ruling: design document is docs/DESIGN_SYSTEM.md — correct mistaken root path — cost: none.
Task 7 ongoing: checkpoint 1107 passed / 11 existing skips; typecheck/build passed. Historical ignored verification fixtures restored. Mouse drag and viewport matrix observed; physical touch unverified.
Final review: responsive_final_review (independent, whole branch 30ffadc..ff612cb), 0 Critical / 6 Important accepted.
Final: regraded Help replay and missing promised upgrade explanation Important — functional guide replay and upgrade comprehension must work.
Final: fixed intercepted button release — actual shared-button scene-propagation test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed Escape transaction cancellation — escape cancellation test RED→GREEN, suite 1119 passed / 11 existing skips. Existing Details/pause paths were already green; explicit lifecycle cancellation retained.
Final: fixed second-card and battlefield-first arbitration — contact tests RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed desktop Details contract/invisible pause — desktop inspector test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed inaccessible mouse/stylus tray choices — final-tower browsing test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed compact landscape speed — More active speed test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed cross-scene guide replay — localGuide replay test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: fixed upgrade explanatory content — Campaign comparison/shortage/interval test RED→GREEN, suite 1119 passed / 11 existing skips.
Final: Ruling: physical touch comfort/calibration — remains a hardware acceptance limit; browser rendering and tests cannot establish it — cost if wrong: device-specific gesture tuning.
Final: Ruling: live two-device battle — persistence API/rules unchanged; full live battle remains untested — cost if wrong: integration regression undetected.
Final: Ruling: production deployment/health — release verification now passed page, bundle SHA256, health, required login and Google redirect checks — cost if wrong: old or unhealthy build.
Final: Ruling: exhaustive rendered viewport states — eight sizes and representative screens inspected, not every state combination — cost if wrong: rare layout overlap.
Final: deferred minors: none after effect-based regrading.
Release: npm run deploy passed 1119 tests / 11 existing skips, TypeScript/build, Worker f9637496-c8bd-4dcc-bb2e-ea7be4417615. Live verified index-CDfxIb9l.js SHA256 820b701fb73ff61df6f7bae098849aa0f22ef7982e5d381652c9d80155f0e6f0, health true, required login true, Google redirect/PKCE true.
Baseline main: 1067 passed, 11 existing skipped.
Pre-flight: Task1 geometry consumed by Tasks3,7; optional safe argument preserves existing callers.
Pre-flight: Task2 tray input/intent consumed by Task3; exact signatures match.
Pre-flight: Task4 details context consumed by Tasks5,6; read-only exception never reaches mutation.
Pre-flight: Task5 prerequisite types consumed by Task6; CampaignView is authoritative.
Pre-flight: Task6 guide/help state consumed by Task7; no cloud-save change.

Task 1: complete (commits 30ffadc..137a530, tests: rtk npm test -- tests/responsive-layout.test.ts tests/compact-sheet.test.ts tests/responsive.test.ts tests/game-scene.test.ts →    Duration  950ms (transform 715ms, setup 0ms, import 1.05s, tests 32ms, environment 0ms))
Task 2: complete (commits 5d51f1f..137a530, tests: rtk npm test -- tests/tower-tray-gesture.test.ts →    Duration  273ms (transform 37ms, setup 0ms, import 54ms, tests 4ms, environment 0ms))
Task 3: complete (commits 137a530..e698fb1, tests: rtk npm test -- tests/scene-tower-drag.test.ts tests/tower-tray-ui.test.ts tests/scene-purchases.test.ts tests/game-scene.test.ts tests/scene-auto-ui.test.ts →    Duration  1.02s (transform 1.66s, setup 0ms, import 2.44s, tests 58ms, environment 1ms))
Task 4: complete (commits e698fb1..08cb42f, tests: rtk npm test -- tests/scene-detail-pause.test.ts tests/scene-timing.test.ts tests/scene-auto.test.ts tests/scene-purchases.test.ts →    Duration  1.48s (transform 2.05s, setup 0ms, import 2.97s, tests 508ms, environment 0ms))
Task 5: complete (commits 08cb42f..5a4777c, tests: rtk npm test -- tests/prerequisites.test.ts tests/progression-ui.test.ts tests/campaign-presentation.test.ts tests/campaign-progress.test.ts tests/evolution-system.test.ts →    Duration  572ms (transform 426ms, setup 0ms, import 689ms, tests 175ms, environment 1ms))
Task 6: complete (commits 5a4777c..a3754d5, tests: rtk npm test -- tests/contextual-guide.test.ts tests/responsive-progression.test.ts tests/progression-scene.test.ts tests/campaign-scene.test.ts tests/account-ui.test.ts tests/scene-progression-ui.test.ts →    Duration  3.73s (transform 1.72s, setup 0ms, import 2.56s, tests 2.79s, environment 1ms))
Task 7: complete (commits a3754d5..5c15c70, tests: npm test →    Duration  16.52s (transform 15.68s, setup 0ms, import 40.02s, tests 55.90s, environment 17ms))
