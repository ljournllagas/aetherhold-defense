# Combined Audit Fixes — Implementation Handoff (2026-10-09)

Plan: `docs/superpowers/plans/2026-10-09-combined-audit-fixes.md`
Spec: `docs/superpowers/specs/2026-10-09-combined-audit-fixes-design.md`
Baseline for the whole-change review: `06938d9`. Branch: `main`.

## Status

Tasks 1–10 are implemented, committed and green. Task 11 is implemented and evidenced except the
`?qa=` preview browser cases. Task 12 (deploy, live verification, push) is **blocked** on the
single issue in "Unresolved blocker" below.

Commits (newest first):

| Commit | Task |
|---|---|
| `ac910f0` | Task 10 — preview next rank/mastery before purchase |
| `5e6e951` | Task 9 — saved-score UI and truthful offline messaging |
| `2fbb04a` | Task 8 — retained manual submissions across reload and tabs |
| `d7f94d1` | Task 7 — native throttling and static response protection |
| `af8664e` | Task 6 — score era 3 with both legacy bests retained |
| `0741ba1` | Task 5 — seeded balance gates and late-progression tuning |
| `98c80af` | Task 4 — staged assets and recoverable loading transitions |
| `ebacccb` | Task 3 — combat independent of rendered frames |
| `ea55ea8` | Task 2 — bounded fixed-step simulation clock |
| `c84b90e` | Task 1 — shared Unicode name policy and settings validation |

## Requirement coverage

| Approved requirement | Owning tasks | Evidence |
|---|---|---|
| R1 time/debt/pause/Auto/render/reset/count equivalence | 2, 3 | `tests/simulation-clock.test.ts`, `tests/scene-timing.test.ts`, `tests/scene-auto.test.ts` |
| R2/R9 manifest/stages/derived textures/entry/results/failure/retry/cancel/font/resize/cache | 4, 11 | `tests/assets.test.ts`, `tests/preload.test.ts`, browser `cold-staged` (6 sizes), `asset-retry`, `cancel-stale-load`, `defeat-art-retry` |
| R3/R7 settings/NFC/UTF-16/IME/server boundaries | 1, 11 | `tests/player-name.test.ts`, `tests/settings.test.ts`, browser `name-ime`, `malformed-settings` |
| R4 fixed-strategy gates/no-gold evidence/price/mastery/report enforcement | 5, 6 | `tests/balance-acceptance.test.ts` (8 scenarios), `artifacts/audit-fixes/balance/traces/summary.json`, `candidates.json` |
| R5 quota/trusted key/binding failure/no DB write/native integration | 7, 11 | `tests/worker.test.ts`, local Worker run: `artifacts/audit-fixes/api.json` (201/409/400/413/429) |
| R6 static/API headers/fonts/scripts/images/audio/CSP | 7, 11 | `tests/static-headers.test.ts`, `dist/_headers`, browser `native built Worker policy` |
| R10 numerical previews/disabled states/purchase equivalence/scroll/stale controls | 10 | `tests/evolution-system.test.ts`, `tests/progression-ui.test.ts`, `tests/scene-progression-ui.test.ts`, `tests/compact-sheet.test.ts` |
| R8/R11 retained attempt/replacement/locks/storage/duplicate/retired/offline UI | 8, 9, 11 | `tests/score-retry.test.ts`, `tests/score-submission.test.ts`, `tests/saved-score-ui.test.ts`, `tests/screens.test.ts`, browser `offline-reload`, `accepted-response-lost`, `cross-tab-late-success`, `storage-*`, `retired-retry` |
| Era 3/current filtering/retained DB rows/legacy bytes/unlocks/old-client rejection | 6, 7, 8, 11 | `tests/personal-best.test.ts`, `tests/worker.test.ts`, `tests/progression-scene.test.ts`, local D1 legacy row survives |
| Full tests/build/native browser/cold review/evidence/deploy/live/push equality | 11, 12 | see gates below; cold review and publish are **outstanding** |

## Final balance configuration and evidence

- `EVOLUTION_COST_FACTORS = [1.5, 2, 2.75, 8]` (rank 3 moved from 3.75 to 8).
- `DAMAGE_FACTORS = [1.2, 1.55, 2.6, 3.38]` (ranks 2–3 carry the approved ×1.3 late-rank multiplier).
- Ranger prices are now 510 / 680 / 935 / 2720; first mastery ranks are 3400 / 4800 / 4200 / 4600 / 5200.
- Selection came from the bounded candidate search in `artifacts/audit-fixes/balance/candidates.json`:
  no rank-3-only factor in `[4,5,6,8,10,12,16]` passed (4–6 left 6–8 rank-3 towers; 8+ lost sieges in
  several seeds) and no combination of the documented rank price grid passed, so the documented
  rank-2/3 damage multipliers were evaluated and ×1.3 with rank-3 factor 8 is the smallest clean result.
- Nine recorded runs (`tests/helpers/balanceRuns.ts` plus the separately finished seed-2 run) all carry
  empty gate lists in `artifacts/audit-fixes/balance/traces/summary.json`; each finished run's terminal
  payload passes `validateScorePayload`, and the continued-endless checkpoint keeps a null terminal
  payload. Fully evolved towers at victory are 5,5,5,5,4,5,5,5 and Medium duration is 1484–1620 s.
- Seeded terminal rule integration payloads (siege-failed, endless-defeat) are recorded separately with
  `evidenceKind: "seeded terminal rule integration, not natural play"`.

## Verification actually run

- `npm run typecheck` — clean.
- `npm test` — **728 passed, 11 skipped, 0 failed** (54 files).
- `npm run build` — succeeds; the pre-existing Phaser bundle-size warning remains (single 1.93 MB chunk).
- Local isolated Worker (`wrangler dev`, `--persist-to .scratch/audit-fixes-d1`, migrations 0001–0004):
  `artifacts/audit-fixes/api.json` records 201 accept, 409 duplicate, 400 for era-2/forged progress,
  413 oversized, one native 429 with `Retry-After: 60`; the era-2 row `audit-legacy-row-0001` survives
  and never appears on the era-3 board.
- Browser matrix against the isolated services (`artifacts/audit-fixes/browser.json`, 19 case groups,
  screenshots and per-case logs): cold staged menu/game/defeat stages at 1440×900, 1280×720, 1024×768,
  844×390, 390×844 and 360×640; held-atlas gating; asset failure and Retry; canceled load with a stale
  completion; IME/name boundaries; malformed settings; offline submit then menu retry after reload;
  accepted-response-lost duplicate (409, single DB row); defeat-art recovery with identical payload;
  storage denied/future/malformed; retired era-2 record; two tabs with a late success; Auto/pause/rotate;
  victory finish and continue-endless; unmodified built Worker policy check.
- Two real defects were found and fixed by this verification: the gameplay/defeat loading transition was
  blocked in a real browser because Phaser marks a scene `RUNNING` only after `create()` returns
  (regression test in `tests/preload.test.ts`), and a failed submit against protected storage reported
  "a newer attempt replaced this saved retry" instead of session-only (`viewFrom` now prefers the
  session attempt for protected bytes).

## Unresolved blocker (Task 11 preview cases → Task 12)

Every `?qa=` game-state browser case (`preview-evolution`, `preview-mastery` at six sizes, and the other
`?qa=` states used by that group) fails in the **development-only QA harness**, not in the shipped flow:
`window.__auditGame` reports `Boot` shut down, both `Preload` and `MainMenu` running, `Game` still in
status INIT, and the page throws `TypeError: Cannot read properties of null (reading 'resolution')` from
Phaser's WebGL `TexturerImage.run` while rendering an image with no texture source. The Game scene never
starts, so the rank/mastery preview cannot be exercised in the browser.

- Product behavior for that feature is covered by `tests/evolution-system.test.ts`,
  `tests/progression-ui.test.ts`, `tests/scene-progression-ui.test.ts` and `tests/compact-sheet.test.ts`
  (96 tests) plus model-level assertions that the committed stats equal the preview.
- Task 12 is therefore not started: the plan requires every acceptance case to pass before publishing.
  The next step is to fix the `?qa=` startup path (likely the QA Preload start while `MainMenu` is still
  running) and re-run `node artifacts/audit-fixes/browser.cjs`.

## Verification limits (not measured)

- Physical audio output and device hardware are not measured; only runtime audio wiring.
- Balance is scripted-bot evidence, not human play; the AC-127 branch-parity limitation remains accepted.
- Native rate-limit counters are per-location and eventually consistent; local denial is evidence of
  wiring, not of production quota precision.
- The cold review in Task 11 Step 6 has not been dispatched yet.

## Repository note

`artifacts/` is git-ignored repo-wide, so the verification scripts, traces, screenshots and JSON evidence
listed here are local to this workspace; the durable record is this document plus `docs/SPEC.md`.
