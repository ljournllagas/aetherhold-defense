# Project progress

## Campaign world-map production art (2026-10-10) — published

Deployment `campaign-worldmap-art-20261010`, Heavy route. Following the published campaign milestone, the next bounded production batch is the three Borderkeep/Emberfall/Frostveil world-map region illustrations. Generate original raster candidates using the built-in imagegen workflow, preserve gameplay and classic loading behavior, review actual responsive rendering independently, then promote only accepted assets through the existing manifest contract. The other 40 raster targets remain outside this batch and UNVERIFIED.

All three revised original panels passed independent raw-art review. Independent browser verification captured 29 screenshots across six viewports and passed campaign-only loading, proportional crops, 44px targets, selection/battle entry, warm cache, reload/rotation and Retry/Back recovery with no storage/API writes. Clipped portrait headings were repaired using wrapped captions within the visible realm intersection and measured slate backing. Fresh independent recheck passed all three worlds at both portrait sizes, desktop and short landscape. The three panels are now `final`, with exact approved paths and `temporary:null`; the remaining 40 art targets remain `final_required`.

Fresh release gates passed: 907 tests / 11 configured skips, typecheck and build. Published Worker `6382e8c5-060e-4ba5-a29a-d41441313ef0` at https://aetherhold-defense.ljournllagas.workers.dev/. Live HTML, JavaScript, CSS and three PNGs match dist; `/api/health` is 200 `{ok:true,scoreVersion:3}`. Bundle `/assets/index-Bq-tNF23.js` SHA-256 `aaef80b748297065f09c6e64ed0d90d5c1b34da633890bca33c95d168d6490d5`. Native production campaign/classic entry passed with no failed requests, browser/console errors or score POSTs. The 28 task-owned files were committed and pushed as `77423fe94c72030c9912180ab41a2a4c67cfae3e`; fresh fetch verified local/remote equality. This final status update is documentation-only. Unrelated `.scratch/` files remain untouched and untracked. Existing large-bundle warning, physical devices and the other production art remain limitations.

## Campaign Worlds 1–3 (2026-10-09 to 2026-10-10) — published

Deployment `campaign-w1-w3-20261009`, Heavy route. Scope: campaign Levels 1–30 only, illustrated realm map, persistent replay mastery, Sigils and milestones, canonical map families, biome enemies and three bosses, prebattle specialization, Codex, versioned local saves, independent functional and screenshot verification. The expansion pack's written contracts control campaign behavior; its boards and starter sheets do not establish final-art acceptance.

Implementation is integrated into the existing fixed-step GameScene. Campaign results remain local and separate from classic bests, score submission and branch achievements. Independent progression verification passed 28 tests; combat/regression verification passed 180 tests and six paid-resource challenges. All 30 natural simulation runs reached their original score/lives targets, and an independent audit verified all 676 purchase prices and before/after balances.

Final whole-project gates: typecheck/build PASS, 893 tests passed / 11 configured skips. DEV-only isolated campaign/boss/results fixtures passed regression and production stripping checks. Independent screenshot QA passed the reviewed map/detail/Codex/preparation/results, three biomes, boss callouts and compact bars, temporary placed tower tiers I–III, and six-size native flow/rotation/reload. Repairs include route ordering, 44px targets with 8px separation, measured wrapped detail heights, honest session-only copy, QA bootstrap timing and separated ability notices/boss rows.

Published at https://aetherhold-defense.ljournllagas.workers.dev/ with Worker version `62eadfc5-a3bd-4f69-8b21-89947401dbbc`. Live HTML and `/assets/index-DusJeCBx.js` are byte-identical to local dist; JavaScript SHA-256 `6f7746638afdd959e493a5e3dfb0628bd5bd86e13fd69987ac701f51584d5568`. `/api/health` returns 200 `{ok:true,scoreVersion:3}`. Unmodified production Menu→Campaign→Classic Siege→Difficulty→gameplay passed with zero page/JS errors, zero failed application requests, 49 GETs and zero POSTs. Implicit `/favicon.ico` returns 404 and produced two console warnings; recorded as nonblocking. No migration or binding change ran.

Implementation and documentation are committed and pushed to `main` as `8fe3619a9a0ef6644f520d46ed4f2d23060f3bf5`; local/remote HEAD equality was verified. The final handoff status is a documentation-only update; the tested/published application bytes are unchanged. Unrelated `.scratch/` files remain untracked. All 43 new production art targets remain `final_required`; procedural fallback rendering does not establish final-art approval. Human balance and physical-device input remain UNVERIFIED. Raw verification is local under gitignored `artifacts/campaign/` and `artifacts/campaign-w1-w3-20261009/`.

## Historical records (superseded by the current release above)

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
