# Latest session work

## Progression UI reliability (2026-10-09) — current

The repository is now initialized with Git on `main`, remote `origin` is `https://github.com/ljournllagas/aetherhold-defense.git`, and production serves score era 2. Open progression actions now refresh affordability and pause restrictions in place; same-tower sheet redraws preserve scrolling and resize clamps it to the new bounds. Purchase validation, balance and database behavior are unchanged.

Verification: deployment ran 485 passing tests / six opt-in balance tests skipped and a successful production build. Rendered Chromium checks passed at six viewport sizes, including native clicks, held-press cancellation, dragging, reward sources, pause/resume, readiness changes and rotation. Physical touch and human balance playtests were not checked.

Published Worker version `4a7e0d26-8f7c-401f-af41-297cbc3ef5ae` at https://aetherhold-defense.ljournllagas.workers.dev/. Live HTML, current JavaScript and `/api/health` returned 200; the bundle matches the local build and the unmodified live page has no browser errors or failed requests. Full record: `agent_docs/progression_ui_fixes_2026-10-09.md`; evidence: `artifacts/progression-ui-fixes/`.

Remaining follow-ups: coarse-frame attack scheduling, next-upgrade previews, realistic branch/economy balance validation and staged asset loading. The evolution preview/readiness change preceding this batch is documented in `docs/superpowers/specs/2026-10-09-evolution-preview-verification-design.md`.

## Progression and evolutions (2026-10-08 to 2026-10-09) — earlier implementation handoff

Plan: docs/sdd/plans/20261008-progression-evolutions.md. This handoff predates Git initialization and the completed era-2 releases. Its original plan "Commit" lines were checkpoint labels. Version 0.2.0, score era 2; production now serves this era, as verified in the current section above.

State at the earlier handoff: T1–T26 and T29–T35 done, with T27/T28 release work still pending then. The later evolution-preview release and current live checks supersede that deployment status.

Verified on 2026-10-09: `npm test` 34 files passed / 2 skipped, 465 tests passed / 6 skipped (skips are the BALANCE_SIM-gated runners); `npm run typecheck` and `npm run build` pass (large-chunk warning remains). Record: artifacts/progression/verification.md. Handoff and full file list: agent_docs/progression_implementation_2026-10-08.md.

Limits to carry forward:
- Balance evidence is bot simulation (artifacts/progression/balance/playtests.md), chosen by the user instead of human playtests. All five runs are relic-assisted; AC-128/AC-129 rest only on the T23 deterministic economy test.
- User accepted on 2026-10-09: AC-131 failed (7–8 fully evolved towers vs 2–5; shipped as-is) and AC-127 failed in the model (Winterguard over Brittle Ice, Spellbreaker over Arcane Beacon; model limitation). No coefficient tuned.
- Rendered QA (artifacts/progression/ui/checklist.md): headless Chrome only, actions via scene methods, ~15 of 66 screenshots viewed. Not verified: touch, 44 px targets, hover/focus, reduced motion, rotation, backgrounding, real Submit Score failure/retry, other browsers, physical devices. F1–F4 fixed in T32–T34 with tests; the 844x390 sheet and notice-after-resize screenshots were not recaptured.
- Unlocks (`aetherhold-unlocks-v1`) and personal bests are browser-local: per device, reset by clearing site data, not synchronized, not anti-cheat.

## Previous release: fantasy-rebuild-20261007

Deployment: fantasy-rebuild-20261007; Heavy route; 2026-10-08. No Git repository. User authorized framework initialization, Playwright verification and publication.

### Published artifact

https://aetherhold-defense.ljournllagas.workers.dev/

Immutable release: artifacts/rebuild/lossless-asset-transport/candidate-dist. Bundle index-Dn0ciAiT.js SHA-256: 0f5b6578c193c0f15b13e80ed4d9d8a658696fd431389f7d1050023073b38571.

Existing Worker config and --keep-vars used. Live HTML/bundle/22 WebPs match; health reports era 1. Remote migrations 0002/0003 applied; integrity/no-pending checks pass. Protected pre-apply snapshot contained zero scores. Evidence: artifacts/rebuild/public-release/publication-result.md and adjacent reports.

### Accepted verification

Independent build, typecheck, 83 tests, audit zero and local Worker/D1/API checks pass. Native gameplay, four required sizes, ten references, audio, natural loss/replay, delayed active-again callbacks, real Top 20 and empty/error/retry pass. Source/bundle equivalence retains evidence across the asset-format-only release delta.

Live Tester passed two unmodified Hard cycles: native 500 gold/15 lives, clean replay, distinct UUIDs, exact eleven-field bodies, actual HTTP 201/D1 retrieval, native Overall/Hard filters and current highlight, without browser errors. Evidence: artifacts/rebuild/live-deployment-verification/live-verification-summary.md. Live duplicate replay/409 was not reached by the harness; independent local duplicate rejection remains accepted.

Cleanup completed for ONLY UUIDs 84f509e8-d920-4121-99d1-bbd6b1df4b01, 310acb40-f53b-4f66-acf4-f9ed6e452957 and cd930fd7-7c38-4c91-873e-89f185548f98. Exactly three changes; targeted absence verified. Before/after exports contain no non-target records. Protected backup ACL passes. Evidence: artifacts/rebuild/public-release/live-verification-row-cleanup.md.

Retained evidence: artifacts/rebuild/final-release-preflight/transport-release-confirmation.md; gameplay/independent-interactions/results.json; final-regression/; final-menu-input-repair/independent-recheck-v2/; final-audio/; gameplay/physical-performance/; art/independent/.

### Continuation

F01–F32 accepted; F33 remains Medium: images 29,626,078 bytes plus JS 1,832,509 bytes imply approximately 50.3 seconds idealized transfer at 5 Mbps. Lossless WebP saved 35.22%, with exact dimensions/alpha/visible RGB and preserved PNGs. Staged loading paused under the user's publication instruction; do not publish partial staging or relabel slow-network failures PASS.

Physical GPU cadence supports 60 Hz; raw median remains 59.88 FPS. Software-rendered heavy waves are slower. Score validation is aggregate plausibility, not replay-based anti-cheat.

Publication and verification are complete, with F33 deferred. Main owns audit and these three deployment-state docs. Closure Archivist owns remaining framework/docs and reporting. All shell commands use rtk. Main does not perform production/test/operator work under Heavy; authoritative references remain unchanged.
