# Campaign Worlds 1–3 — Verification Handoff

Deployment `campaign-w1-w3-20261009` is published and implementation closure is
complete with the explicit art limitation below. The campaign covers Levels 1–30
only. Main deployment state and continuation remain canonical in
[`project_progress.md`](project_progress.md), [`project_diary.md`](project_diary.md)
and [`latest_session_work.md`](latest_session_work.md).

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Build | PASS | `npm run deploy` build gate; local `dist` matches live assets. |
| Typecheck | PASS | `npm run deploy` build gate. |
| Automated tests | PASS | 893 passed; 11 configured skips. |
| Levels 1–30 progression | PASS | Natural runs and independent progression verification. |
| Save/reload | PASS | Local versioned save/reload, six viewport native QA. |
| Mastery Stars | PASS | Persistent flags and replay accumulation verified. |
| World Sigils | PASS | Boss-clear Sigils and feature derivation verified. |
| Level 10 → World 2 unlock | PASS | Border Sigil transition verified. |
| Level 20 → World 3 unlock | PASS | Ember Sigil transition verified. |
| Level 30 milestone completion | PASS | Frost Sigil and three-world completion verified; no World 4. |
| Tower Specialization I | PASS | 30-star threshold, choices and battle availability verified. |
| Campaign world map | PASS | Functional and temporary-art screenshot review. |
| World 1 visual QA | PASS (temporary art) | Reviewed; final production art UNVERIFIED. |
| World 2 visual QA | PASS (temporary art) | Reviewed; final production art UNVERIFIED. |
| World 3 visual QA | PASS (temporary art) | Reviewed; final production art UNVERIFIED. |
| Cinder Colossus visual/gameplay QA | PASS gameplay + temporary art | Phases and callouts reviewed; final production art UNVERIFIED. |
| Frostbound Matriarch visual/gameplay QA | PASS gameplay + temporary art | Telegraph, freeze, phases and callouts reviewed; final production art UNVERIFIED. |
| Responsive QA | PASS | Native browser flow, rotation, reload and six viewport sizes. |

Independent progression verification passed 28 tests. Combat/regression passed
180 tests and six paid-resource challenge levels. All 30 natural simulation runs
met their original score/lives targets; an independent audit checked 676 purchase
prices against before/after balances. These are simulation results, not human
balance testing. The Hollow Warden was also exercised through combat phases and
visual callouts. Human balance and physical-device input remain UNVERIFIED.

Published at https://aetherhold-defense.ljournllagas.workers.dev/ with Worker
`62eadfc5-a3bd-4f69-8b21-89947401dbbc`. Live HTML and current JavaScript match
local `dist`; `/api/health` returns 200 with `scoreVersion: 3`. The unmodified
production Menu → Campaign → Classic Siege → Difficulty → gameplay flow had no
page/JS errors, failed app requests or score POSTs. Two implicit `/favicon.ico`
404 warnings are known and nonblocking. No database migration or binding change
ran.

At this 2026-10-09 deployment, all 43 raster targets were `final_required` and
`AVAILABLE_CAMPAIGN_ART_PATHS` was empty. The current manifest has since advanced:
25 targets are `final` (three realm panels, twelve terrain plates and ten Tier
II/III towers), while eighteen enemy/boss atlases remain `final_required` with
procedural fallbacks. V7 raw review passed all twelve terrain plates, and P5
staged the eleven remaining plates in the manifest and allowlist for V6 runtime
QA. The atlases remain absent: Marchling's
diagnostics were rejected and the other 17 were not attempted. Final atlas art
is UNVERIFIED. V6 passed the combined map/tower runtime review after P5; its
actual-loader sweep covered 30 levels and six tower-tier cases. V6 also passed
18 unlocked-state visual cases across six viewports at 29/30/90 stars with no
layout issues, plus 20 boss-phase captures, three threshold checks and
pause/speed/restart cleanup. These boss captures use procedural sprites and do
not certify atlas art. See
[`CAMPAIGN_PRODUCTION_ASSETS.md`](../docs/CAMPAIGN_PRODUCTION_ASSETS.md) for the
current manifest/loading gate and
[`CAMPAIGN_PRODUCTION_ART_PROVENANCE.md`](../docs/CAMPAIGN_PRODUCTION_ART_PROVENANCE.md)
for exact prompts, references, hashes and the missing-path list. Runtime proof:
[V6 actual-loader matrix](../artifacts/campaign-production-completion-20261010/verification/maps-final-visual/actual-map-loader-results.json),
[V6 unlocked-state visuals](../artifacts/campaign/visual/final/unlocked-states/final-unlocked-ui-results.json),
[V6 boss lifecycle](../artifacts/campaign-production-completion-20261010/verification/boss-overlays/boss-overlay-results.json),
[V9 mask precision/lifecycle](../artifacts/campaign-production-completion-20261010/verification/v9-viewport-mask/v9-viewport-mask-results.json),
and [P6 automated recheck](../artifacts/campaign-production-completion-20261010/verification/loading/final-p6-recheck-report.md).

All twelve terrain plates are currently staged in `public/` and available to
the runtime loader; V5's earlier preview check served the pre-P5 candidates
from `dist` while the old manifest/allowlist excluded them. The final art
release completed under the user's explicit missing-art allowance. Worker
`af75da8f-9800-42ce-919d-e823a0ad471a` is live at
https://aetherhold-defense.ljournllagas.workers.dev/ and serves
`index-De2JS_7L.js` (SHA-256
`42C5D68374993BDE0FB41DBCB942DCD9A953E6742BE1C7A5CE2B4104CB90922D`). Release
tests passed (939 tests, 11 configured skips), typecheck and build passed.
HTML, JS, CSS and all 25 campaign PNGs returned 200 and matched `dist`;
`/api/health` returned 200 with `ok: true`, `scoreVersion: 3`. Evidence:
[live verification](../artifacts/campaign-production-completion-20261010/verification/release/live-verification-p6.json)
and [ordinary live smoke](../artifacts/campaign-production-completion-20261010/verification/release/native-live-smoke-p6.json).
V9 passed headless Edge WebGL checks for
all six map viewports, all three campaign worlds plus Classic pan/zoom and
resize/restart/reentry cleanup, and empty/20-record leaderboard scrolling in
desktop and portrait layouts. Its 44-node map input sweep produced no gutter
changes; four Canvas fallback tests passed, with no errors, warnings, failed
requests or API mutations. Fresh isolated ordinary Campaign Level 1 and
Classic Medium navigation/restart/return also passed without a QA query, wave
start or score settlement. The live smoke recorded 32 GETs, no API mutations,
campaign-profile writes, failed requests, page errors or mask warnings, and a
clear 16px gutter. Four GPU ReadPixels screenshot warnings had no visual impact;
the existing Vite chunk advisory remains. Physical-device touch remains
unverified. Git sync remains pending. If a
future review rejects a staged candidate, move its public copy back to ignored
artifacts before release build/deploy while preserving its original. Campaign
UI pictograms remain procedural/vector or text assets. P6's shared viewport
mask uses Phaser 4's external WebGL mask with Canvas fallback and guards map
node input against masked bounds.

Evidence is local and git-ignored: `artifacts/campaign/verification-progress.md`,
`verification-combat.md`, `visual/final/verification-report-final.md`,
`artifacts/campaign-w1-w3-20261009/p3-balance.json`, and
`artifacts/campaign/release/deployment-verification.json`. The release and
read-only Git handoff are recorded in the canonical project progress/latest
session documents.
