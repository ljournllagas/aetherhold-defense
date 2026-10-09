# Fantasy Tower Defense Rebuild Implementation Plan

> **For agentic workers:** Execute task-by-task through the user-selected installed Heavy workflow. Main owns direction/integration/visual acceptance, Executors production/self-check/repair, Testers independent verification. Steps use checkbox syntax.

**Goal:** Rebuild the existing game into a coherent painted fantasy strategy game faithful to the authoritative reference package, preserving correct logic and repairing confirmed defects.

**Architecture:** Preserve centralized configuration, pure gameplay systems, entities and Worker/D1 boundary. Replace procedural world/unit art through existing rendering seams, separate simulation timing and reward decisions from presentation, and rebuild adaptive Phaser UI. Exact route/build coordinates remain deterministic and must match the actual map art.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite, Vitest, Cloudflare Workers/D1, bundled Cinzel/Inter; built-in imagegen for original raster art.

**Spec:** `docs/SPEC.md`, `docs/DESIGN_SYSTEM.md`, `docs/ART_BIBLE.md`, `docs/AI_AGENT_INSTRUCTIONS.md`, `references/VISUAL_REFERENCE_GUIDE.md`, latest pasted user rebuild request. Audit: `docs/REBUILD_AUDIT.md`.

## Global constraints

- Do not modify authoritative requirements or approved references to hide a failure.
- Preserve exact installed Phaser 4.2.1 and existing dependency choices; no React/UI framework or random asset packs.
- Easy 700 gold/25 lives/1.00 score; Medium 600/20/1.50; Hard 500/15/2.00. Screenshot numbers do not override SPEC.
- Five distinct towers, four visual upgrade stages, all five targeting modes, 70% invested-gold refund; eight recognizable enemy roles; boss every ten waves.
- Ten Power-Ups, rarity 55/28/13/4, inventory maximum three, explicit overflow choice, one guaranteed boss reward replacing the fifth-wave roll.
- Desktop UI reference 1280x720: HUD 56, right catalog/inspector 240, command tray 80. Battlefield stays dominant; responsive targets 1440x900,1280x720,1024x768,844x390.
- Use documented tokens/type/spacing/materials. No emoji, default browser controls, debug shapes presented as final art, bright permanent grids, blur/glass, mismatched art, excessive glow/particles.
- Original hand-painted strategy assets, three-quarter perspective, top-left light, muted terrain, distinct value/silhouette/material families; review at 75/100/125% and grayscale.
- API/D1 uses bounded input, prepared statements, unique run IDs and active score version. API failure never prevents local gameplay.
- Preserve unrelated work. No Git mutations: workspace is not a Git repository. No remote deployment until local acceptance and available Cloudflare binding/authorization evidence.
- Do not bypass browser screenshot-export policy. Compare supported inline captures and retain textual evidence; file-backed evidence only through a permitted tool capability.

## Review focus

1. Repeated starts/restarts must not duplicate listeners, timers, projectiles, rewards, or scores; test deliberate dirty-state restart.
2. Full inventory with targeted Meteor and multiple rewards must never exceed three or silently replace/convert; test queued choices and target cancellation.
3. High-wave zero-progress submissions must fail, while legitimate late-wave scores must pass; test lower progress/duration and quadratic score ceiling.
4. Pause/speed changes during projectile flight must affect movement/impact/effect expiration together; test game-time stepping.
5. API failure must be distinguishable from empty data, and narrow landscape controls remain readable/tappable; runtime error-state and four-viewport checks.

## Package ownership and order

Tasks 0 and 1 may run concurrently, with disjoint mutable ownership. Complete before-state inspection after Task 0 before Task 2 changes art. Task 2 precedes Task 3 integration; Task 4 starts only after main battlefield gate. Task 5 verifies all integrated work. Never launch overlapping file owners. Main supplies every visual worker relevant approved PNGs and full text requirements; no independent reinterpretation.

### Task 0: Reproducible QA foundation and remaining before states (P0)

**Files:** Executor owns `src/main.ts` QA initialization only, new `src/game/qa.ts`, `tests/qa.test.ts`, and `GameScene.ts` init/shutdown stale-reference repair only. Ownership transfers to Task3 after verification. No visual/art/layout changes. Tester owns `artifacts/rebuild/baseline/` evidence.

**Interfaces:** Consumes eight existing scene keys and GameScene public lifecycle; produces development-only query-state entry with supported user-visible controls. A production build must not expose fixtures or cheat controls.

```ts
export type QAState = 'menu' | 'difficulty' | 'normal' | 'heavy' | 'placement' | 'selected' | 'reward' | 'boss' | 'gameover' | 'leaderboard';
// main bootstrap gates any dynamic QA import on import.meta.env.DEV.
// qa.ts must drive existing scene actions/simulation, not replace gameplay with a static screenshot.
```

- [ ] Inspect scene lifecycles and the intermittent startup Text/Frame error. Main hypothesis: init leaves old HUD/start-control references while drawHUD calls updateHUD before new tray controls are built, so repeated scene start may call setText on destroyed objects. Reset all transient render references and explicitly release listeners on shutdown, then exercise repeated run creation. Fix only reproduced foundation defects in owned files; report any additional ownership needed.
- [ ] Implement `?qa=<state>` entry, explicit fixture label/QA controls limited to development, deterministic state seeding through existing logic. Leaderboard fixtures are confined to QA and visibly identified; include empty and API-failure variants.
- [ ] Self-check `rtk npm run typecheck`, `rtk npm test`, `rtk npm run build`; inspect production output to confirm the QA path cannot execute there.
- [ ] Independent baseline Tester captures/inspects all ten before states via supported browser capabilities at 1440x900. It compares each corresponding approved PNG, reports unreachable states honestly and preserves export-policy limitation. Main records resulting before evidence before any visual changes.

### Task 1: Shared configuration, deterministic repairs and Worker/D1 (P0/P1)

**Files:** Executor owns `src/shared/types.ts`, `src/shared/validation.ts`, `src/api/leaderboardClient.ts`, `src/game/config/`, `src/game/systems/` existing pure logic, new `src/game/systems/ProjectileSystem.ts` and `RewardSystem.ts`, `worker/index.ts`, `migrations/0003_score_constraints.sql`, `tests/game.test.ts`, `tests/worker.test.ts`, and `tests/rebuild-logic.test.ts`. Does not modify scenes, main, art, entities, CSS, `tests/qa.test.ts`, or QA harness. Changes to API result contracts are reported before scene integration.

**Interfaces:** Preserve `getDifficulty`, `pickTarget`, `towerSellValue`, `buildWave`, `calculateScore`. Tower configuration adds explicit asset/audio/projectile-speed fields. API result becomes discriminated success/error rather than `[]` on failure. New helpers expose pure state stepping and capacity decisions for scene integration.

```ts
export type LeaderboardResult<T> = { ok: true; scores: T[] } | { ok: false; message: string };
export interface TimedProjectile { elapsedMs: number; durationMs: number; }
export function stepProjectile(p: TimedProjectile, gameDeltaMs: number): boolean; // true on arrival
export interface SpawnEvent { enemyId: EnemyArchetype; atMs: number; hpBonus: number; }
export function scheduleWave(groups: WaveEnemyGroup[], startMs: number): SpawnEvent[];
// delayBefore is a wave-relative offset; groups may deliberately overlap.
// scheduleWave and SpawnEvent exported from systems/WaveSystem.ts;
// TimedProjectile/stepProjectile exported from systems/ProjectileSystem.ts.
```

- [ ] Pin regressions: zero-progress wave500 rejected; valid early zero-kill loss allowed; legitimate late-wave payload within centralized score envelope allowed; duplicate run rejected; score versions isolated; missing/oversized/malformed payloads bounded.
- [ ] Enforce conservative wave progress/duration/boss limits from configured wave/scoring/difficulty data. The plausibility envelope must include actual scoring growth, Power-Up bonus targets and boss summons; this is plausibility, not a claim of authoritative anti-cheat. Bound Worker request bytes before unbounded decode, retain prepared queries and safe errors.
- [ ] Preserve populated, empty, and failed leaderboard responses as distinct results. Keep old scene consumers type-correct via a temporary clearly named compatibility function if integration is not yet ready; do not leave a silent-error compatibility path at closure.
- [ ] Add non-destructive migration enforcing unique non-null run IDs and score-era indexes. Preserve existing rows/backfill. Run local D1 migrations and actual local endpoint tests through Wrangler; report remote binding limitations separately.
- [ ] Centralize required tower asset/audio/projectile values and enemy role names. Add pure wave-relative scheduling and game-time projectile/reward decision helpers where needed, reusing existing modules. Tests must pin inventory capacity and targeted pending reward rather than mirroring UI drawing.
- [ ] Self-check typecheck/tests/build and local Worker/D1. Independent Tester verifies security/API/migration results after integration; do not claim remote deployment from mocks.

### Task 2: Painted Ancient Border Keep and coordinated production art (P1)

**Files:** Executor owns `public/assets/`, `src/game/art/`, `src/game/maps/map1.ts`, `src/game/scenes/BootScene.ts`, `PreloadScene.ts`, and asset manifest/prompts under `artifacts/rebuild/art/`. No GameScene, non-game scenes, main/CSS, shared types/config/API/tests changes.

**Interfaces:** Preserve rendering seams and their container contracts:

```ts
buildTowerVisual(scene: Phaser.Scene, towerId: string, level: number): TowerView;
buildEnemyVisual(scene: Phaser.Scene, archetype: EnemyArchetype): EnemyView;
paintBattlefield(scene: Phaser.Scene): BattlefieldArt;
refreshStronghold(stronghold: StrongholdArt, livesFrac: number): void;
// TowerView retains view/crown; EnemyView retains view/body/bobAmp/bobFreq/rockAmp.
// Existing texture keys portrait_<id>, relic_<id>, hud_* remain usable.
```

- [ ] Use built-in imagegen after reading imagegen skill and full Art Bible. Begin with map and a coordinated tower pilot. Prompts explicitly require original stylized painted fantasy strategy, three-quarter downward camera, top-left light, muted forest/stone/bronze, transparent cutouts where required, no text/UI/debug marks, no franchise motifs.
- [ ] Generate a gameplay map with winding weathered stone road, forest clearings, mossy defensive ruins, subdued water/cliff detail, stronghold destination and controlled density. Match reference03 composition. If using a full raster road, derive exact deterministic waypoints/build zones from the actual accepted output; never place enemies on a visibly different route. Main approves any material geometry change.
- [ ] Generate coordinated sprites/atlases covering all five tower families at four stages; basic/runner/brute/armored/resistant/regenerator/swarm/boss and bonus target; ten relics and consistent HUD icons; original menu vista/emblem. A sheet is acceptable only if frame isolation/alignment and small-scale readability are verified. No asset substitution with geometric placeholders as final.
- [ ] Persist selected assets into workspace, record original/generator/source/date/prompt/version metadata and exact manifest. Production textures load through Phaser loader with true progress, replacing the fake tick-loading bar. Defer only nonessential art if useful.
- [ ] Inspect 75/100/125% gameplay-size and grayscale sheets; inspect every upgrade silhouette and enemy role. Integrate through existing art seams with y-based depth/light/contact shadows, animated focal elements, stronghold healthy/damaged/critical treatments and short effects.
- [ ] Self-check actual rendered normal/heavy map, typecheck/tests/build, load errors and asset-size budget. Independent visual Tester compares map/art against Art Bible/DS and references03/04/05/06/08 at actual pixels. Repair/recheck ordinary defects with the same Tester. Main owns acceptance; any unavailable production art gets an exact missing-asset manifest and FAIL/UNVERIFIED gates.

### Task 3: Adaptive gameplay shell and scene-level functional fixes (P0/P1/P2)

**Owner:** The deployment's one Senior Executor. This package combines responsive world/viewport mapping, game-time impact/state sequencing, queued targeted rewards, restart lifetime, and an existing 1,459-line simulation/render scene; these interacting contracts justify the exceptional role. It is not a whole-project rewrite.

**Files:** Executor owns `src/main.ts` responsive bootstrap after Task0, `src/style.css`, `src/game/ui/` including new `layout.ts` and reusable `components.ts`, `src/game/scenes/GameScene.ts`, new `src/game/systems/RunSimulation.ts` if needed for a cohesive plain-TypeScript run model, entity type-import/lifetime seams, `src/game/qa.ts`/`tests/qa.test.ts` QA telemetry compatibility, `tests/game-scene.test.ts` and `tests/run-simulation.test.ts`. Does not change Task1 or Task2 files without revised ownership. Report any additional exact filenames/contract before expanding ownership.

**Interfaces:** Consume Task1 result/config/helper contracts and Task2 art/render seams. Simulation stays in deterministic map coordinates; UI uses actual viewport dimensions. Coordinate conversion must match pointer placement, range circles and Meteor targeting at every viewport.

Keep a pure run model focused on simulation/state transactions, reusing existing wave/combat/economy/rarity/scoring/projectile/reward helpers; presentation owns Phaser objects and local VFX. Preserve scene keys/data and entity behavior. A plain event/result interface is sufficient; do not introduce an event-bus framework or speculative plugin abstraction. Keep QA state seeding DEV-only and QA actions faithful to actual production commands; telemetry must expose projectiles/pending rewards/effects/lifecycle so final tests can dirty and reset them, rather than resetting differently inside the harness.

```ts
export interface GameLayout { hud: number; tray: number; inspector: number; compact: boolean; field: { x: number; y: number; width: number; height: number }; }
export function gameLayout(width: number, height: number): GameLayout;
// Desktop defaults: HUD56/tray80/inspector240; compact controls >=44px, text >=12px.
```

- [ ] Reconstruct battlefield-dominant layout, top HUD label/value/icon metrics, right tower catalog/selected inspector, bottom Start Wave/three Power-Up slots/context tray. Reuse centralized tokens/components. Normal reference03 is primary; reference04 upper density. Remove permanent bright plot marks.
- [ ] Rebuild tower placement with actual semi-transparent tower ghost, minimal range fill, valid/invalid base, non-color reason and cost; reject route/outside/occupied/insufficient-gold placement. Selected gold ring and compact inspector show all required stats/five targeting choices/upgrade deltas/refund; correct clipping and actual selection/card states.
- [ ] Integrate single reward multiplier at kill boundary, capacity-safe queued rewards, boss reveal after safe transition, targeted Power-Up choice/cancel handling, wave-relative scheduling, consistent HUD/final scoring policy and configurable shot data. Exactly one boss guaranteed reward, no silent conversion and no fourth stored item.
- [ ] Move projectiles/status/VFX gameplay timing onto game-time stepping; pause/speed affects represented travel and damage arrival. Cap effects and clear projectiles on Game Over/restart. Explicitly remove input/keyboard/resize listeners, timers/tweens/subscriptions on shutdown.
- [ ] Adapt desktop/tablet/landscape controls using resized viewport and field coordinate mapping. At narrow/short landscape, catalog/inspector becomes contextual drawer/overlay; HUD and touch controls remain readable, not scaled desktop. Portrait rotation guidance remains. Preserve field visibility and entity role readability.
- [ ] Keep pause panel compact with Resume/Settings/Restart/Quit, volume access, no leaderboard. Boss banner 1–1.5 seconds, dedicated health/name/status bar; reward panel rarity/art/name/effect/Use/Store with safe pacing; no particle soup.
- [ ] Self-check actual interaction flows and all four viewports. Example regression acceptance:

```ts
expect(gameLayout(1280, 720).inspector).toBe(240);
expect(gameLayout(844, 390).compact).toBe(true);
// Runtime check: pending targeted reward does not increase stored inventory beyond3.
// Runtime check: paused projectile position/hp/effect deadlines remain unchanged.
// Runtime check: dirty-state restart has0 towers/enemies/projectiles/rewards and initial gold/lives/wave/pause.
```

- [ ] Independent Tester compares references03–08 plus pause and invalid placement; verifies functional flows, restart/listener leaks and all responsive targets. Focused defects return to this Executor then same Tester; main rejects visually inconsistent output even if functional.

### Task 4: Non-gameplay continuity, scoreboard and audio (P1/P2)

**Files:** Executor owns `MainMenuScene.ts`, `DifficultyScene.ts`, `SettingsScene.ts`, `GameOverScene.ts`, `LeaderboardScene.ts`; after Task1 releases ownership, `Settings.ts` and `SoundManager.ts` for audio; `tests/screens.test.ts` and `tests/audio.test.ts`. Shared UI/art edits only through owning Executor or revised ownership.

**Interfaces:** Consume Task2 vista/emblem/icons, Task3 shared UI, Task1 distinct API errors; preserve existing scene keys/data payloads/local setting compatibility.

- [ ] Main menu follows reference01 scenic keep/title/emblem/Play/Leaderboard/Settings, compact fantasy material buttons, no marketing cards. Player name and three difficulty cards follow reference02 but exact SPEC values; styled accessible input/focus and selected indicator, no browser-default controls.
- [ ] Game Over follows reference09, retaining defeated battlefield/stronghold continuity (actual map and last tower positions with damaged keep), final score prominent, compact required stats/personal best, submission state and <=2-action replay. Reset the persistent scene submitted flag for every run and guard async updates by run/generation; two real losses must submit two distinct IDs. Extra visual backdrop metadata must never enter the score POST payload. No unrelated cinematic. Leaderboard follows reference10 compact scoreboard with20 rows/scroll, Overall/Easy/Medium/Hard, wave-score-earliest order, active era and current-run highlight. Empty/error/loading/populated views distinct; Retry for fetch failure, local play available.
- [ ] Add master audio control alongside music/SFX, safe initialization/storage failures, original/licensed audio including impact. Tie sounds to actual impact/build/upgrade/sell/Power-Up/boss/stronghold/GameOver timing. Honor reduced motion for nonessential UI.
- [ ] Verify player flow, settings persistence, actual offline errors, submission result, replay and keyboard focus/touch controls at four viewports; no stale asynchronous response updates after scene shutdown.
- [ ] Self-check typecheck/tests/build/runtime. Independent Tester compares references01/02/09/10 and all relevant states/viewport/audio gates, repairs through owner and rechecks before acceptance.

### Task 5: Full regression, compliance audit, deployment evidence and closure (P0 release gate)

**Files:** Independent Tester owns final verification assets/tests/reports under `artifacts/rebuild/final/`; Executor performs any authorized operations/repairs in its owned files. Main owns final audit and deployment-state docs; Archivist owns other verified documentation and required closure reporting.

- [ ] Fresh typecheck, Vitest, build, lint if added; launch built output. Verify start/setup/difficulty/build(valid,invalid,gold)/movement/targeting/combat/upgrade/sell/modes/waves/archetypes/boss/Power-Up acquire-store-use-overflow/pause/speed/lives/GameOver/scoring/submission/leaderboard/API failure/restart.
- [ ] Dirty-state restart gate: enemies/towers/projectiles/timers/listeners/tweens/effects/boss/score/wave/gold/lives/pause/speed/transientUI all reset; persistent preferences may remain. Repeated runs must not duplicate callbacks. Check startup error recurrence, frame-rate independence, heavy-wave readability and allocation/effect budgets. Record actual FPS during representative heavy combat against the 60 FPS desktop target, with browser/hardware/measurement limitations.
- [ ] Render independently compare all ten reference screens and four viewport targets. Record actual screenshot inspection evidence and policy-limited export status separately. QA-seeded stress states identified; do not mistake fixtures for online/backend success.
- [ ] Verify local Cloudflare Worker/D1 migrations and real HTTP endpoints, bound statements, duplicate IDs, versions, filtering/order, validation and failure isolation. Remote deployment only if configured binding/auth and release gates permit; otherwise record exact external limitation without exposing secrets.
- [ ] Revisit F01–F19 and all coverage areas fresh, assigning final PASS/PARTIAL/FAIL/MISSING/UNVERIFIED plus severity. No completion with unresolved CRITICAL; no visual completion without all primary rendered comparisons.
- [ ] Main updates progress/diary/latest handoff; required closure Archivist receives deploymentID fantasy-rebuild-20261007, verified facts, read-only Git handoff and canonical docs. Final report uses user's REBUILD SUMMARY/VALIDATION/REFERENCE SCREEN QA/remaining severity counts/real limitations, plus exact closure six-column token table.
