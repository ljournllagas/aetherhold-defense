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

All **43** raster targets in
[`CAMPAIGN_PRODUCTION_ASSETS.md`](../docs/CAMPAIGN_PRODUCTION_ASSETS.md) remain
`final_required`; `AVAILABLE_CAMPAIGN_ART_PATHS` is empty. The campaign uses
coherent procedural temporary art and procedural/text UI pictograms. Expansion
concept boards are not final sprite atlases, and support buff playback is
unverified. The production-art list is the next art-production entry point.

Evidence is local and git-ignored: `artifacts/campaign/verification-progress.md`,
`verification-combat.md`, `visual/final/verification-report-final.md`,
`artifacts/campaign-w1-w3-20261009/p3-balance.json`, and
`artifacts/campaign/release/deployment-verification.json`. The release and
read-only Git handoff are recorded in the canonical project progress/latest
session documents.
