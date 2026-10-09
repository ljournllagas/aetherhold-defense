# Project progress

Deployment: fantasy-rebuild-20261007. Heavy route. No Git repository.

The updated Aegis of the Borderkeep is published at https://aetherhold-defense.ljournllagas.workers.dev/. Immutable candidate 5190 HTML, bundle and all 22 WebPs match live responses. Remote migrations 0002/0003 applied; integrity/no-pending checks pass. Protected pre-apply snapshot contained zero scores.

Independently accepted: simulation/backend repairs, native gameplay, adaptive controls, painted world/twenty tower stages/nine animated enemy roles/HUD/relic art, boss/reveal/defeated presentation, settings/audio, clean replay, asynchronous run guards and full Hall interactions. Ten reference states and four required viewport sizes pass. Build, typecheck, all 83 tests and zero-advisory dependency audit pass.

Two live unmodified Hard loss/replay cycles saved distinct UUIDs through real HTTP 201/D1 records. Native Hall filters and current highlight pass. Exact UUID cleanup removed only the three verification scores; targeted absence and protected before/after exports pass. No non-target rows existed in the pre-delete snapshot.

Publication and verification complete. Remaining findings: Critical 0, High 0, Medium 1, Low 0. F33 is slow initial loading despite 35.22% lossless image savings. Staged loading is deferred under the user's publication instruction. Closure documentation is assigned separately.

Responsive playability (2026-10-08) was published afterwards; see responsive_playability_2026-10-08.md.

## Progression and evolutions (2026-10-08 to 2026-10-09, version 0.2.0, score era 2)

Implemented locally, not yet deployed. Plan: docs/sdd/plans/20261008-progression-evolutions.md; T1–T26 and T29–T35 done, T27 (release gates, live-check script) and T28 (remote migration 0004, deploy, live verification) pending. Ten evolution branches with ranks 0–3, endless mastery, browser-local branch unlocks, wave-30 siege victory with Finish Run / Continue Endless, explicit Submit Score, Progression menu panel and Legacy best.

On 2026-10-09: `npm test` 465 passed / 6 skipped (471), typecheck and build pass. Rendered QA covered six viewports in headless Chrome with scene-method actions only; F1–F4 fixed in T32–T34 but not recaptured. Balance evidence is bot simulation, not human play. User-accepted failed gates: AC-131 (7–8 fully evolved towers vs 2–5) and AC-127 (Winterguard and Spellbreaker dominate in the model). Record: artifacts/progression/verification.md. Handoff: progression_implementation_2026-10-08.md.

Canonical audit: docs/REBUILD_AUDIT.md. Continuation: latest_session_work.md.
