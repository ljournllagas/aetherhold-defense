# Project progress

## Campaign legacy score target reconciled — COMPLETE, 2026-10-18

The authored `mastery.scoreTarget` bars were unreachable on **98 of the 100**
levels (every level 3–100 authors a value above its own perfect score); only
levels 1 (1,950) and 2 (2,400) sat below the live bar. The bar the player is
shown and judged against was never affected — it is the computed
`campaignScoreMetadata(level).scoreTarget` — so this was inert-but-incoherent
data plus a footgun, and the 2026-10-11 audit's F4 margins described the wrong
bar. The 2026-10-18 evidence doc's "levels 21–30" was too narrow.

Resolved by clamping, not re-authoring: new `legacyCampaignScoreTarget(level)` =
`min(mastery.scoreTarget, metadataTarget)`, used by save validation and
`applyCampaignClear` (`campaignProgress.ts`), the guest legacy payload
(`GuestProgress.ts`), and the campaign leaderboard's `legacy_target`
(`worker/campaignLeaderboard.ts`). Levels 3–100 drop to the live bar (strictly
more permissive, since the legacy clause is OR-ed with the live one); levels 1–2
keep their authored bars so an existing legacy save that earned a star through the
old bar still validates — critical because `validateCloudProgress` is
all-or-nothing, so one rejected level would null an entire cloud save. No
production data was read or changed. Tests:
`tests/campaign-legacy-score-target.test.ts`, plus a leaderboard case in
`tests/campaign-leaderboard-worker.test.ts`. Docs corrected: the F4 row and its
table in `FEATURE_ART_BALANCE_AUDIT.md`, and `BALANCE_EVIDENCE_2026-10-18.md`.

Still REQUIRES-HUMAN and deferred: re-authoring the authored values, deleting the
now-inert field, or retuning the live bar itself (all need human playtesting).

## Hardening and accessibility pass — COMPLETE, 2026-10-18

Five changes from a repo audit follow-up:

- **Worker rate limiting** (`worker/rateLimit.ts`). `/api/auth/start` is now
  limited per client address and `/api/account/*` writes per player, closing the
  unauthenticated amplification path and the unbounded account-write loop. The
  shared `consumeRateLimit` helper replaces the three inline copies; the missing
  or failing binding still fails closed (503) and a healthy denial returns 429
  with `Retry-After`. Tests: `tests/rate-limit.test.ts`.
- **Deploy size**. `public/.assetsignore` excludes `/assets/**/*.png` from the
  uploaded asset set. The 225 build-source PNGs (unstripped, ~270 MB) stay in the
  repository for `tools/optimize-art.py` regeneration but no longer ship; the PWA
  icons, screenshots and favicon still upload. Verified with
  `wrangler deploy --dry-run` at debug level: 225 PNGs ignored, 0 WebP.
  Test: `tests/loading-performance.test.ts` ("deployed asset set").
- **Reduced motion**. `src/game/art/reducedMotion.ts` centralises the preference
  check; the battlefield stronghold beacon no longer pulses when it is set (the
  painted menu backdrop already honoured it, and the login screen shares that
  primitive). Tests: `tests/reduced-motion.test.ts`, plus a beacon case in
  `tests/campaign-map-composite.test.ts`.
- **Classic difficulty selection is keyboard/screen-reader operable**. The
  `AccessibleActionLayer` gained `set()` and `DifficultyScene` mirrors the three
  cards and Back/Continue, announcing the selected card. Spec:
  `docs/specs/2026-10-18-accessible-difficulty-controls.md`. Tests:
  `tests/difficulty-accessible.test.ts`, `tests/accessible-actions.test.ts`.
- Two 2026-10-15 audit items were confirmed already resolved and recorded as
  such: Sentinel/Cinder no longer reuse the Ranger/Bombard sheets, and portrait
  phones already start at a comfort zoom instead of leaving an empty band.

Still open (recorded, not done here): keyboard access to the in-battle sheets and
the portrait-phone `ScrollSheet` rows; in-battle sheets need their own design.

## Codex elite concept art — COMPLETE, 2026-10-18

Wires the ten provisional elite portraits into the Aether Codex. Each unlocked
world's Codex entry now shows its elite concept portrait and a `Concept · <name>`
caption; the portraits are display-only and never claim an encounter (the art's
own tests assert no enemy, boss, evolution or animation mechanics exist). The
assets keep their `showcase_only`/`provisional` flags. `CampaignScene.openCodex`
gates the block on the texture being loaded, so headless paths are unaffected.
Test: `tests/campaign-ui-repair.test.ts` ("Codex elite concept art"). Docs:
`docs/SPEC.md`. Note: these are the only provisional assets in the repository, so
the Codex now presents concept art by design.

Full suite: 2,352 passed, 11 configured skips.

## Balance evidence (F4/F5/F6) — COMPLETE, 2026-10-18

Re-ran the Campaign and Classic simulation gates on current `main` and recorded
the evidence in `docs/BALANCE_EVIDENCE_2026-10-18.md`. No tuning performed. The
live Campaign star target is `ceil(0.9 × perfectScore / 10) × 10`; levels 21–30
clear it, with the tightest margins at level 26 (0.36%), 21 (2.53%) and 23
(3.90%), all driven by lives lost. The configured `mastery.scoreTarget` values
for those levels are unreachable (above the perfect score) and are now only
legacy alternative bars, so the 2026-10-11 audit's F4 margins no longer describe
the live target. Classic Easy/Medium/Hard all finish at full lives, reproducing
F5. Score-target reconciliation is flagged REQUIRES-HUMAN and deferred pending
human playtesting.

## Roomy-portrait boss overlay — COMPLETE, 2026-10-18

Extends the 2026-10-15 compact boss fix to roomy portrait phones. `gameLayout`
now exposes `roomyPortrait`; `GameScene.updateCompactBossBar` floats the boss bar
in the empty band above the width-limited board on roomy portrait instead of
reserving a strip and refitting the camera. The layout, HUD, tray and camera now
stay identical across a boss spawn on those sizes, and the bar is a translucent
overlay inside the field. Desktop and tablet (non-compact) sizes keep the
reserved strip. `tests/boss-panel-placement.test.ts` updated: the roomy-portrait
reservation tests now assert a floating overlay, and a new matrix asserts the
layout and camera are unchanged at 360x640 and 390x844.

Full suite: 2,351 passed, 11 configured skips. `npm run deploy` published Worker
`e0bcdc49-07fe-4131-9701-d9281ad7fdd3` serving `index-DmT8au5N.js`; live HTML,
bundle SHA-256 and `/api/health` matched `dist`.

## Accessible main-menu controls — COMPLETE, 2026-10-18

Adds a keyboard and screen-reader layer for the main-menu destinations, the
entry-flow half of the 2026-10-14/15 audit's P1 (WCAG 2.1.1/4.1.2).
`src/game/ui/accessibleActions.ts` mounts one real `<button>` per canvas action
inside `#game-root`, labelled from the same string as the canvas control and
positioned over it. Buttons are transparent and `pointer-events:none`, so
mouse/touch keeps the existing canvas press/release behaviour while Tab focus
and Enter/Space activation work; `:focus-visible` shows the shared gold outline.
The layer is removed on scene shutdown and exposes `add` for the async Saved
Score button. `MainMenuScene` collects its action descriptors and mounts the
layer. Spec: `docs/specs/2026-10-18-accessible-menu-controls.md`. Tests:
`tests/accessible-actions.test.ts` and `tests/main-menu-accessible.test.ts`.
Difficulty selection and in-battle sheets remain separate slices.

Full suite: 2,349 passed, 11 configured skips. `npm run deploy` published Worker
`05cf45df-ee2b-4c30-9a59-de7e248ea9de` serving `index-kN433Deu.js`; live HTML,
bundle SHA-256 and `/api/health` (ok/scoreVersion 3) matched `dist`.

## Biome-cosmetic Sigil rewards (F3) — COMPLETE, 2026-10-18

Defines the two advertised Campaign biome cosmetics so they have a visible
effect. The Ember Sigil's `emberfall_cosmetics` now earns the Emberfall
forge-gate landmark and the Frost Sigil's `frostveil_cosmetics` the Frostveil
landmark; each appears beside its world's caption on the Campaign map once
earned. Worlds with no advertised cosmetic keep their landmark as base
decoration. Decoration is display-only: it is never interactive and never
alters routes, plots or tap targets.

Implementation: `landmarkArt.ts` adds `landmarkCosmeticUnlocked` and
`landmarkCaptionReserve`; `CampaignScene.drawMap` reserves caption space and
places the landmark. New `tests/landmark-biome-cosmetics.test.ts` (6 tests)
covers the gate, Sigil binding, caption reserve and scene rendering before and
after unlock. Docs updated: `SPEC.md`, `CAMPAIGN_WORLDS_1_3.md` and the F3 row
of `FEATURE_ART_BALANCE_AUDIT.md`.

Full suite: 2,341 passed, 11 configured skips; typecheck/build passed with the
existing large-chunk advisory. `npm run deploy` published Worker
`f9e88e23-a900-4d00-b8bf-5e5087bdd6f5` at
https://aetherhold-defense.ljournllagas.workers.dev/ serving
`index-DC8exxaJ.js`; live HTML, bundle SHA-256 and `/api/health`
(ok/scoreVersion 3) matched `dist`. A live Campaign-map interaction was not
browser-exercised (the desktop window was not visible for canvas input).

## Sentinel and Cinder artwork — COMPLETE, 2026-10-15

Heavy deployment `sentinel-cinder-art-20261015` starts from latest main
`c7301e124c84ad988a5c641a8640d9f893ef3c57`, with a clean working tree.
Replace reused Ranger/Bombard imagery with original painted Sentinel arbalest
and Cinder cauldron designs: four foundation stages and two campaign tiers each.
Preserve combat, economy, saves and branch crests. Executor owns generation,
integration and release operations; independent Tester must accept asset
contracts, actual rendering and required tests before main merge/deployment.
Twelve generated states and dedicated runtime assets are integrated. Independent
acceptance at `4b9221db753303818df974bbf84b5faa9288b4ff` passed packed alpha/
dimensions, 24 desktop/phone renderer states, portraits, crests, tier switching,
restart/resize and legacy compatibility. Sentinel bolts and Cinder ember/impact
repair resolves the old Tempest fallback. Full suite: 1,734 passed, 11 existing
optional tuning/report skips; typecheck/build passed. No required test skipped.
Application merged/pushed to main at `4b9221db753303818df974bbf84b5faa9288b4ff`;
actual remote SHA matched. `npm run deploy` repeated the passing tests/build and
published Worker `c844818a-823f-4749-a362-0203a659c756` at
https://aetherhold-defense.ljournllagas.workers.dev/.
Live HTML, current JS and all six runtime tower files match dist byte hashes;
health is 200/ok/scoreVersion 3. Read-only desktop/phone guest-menu smoke passed
with no JS/server errors or server writes. Authenticated live gameplay, physical
touch and full matches were not tested; local QA covered actual loader/rendering.
Evidence: `artifacts/tower-art-release/release-summary.json` and
`artifacts/tower-art-verification/browser/browser-runtime-report.json`.
Provenance and exact generation records: `docs/SENTINEL_CINDER_ART_PROVENANCE.md`.
Final workflow documentation synchronization follows the application release.

## Final campaign artwork - COMPLETE, 2026-10-14

Heavy deployment campaign-final-art-20261012 completed the approved77-asset scope.
All28maps,7panels,35monster atlases and7boss atlases accepted/integrated/live.
120active final assets,zero provisional/temporary entries. Original43finals and
77v1 rollback files preserve hashes/dimensions. No artwork or implementation remains.

Live https://aetherhold-defense.ljournllagas.workers.dev/
Worker version e1ef97b3-1b51-4489-8e57-d87d7115423e.
Application f3247574c2dc2b640d1acfbee391d9a640d2044b pushed;actualremote HEAD matched.
1524tests passed/11configuredskips,typecheck/build PASS. Independentfreshsource
100/100 ACTUALlevel renders and197texturechecks PASS;7naturalbossflows/lifecycle PASS.
LiveHTML/currentJS exactSHA25643c8b496695ee80826d05e31c236d2df7d798825f877b8ee960afe011e6eac0f,
health200scoreVersion3;all197active/rollback PNG paths exacthashes.
Canonical report: artifacts/campaign-final-art-20261012/integration/final-expansion-art-integration-report.md.
Detailedsource/live/evidence/limits andclosure handoff: latest_session_work.md.

Combat/save/warning/route contracts retained. RegisteredStormmawphase_two uses
explicitQA because gameplayhasno phase2. Authenticatedlivegameplay/physicaltouch/
fullmatches unverified;compactfine-detail/crowding/breakpoint andoneexploratory
HydraQA limit documented. Existingbundlewarning and11skips retained.
ClosingHeavydocumentation/token handoff precedesfinalresponse;docs-only Git
synchronization mayfollowapplicationcommit,thenrepositorysealed.

## Campaign v5 — complete

Heavy deployment `campaign-v5-20261012` implements
`artifacts/CODEX_V5_IMPLEMENTATION_PROMPT.md`. The verified 100-level/ten-world
campaign is published at https://aetherhold-defense.ljournllagas.workers.dev/ ,
version `cb1eb993-64e5-4f3c-9d17-5d7aee12b1e2`.
Application commit `52531f6d231ac849bd2ea37cdeab051404eea33b` was pushed to
`origin/codex/campaign-v5-20261012`; local HEAD matched the fetched remote.
All 143 assigned paths are synchronized, including specifications and 77 assets.
Only unrelated `.scratch/` and `.superpowers/` remain outside the commit.
Application work is complete. Final-art approval is the separate next milestone.

Exact first-thirty definitions/rewards/waves, version-1 saves and Classic flow
are preserved. All 120 paid expansion cases earn three stars; all 100 levels
load/render; independent saved 40→41 and 99→100/terminal results pass. Save/cloud,
guest/account isolation, all seven new bosses and support roles, lifecycle,
four-size responsive UI and code-review repairs are accepted. Fixed mastery
targets required 32–52 waves in Levels 41–100, averaging 21 simulated minutes
(range approximately 11–41); first 1–40 counts and global scoring stay unchanged.

Fresh isolated installation/typechecking/build and final deployment checks pass.
Final deployment tests: 1,431 passed, 11 configured skips, using one test worker
after parallel geometry timeouts. Live HTML/current bundle/health and browser
welcome render pass. The existing large-bundle advisory remains. No real
production account write or clean-account 1→100 human playthrough was performed.

The original 43 final assets retain their hashes. All 77 expansion assets are
stage-scoped provisional registrations and remain final_required. Candidate
comparison is complete, including actual towers on all 28 map candidates; no
candidate is promoted, and the Crown panel text artifact is rejected.
All 77 final-art approvals remain UNVERIFIED and form a separate art follow-up.
## Prior deployment history (Worlds 1–3)

Heavy deployment: campaign-production-completion-20261010. Baseline: main at 22ee273447e6c252cad5ea7adf92446d3db88a79. Goal: complete the agreed Worlds 1-3 expansion, preserve the existing combat and Classic systems, and satisfy the explicit missing-production-art allowance.

Campaign Levels 1-30, replay Mastery Stars, World Sigils, milestone unlocks, Specialization I, Codex, versioned local saves, three boss mechanics, map families and variants are implemented in the existing engine. Independent functional verification passed all thirty battle cases and progression, persistence, mastery, sigil, specialization, boss and restart coverage. Isolated browser save/reload and future-version preservation passed.

The working manifest contains 25 final assets: three previously published world panels, twelve terrain plates and ten tower evolution images. All twelve raw plates passed independent image, dimension, opacity, provenance and biome review. Five sources were mechanically cropped by one bottom row to exact 1672x940, with originals retained. Tower pairs passed independent placed review and final combined battlefield compatibility.

Eighteen enemy/boss atlases remain absent and final-art UNVERIFIED. Only Marchling generation was attempted; its four diagnostics were rejected. The other seventeen subjects were not attempted. Correct manifest/loading contracts and coherent procedural fallbacks remain. Exact paths and production provenance are in docs/CAMPAIGN_PRODUCTION_ASSETS.md and docs/CAMPAIGN_PRODUCTION_ART_PROVENANCE.md.

Art-release gates before the P6 UI repair: 935 tests passed across 67 files, 11 configured skips across four files; typecheck and build passed. Source and dist contain exactly the 25 staged files with matching hashes, no pending atlases and no Worlds 4-10 paths. Native ordinary Level 1 failure, Retry, Back and stale-callback checks passed without storage writes or score POSTs. Build retains the existing large-chunk warning. Repeat change-specific gates after P6.

## Deployment and synchronization

V6 passed twenty boss phase/facing captures, all three phase thresholds, pause/speed/restart and six-size campaign map/detail/flow plus 10-Star Codex and 20-Star preparation review. V8 passed actual-loader rendering and geometry for all thirty variants, selected-family hashes, evolved tower compatibility with active effects across all worlds and the Classic control. Root inspected representative contacts and accepted their scopes. These results certify temporary presentation and accepted terrain/towers, not the absent final enemy/boss atlases. Extra unlocked 30/90-Star UI review completed and exposed the defects tracked below.

The first art release exposed real WebGL clipping and fully unlocked Codex spacing defects. P6 repaired all three mask callers, hidden-node input and measured paragraph spacing. Independent V6 accepted the repaired unlocked six-size UI and boss captures. V9 independently passed precise map, battlefield and leaderboard boundaries, input, pan/zoom, restart, resize, rotation and re-entry in actual Edge WebGL: zero outside-band pixel changes, one filter and pointer-listener set after restart, and zero browser errors, warnings or API mutations. Canvas fallback tests passed. Final repair deployment, live verification and implementation Git synchronization passed. Preserve unrelated .scratch/ databases and ignored raw artifacts.

## Published art release

P6 uses supported external WebGL masks with Canvas fallback across Campaign, Game and Leaderboard, guards hidden-node input and measures Codex paragraph height. Accurate Leaderboard test doubles are repaired. Independent V5 passed 939 tests / 11 skips across 68 passed / four skipped files and typecheck; the successful build remains stable. V6 passed eighteen unlocked UI cases across six sizes and all twenty boss captures, with no overlaps or unsupported-mask warnings. V9 precision clipping and lifecycle acceptance passed before redeployment.

Live URL: https://aetherhold-defense.ljournllagas.workers.dev/. Final Worker af75da8f-9800-42ce-919d-e823a0ad471a serves index-De2JS_7L.js, SHA-256 42C5D68374993BDE0FB41DBCB942DCD9A953E6742BE1C7A5CE2B4104CB90922D. Deployment passed 939 tests / 11 configured skips, typecheck and build. HTML, JS, CSS and all twenty-five campaign PNGs returned 200 and matched dist; health returned ok:true, scoreVersion:3. Instrumented ordinary Campaign/Classic restart and navigation passed with 32 GETs, no API mutations, profile writes, page errors or mask warnings. Four screenshot ReadPixels driver warnings had no visual impact. Bindings were preserved and no migrations ran. Implementation commit d4d54623ccc5e4a833908e5fe127958f9b072c58 was pushed and verified equal to origin/main with ahead/behind0/0;55taskfiles committed,23unrelated scratch files preserved. Closure handoff is synchronized separately as documentation only. Final atlases, physical-device input and human balance remain UNVERIFIED.
