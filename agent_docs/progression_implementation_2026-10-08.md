# Progression and evolutions — 2026-10-08 to 2026-10-09

Plan: `docs/sdd/plans/20261008-progression-evolutions.md` (spec-driven, one task per developer dispatch).
The folder has no Git repository; the plan's "Commit" lines were checkpoint labels only. Version 0.2.0,
score era 2 (`src/shared/version.ts`: `GAME_VERSION '0.2.0'`, `SCORE_VERSION 2`).

Verification record: `artifacts/progression/verification.md`. Authoritative rules: `docs/SPEC.md` §12, §18,
§32 and `docs/DESIGN_SYSTEM.md` (amended in T25).

## Implemented

- Typed evolution roster: each of the five towers has a starter branch and an alternative branch, ranks 0–3
  after foundation level 4, with effective-stat configuration (`src/game/config/evolutions.ts`).
- Atomic purchases with recorded investment, floating-point-safe 70% sale refund, and endless-only mastery with
  the "numeric limit reached" guard (`EvolutionSystem.ts`).
- Evolution combat engine: shot snapshots, physical/ward armor, statuses (freeze, slow, vulnerability, stun,
  shared control immunity), burning fields, Volley and chain lightning (`EvolutionCombat.ts`).
- Branch achievements and a browser-local unlock repository under `aetherhold-unlocks-v1`: never overwrites
  unreadable or newer data, merges writes, converges two tabs, keeps failed saves in memory with a warning
  (`UnlockSystem.ts`).
- Siege lifecycle: wave-30 single-Warlord finale, victory decision (Finish Run / Continue Endless), victory-only
  relic exits, discarded runs on Restart/Quit (`SiegeSystem.ts`, `waves.ts`, `WaveSystem.ts`).
- Terminal results carry progress fields; shared payload validation; new score era with additive migration
  `0004_progression_results.sql` and Worker progress columns; current-era personal best with a separate Legacy
  best.
- Game Over screen with explicit Submit Score; in-run achievement notices; Tower Progression sheet, inspector and
  wave labels rendered from pure presentation models; branch art accents and effect visuals; menu Progression
  panel.
- Follow-up fixes from rendered QA: formatted printed stats (F1, T32), short-landscape sheet bounds and QA seed HUD
  refresh (F4/F3, T33), achievement notice redrawn after resize (F2, T34).
- Balance tooling: deterministic economy gates, a headless simulation bot, recorded simulation traces and an
  equal-investment branch comparison.

## Files created

T1–T21:

- `src/shared/progression.ts` (T1)
- `src/game/config/evolutions.ts` (T1)
- `tests/evolution-config.test.ts` (T1)
- `src/game/systems/EvolutionSystem.ts` (T2)
- `tests/helpers/evolutionFixtures.ts` (T2; created `tests/helpers/`)
- `tests/evolution-system.test.ts` (T2)
- `src/game/systems/EvolutionCombat.ts` (T3)
- `tests/evolution-combat.test.ts` (T3)
- `src/game/systems/UnlockSystem.ts` (T4)
- `tests/unlocks.test.ts` (T4)
- `src/game/systems/SiegeSystem.ts` (T5)
- `tests/siege.test.ts` (T5)
- `tests/siege-finale.test.ts` (T6)
- `src/shared/resultProgress.ts` (T7)
- `tests/helpers/progressionResult.ts` (T7)
- `tests/result-progress.test.ts` (T7)
- `tests/progression-results.test.ts` (T9)
- `migrations/0004_progression_results.sql` (T10)
- `tests/personal-best.test.ts` (T11)
- `tests/leaderboard-client.test.ts` (T11)
- `tests/scene-purchases.test.ts` (T12)
- `tests/scene-combat.test.ts` (T13)
- `tests/scene-siege.test.ts` (T14)
- `tests/scene-achievements.test.ts` (T15)
- `src/game/ui/progressionView.ts` (T18)
- `tests/progression-ui.test.ts` (T18)
- `tests/scene-progression-ui.test.ts` (T19)
- `tests/progression-art.test.ts` (T20)
- `src/game/scenes/ProgressionScene.ts` (T21)
- `tests/progression-scene.test.ts` (T21)

T8, T16, T17, T29 and T30 created no files.

T22–T35 (QA, balance, fixes, documents):

- `artifacts/progression/ui/checklist.md`, `qa-run.json` and 66 screenshots `<width>x<height>-<state>.png` (T22)
- `tests/helpers/progressionTrace.ts`, `tests/progression-balance.test.ts` (T23)
- `tests/helpers/simulationBot.ts`, `tests/simulation-bot.test.ts` (T31, strengthened in T35)
- `artifacts/progression/balance/run-simulations.test.ts` and `traces/{medium-starter-1,medium-starter-2,medium-unlocked-1,easy-1,hard-1,summary}.json` (T31, rewritten in T35; run only with `BALANCE_SIM=1`)
- `artifacts/progression/balance/branch-comparison.test.ts`, `branch-comparison.json`, `branch-comparison.md`, `playtests.md` (T24)
- `tests/stat-format.test.ts` (T32)
- `tests/compact-sheet.test.ts` (T33)
- `tests/notice-resize.test.ts` (T34)
- `artifacts/progression/verification.md`, this file (T26)

## Files modified

- Config and systems: `src/game/config/towers.ts`, `src/game/config/waves.ts`,
  `src/game/systems/WaveSystem.ts`, `src/game/systems/EconomySystem.ts`, `src/game/systems/Settings.ts`.
- Entities: `src/game/entities/Tower.ts`, `src/game/entities/Enemy.ts`.
- Scenes and UI: `src/game/scenes/GameScene.ts`, `src/game/scenes/GameOverScene.ts`,
  `src/game/scenes/MainMenuScene.ts`, `src/main.ts`, `src/game/ui/ScrollSheet.ts`, `src/game/ui/layout.ts`,
  `src/game/art/towerArt.ts`, `src/game/qa.ts`.
- Shared, API and backend: `src/shared/types.ts`, `src/shared/validation.ts`, `src/shared/version.ts`,
  `src/api/leaderboardClient.ts`, `worker/index.ts`, `package.json` (version only).
- Existing tests: `tests/game.test.ts`, `tests/worker.test.ts`, `tests/screens.test.ts`, `tests/qa.test.ts`,
  `artifacts/rebuild/backend/independent.test.ts`, `artifacts/rebuild/backend/boundary-probe.test.ts`.
- Documents: `docs/SPEC.md`, `docs/DESIGN_SYSTEM.md` (T25); `agent_docs/project_progress.md`,
  `project_structure.md`, `latest_session_work.md` (T26).

## Verification evidence (2026-10-09)

- `npm test`: 34 files passed, 2 skipped; 465 tests passed, 6 skipped (the skipped ones are the two
  `BALANCE_SIM`-gated balance runners).
- `npm run typecheck`: passes. `npm run build`: passes; the existing large-chunk warning remains.
- Rendered QA (T22): headless Chrome, six viewports, 0 console errors; about 15 of 66 screenshots viewed
  directly; actions invoked through scene methods, not touch. F1–F4 were fixed in T32–T34 with tests, but the
  screenshots were not recaptured. Details and the list of what was not verified: `verification.md`.
- Balance: simulation from a scripted bot, not human playtests (the user chose this substitution). All five runs
  are relic-assisted, so AC-128/AC-129 rest only on the T23 deterministic economy test.

## Accepted conflicts (user decision, 2026-10-09)

- AC-131: simulated builds end with 7–8 fully evolved towers against the 2–5 gate. Shipped as-is; the gate is
  recorded as failed.
- AC-127: Winterguard beats Brittle Ice and Spellbreaker beats Arcane Beacon in all four modelled roles. Accepted
  as a model limitation.

No coefficient was tuned.

## Remaining

- T27: final release gates and `artifacts/progression/check-live.ps1`.
- T28: remote migration 0004, `npm run deploy`, live verification; fills the Release section of
  `verification.md`. Until then the live site serves the previous release (era 1).
- Not verified: touch input, 44 px targets, hover/focus, reduced motion, rotation, backgrounding, a real Submit
  Score failure/retry, browsers other than headless Chrome, physical devices, human play, retention.
- Recapture the 844x390 Tower Progression sheet and the notice-after-resize screenshots (advisory item 6).
- Unlocks and personal bests are browser-local: per device, reset by clearing site data, not synchronized and not
  anti-cheat.
