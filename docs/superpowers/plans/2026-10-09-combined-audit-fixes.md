# Combined Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the eleven approved audit fixes in one production release with score era 3 and retained legacy progress.

**Architecture:** Retain the existing Phaser scenes and game systems. Add a fixed-step clock, a shared player-name policy, an asset-stage manifest and a saved-submission repository; reuse ScrollSheet for saved-score UI. Correct timing before tuning balance, then verify the complete client/Worker flow before publishing.

**Tech Stack:** TypeScript, pinned Phaser 4.2.1, Vite, Vitest, existing Cloudflare Worker/D1, native rate-limit binding, localStorage and Web Locks. Existing bundled Playwright verifies browser behavior; no new package dependency.

**Spec:** `docs/superpowers/specs/2026-10-09-combined-audit-fixes-design.md` (approved 2026-10-09; cold review 9/10, no blockers).

**Status:** executed, verified and published on 2026-10-09 — Worker version `ca0a8b8b-6e75-4d01-b380-95f4baf9855c`, bundle `/assets/index-U_hsPps9.js`, GAME_VERSION `0.3.0` / SCORE_VERSION `3`. All twelve tasks are complete and every step checkbox below is ticked; see the execution record at the end of this file and `agent_docs/audit_fixes_2026-10-09.md`.
**Cold review:** cleared round 3 on 2026-10-09 at 9/10; 44 of 44 requirements
covered, zero blockers and zero advisory findings. Round 1: 7/10, six blockers;
round 2: 8/10, three blockers; all corrected before the final review. Earlier
requirement totals of 43 were corrected by the reviewer to 44 (38 numbered
requirements plus six release acceptance bullets).
**Recommended execution:** Native/inline; tasks share GameScene and final balance/validation, and the selected workflow route is Light. Skill-required cold reviewers remain independent.

## Global Constraints

- Workflow route remains Light; preserve unrelated work and the current branch. Repository root is `C:/dev/Warcraft 3 Inspired Tower Defense`; run commands there unless stated otherwise.
- Shell commands use `rtk`; use `rtk proxy` for unfiltered tools. PowerShell syntax and native Windows paths apply.
- Publish GAME_VERSION `0.3.0` and SCORE_VERSION `3`; preserve every existing D1 row, run ID and index. No destructive migration or score conversion.
- Preserve `aetherhold-settings-v1`, `aetherhold-unlocks-v1`, `aetherhold-best-score-v2` and `aetherhold-best-v1`; use `aetherhold-best-score-v3` for new bests and `aetherhold-score-retry-v1` for one latest saved submission.
- Fixed ticks are `1000 / 60` game milliseconds, at most 60 ticks per visible frame; retain fractional remainder and excess time. Auto remains once per visible update and counts five eligible real seconds.
- Keep existing validation, UUID duplicate handling, branch commitment, unlock snapshots, actual-investment refunds, once-only rewards, pause and victory/endless contracts.
- Medium acceptance: evolution during waves 11-13; rank 2 before wave 20; forced wait at most three completed waves; 2-5 rank-3 towers at victory; ordinary-income nine-plot completion unavailable before wave 25; 1200-1800 simulated 1x seconds with 10-second preparation.
- Menu/gameplay/defeat image stages contain 6/15/1 current source images. Original paths, dimensions and sheet framing remain intact.
- Native limiter is 10 score POST attempts per 60 seconds, with a dedicated namespace and trusted IP/anonymous key. Native counters are per-location and eventually consistent.
- No automatic score submission/retry, account sync, new content, framework/dependency upgrade or branch-parity retuning. Physical hardware and human balance are not inferred from scripts.
- One combined application publication after all tasks pass; intermediate commits are checkpoints, not partial deployments. `npm run deploy` must run tests/build before publishing; commit/push the verified release and verify remote HEAD.

## Review Focus

1. A large frame ends the run midway through catch-up: no later tick, attack, reward or Auto action may run (Task 3).
2. A canceled load/font callback finishes after a different request: it must never change the active scene (Task 4).
3. A decomposed/supplementary name is edited during IME composition: no intermediate truncation or split surrogate (Task 1, browser checks Task 11).
4. An old tab's accepted POST finishes after another tab saves a new run: settlement must retain the new run (Task 8).
5. A POST is accepted but its response times out: reload/manual retry must receive duplicate handling and clear only that saved run (Tasks 9 and 11).

## Files and responsibilities

| Unit | Create | Existing callers/config/tests to change |
|---|---|---|
| Name policy/settings | `src/shared/playerName.ts`, `tests/player-name.test.ts`, `tests/settings.test.ts` | Settings, validation, DifficultyScene, GameScene, audio/settings/score tests |
| Fixed simulation | `src/game/systems/SimulationClock.ts`, `tests/simulation-clock.test.ts`, `tests/scene-timing.test.ts` | GameScene, simulationBot and existing combat/Auto/QA tests |
| Asset stages | `src/game/art/assetManifest.ts`, `tests/assets.test.ts`, `tests/preload.test.ts` | Preload, Boot, Difficulty, GameOver, GameScene, artkit, QA, scene fixtures |
| Balance | `tests/balance-acceptance.test.ts`, `artifacts/audit-fixes/balance/candidates.test.ts` | simulationBot/progressionTrace, typed coefficients, existing price/mastery tests, report runner |
| Era/personal best | no new product module | shared/version, Settings, Progression/Menu/results, package metadata, validation/client/Worker fixtures |
| Worker protection | `public/_headers`, `tests/static-headers.test.ts` | worker/index, wrangler.toml, all Env test fixtures |
| Saved submission | `src/game/systems/ScoreRetry.ts`, `tests/score-retry.test.ts`, `tests/score-submission.test.ts` | leaderboardClient result type, GameOver, MainMenu, Leaderboard, screens fixtures |
| Release evidence | `artifacts/audit-fixes/browser.cjs`, `artifacts/audit-fixes/api.cjs`, `artifacts/audit-fixes/live.cjs`, `agent_docs/audit_fixes_2026-10-09.md` | SPEC, latest_session_work, approved spec/plan completion record |

Existing implementations referenced below are read before editing. Tests can stub
presentation only; do not mock the clock, purchase rules, combat, validation or DB
handler in tests claiming those behaviors. Product edits begin only after the user
reviews this plan and selects execution. Use focused RED/GREEN cycles, then one
complete regression gate; do not deploy a partly completed task.

### Task 1: Share the name policy and validate settings

**Files:** Create `src/shared/playerName.ts`, `tests/player-name.test.ts`, `tests/settings.test.ts`; modify `src/shared/validation.ts`, `src/game/systems/Settings.ts`, `src/game/scenes/DifficultyScene.ts`, `src/game/scenes/GameScene.ts`, `tests/audio.test.ts`, `tests/game.test.ts`.

**Interfaces:** Consumes current Settings and GameResultPayload. Produces:

```ts
export const PLAYER_NAME_MAX = 20;
export function editPlayerName(value: unknown): string;
export function runPlayerName(value: unknown): string;
export function validatePlayerName(value: unknown): { ok: boolean; name: string; error?: string };
export function normalizeSettings(value: unknown): Settings; // exported from Settings.ts
```

- [x] **Step 1: Add pure regression cases and malformed-settings coverage.** Use these imports in the new files and the current localStorage Map approach from audio.test.ts:

```ts
import { afterEach, expect, it, vi } from 'vitest';
import { editPlayerName, runPlayerName, validatePlayerName } from '../src/shared/playerName.ts';
import { loadSettings, normalizeSettings } from '../src/game/systems/Settings.ts';
afterEach(() => vi.unstubAllGlobals());
it('preserves NFC names and truncates only at code-point boundaries', () => {
  expect(editPlayerName('Jose\u0301 A.')).toBe('Jos\u00e9 A.');
  expect(editPlayerName('a'.repeat(19) + '\u{10400}' + 'b')).toBe('a'.repeat(19));
  expect(runPlayerName('  Jose\u0301   A.  ')).toBe('Jos\u00e9 A.');
  expect(validatePlayerName('<script>')).toMatchObject({ ok: false });
  expect(validatePlayerName('a'.repeat(21))).toMatchObject({ ok: false });
  expect(runPlayerName(42)).toBe('Warden');
});
it.each([null, [], 42, 'bad'])('defaults non-object settings: %j', value => {
  expect(normalizeSettings(value)).toMatchObject({ gameSpeed: 1, difficulty: 'medium', playerName: '' });
});
it('defaults invalid fields independently and retains valid values', () => {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ playerName: 42, difficulty: 'unknown', musicOn: 'false', gameSpeed: 9, sfxVolume: .4 }) });
  expect(loadSettings()).toMatchObject({ playerName: '', difficulty: 'medium', musicOn: true, gameSpeed: 1, sfxVolume: .4 });
});
```

The remaining settings/name test bodies are in Appendix A. These snippets go into
their named test files; do not place duplicate imports in one file.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/player-name.test.ts tests/settings.test.ts tests/game.test.ts tests/audio.test.ts`; expect absent exports or the reproduced malformed-setting/name behavior.
- [x] **Step 3: Implement pure name normalization and settings selection.** Keep only recognized fields. The name core is:

```ts
const NAME_ALLOWED = /^[\p{L}\p{N} _\-'.]+$/u;
export function editPlayerName(value: unknown): string {
  const clean = typeof value === 'string' ? value.normalize('NFC').replace(/[^\p{L}\p{N} _\-'.]/gu, '') : '';
  let out = '';
  for (const char of clean) {
    if (out.length + char.length > PLAYER_NAME_MAX) break;
    out += char;
  }
  return out;
}
export function runPlayerName(value: unknown): string {
  return editPlayerName(value).trim().replace(/ +/g, ' ') || 'Warden';
}
export function validatePlayerName(value: unknown): { ok: boolean; name: string; error?: string } {
  const name = typeof value === 'string' ? value.normalize('NFC').trim().replace(/ +/g, ' ') : '';
  if (!name) return { ok: false, name, error: 'playerName is required' };
  if (name.length > PLAYER_NAME_MAX) return { ok: false, name, error: 'playerName too long' };
  if (!NAME_ALLOWED.test(name)) return { ok: false, name, error: 'playerName contains invalid characters' };
  return { ok: true, name };
}
```

In `normalizeSettings`, guard `typeof value === 'object' && value !== null && !Array.isArray(value)`; build the returned Settings field-by-field from DEFAULTS, clampVolume, typeof-boolean checks, enum checks and editPlayerName. Both loadSettings and saveSettings call this function. validation.ts uses validatePlayerName's error/name instead of its private regex/truncation block; keep all other rejection logic.

- [x] **Step 4: Wire both inputs and the run boundary.** In each DifficultyScene input setup:

```ts
let composing = false;
const commitName = () => {
  if (composing) return;
  input.value = editPlayerName(input.value);
  this.playerName = input.value;
  saveSettings({ ...loadSettings(), playerName: input.value });
};
input.addEventListener('compositionstart', () => { composing = true; });
input.addEventListener('compositionend', () => { composing = false; commitName(); });
input.addEventListener('input', commitName);
```

Use the existing desktop variable name `nameInput` where appropriate. Guard Enter
with `!event.isComposing`; keep existing Escape/blur behavior. beginSiege uses
runPlayerName. GameScene.init normalizes the chosen difficulty through getDifficulty
and assigns its returned `.id`, and uses runPlayerName on data/saved name; keep the
existing speed/default and complete transient reset.

- [x] **Step 5: Run GREEN and commit.** Re-run Step 2 plus `rtk npm run typecheck`; verify all existing score rejection and audio cases remain asserted. Stage only Task 1 files; commit `Fix saved settings and share Unicode player names`.

### Task 2: Add the bounded fixed-step clock

**Files:** Create `src/game/systems/SimulationClock.ts`, `tests/simulation-clock.test.ts`.
**Interfaces:** Consumes game milliseconds already scaled by speed. Produces `SIMULATION_STEP_MS`, `MAX_SIMULATION_STEPS`, and `SimulationClock` with readonly `pendingMs`, `advance(gameDeltaMs: number, step: (stepMs: number) => boolean): number`, `reset(): void`. Return value is the number of ticks consumed; false from step stops immediately. Zero/invalid additions can still drain existing active debt; the scene does not call advance while blocked.

- [x] **Step 1: Add clock assertions.**

```ts
import { expect, it, vi } from 'vitest';
import { SimulationClock, SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
it('retains overflow and stops at a terminal tick', () => {
  const clock = new SimulationClock(), step = vi.fn(() => true);
  expect(clock.advance(2500, step)).toBe(60);
  expect(clock.pendingMs).toBeCloseTo(1500);
  expect(clock.advance(0, step)).toBe(60);
  expect(clock.advance(0, step)).toBe(30);
  expect(step).toHaveBeenCalledTimes(150);
  clock.reset();
  expect(clock.advance(100, () => false)).toBe(1);
  expect(clock.pendingMs).toBeCloseTo(100 - SIMULATION_STEP_MS);
});
it.each([-1, NaN, Infinity])('does not add invalid delta %s', value => {
  const clock = new SimulationClock(); clock.advance(5, () => true);
  expect(clock.advance(value, () => true)).toBe(0);
  expect(clock.pendingMs).toBe(5);
});
```

Also partition 1000 milliseconds into 60, 30, 10 and irregular frames; assert 60
ticks and equal remainder. Test reset invoked inside step without another callback.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/simulation-clock.test.ts`; expected missing module.
- [x] **Step 3: Implement the clock.**

```ts
export const SIMULATION_STEP_MS = 1000 / 60;
export const MAX_SIMULATION_STEPS = 60;
export class SimulationClock {
  private debt = 0;
  get pendingMs(): number { return this.debt; }
  reset(): void { this.debt = 0; }
  advance(gameDeltaMs: number, step: (stepMs: number) => boolean): number {
    if (Number.isFinite(gameDeltaMs) && gameDeltaMs > 0) this.debt += gameDeltaMs;
    let consumed = 0;
    while (this.debt + 1e-7 >= SIMULATION_STEP_MS && consumed < MAX_SIMULATION_STEPS) {
      this.debt = Math.max(0, this.debt - SIMULATION_STEP_MS);
      consumed++;
      if (!step(SIMULATION_STEP_MS)) break;
    }
    return consumed;
  }
}
```

The epsilon only reconciles floating-point boundary noise; it must not discard
substantial debt or grant an extra tick in the partition tests.

- [x] **Step 4: Run GREEN and commit.** Step 2 plus typecheck. Commit the two files as `Add bounded fixed-step simulation clock`.

### Task 3: Integrate logical ticks while retaining the visible-frame contract

**Files:** Modify `src/game/scenes/GameScene.ts`, `tests/helpers/autoScene.ts`, `tests/helpers/simulationBot.ts`, existing combat/Auto/siege/QA tests; create `tests/scene-timing.test.ts`.
**Interfaces:** Consumes SimulationClock from Task 2. Produces private `simulateTick(stepMs: number): boolean`, `moveEnemies(stepMs: number): void`, `renderFrame(processedGameMs: number): void`, and a per-run `simulationClock`. Preserve existing public update and private updateFlights/fireTowers signatures because tests exercise them directly.

- [x] **Step 1: Add the actual-scene cadence regression.** Reuse autoScene (which mocks presentation, not combat), with this complete fixture:

```ts
import { afterEach, expect, it, vi } from 'vitest';
import { autoScene } from './helpers/autoScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
afterEach(() => vi.restoreAllMocks());
function attackCount(fps: number, speed: number): number {
  const { run, loose } = autoScene();
  const tower = new Tower('longbow', 300, 300, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: 'volley', rank: 3 };
  run.towers = [tower]; run.battleCryUntil = Infinity; loose.speed = speed;
  run.enemies = [1, 2, 3].map(() => { const e = new Enemy('thornling', 1e9, 0, 8); e.x = 300; e.y = 300; return e; });
  const fire = vi.fn(); loose.fireProjectile = fire;
  for (let i = 0; i < fps * 10; i++) run.update(i * 1000 / fps, 1000 / fps);
  for (let i = 0; i < 5; i++) run.update(10000, 0);
  return fire.mock.calls.length;
}
it.each([1, 2, 3])('keeps attack count across FPS at speed %i', speed => {
  expect(attackCount(10, speed)).toBe(attackCount(60, speed));
  expect(attackCount(30, speed)).toBe(attackCount(60, speed));
});
```

Appendix B supplies the seeded real-projectile attack/kill/reward partition matrix
and the modal-boundary regression; the count-only fixture above diagnoses the
original Volley bug but is not the equivalence acceptance test. Add assertions for clocks paused with debt, speed changes affecting only future
delta, no-target intervals not becoming a burst, freeze/stun expiry, regen and
summons across irregular partitions, and one death/clear reward. For terminal
catch-up spy on simulateTick; arrange a real last-life enemy at the route end;
call update with 2500 ms and assert one result scene start, no later tick/Auto
transaction and a reset clock. Keep existing chain/field snapshot tests unchanged.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/scene-timing.test.ts tests/scene-combat.test.ts tests/scene-auto.test.ts tests/scene-siege.test.ts tests/qa.test.ts`; expected differing attack counts, not mock-method errors.
- [x] **Step 3: Extract only the simulation work from update.** Keep spawn/kill/leak rules in the scene. Move enemy regeneration, waypoint movement/heading and summons into moveEnemies; move their sprite/bar/ring/bob/shadow updates into renderFrame. Preserve the movement loop's guard and life-loss precedence. Each summon boundary compares the prior tick time (`gameTimeMs - stepMs`) with the new time. The tick body is:

```ts
private simulationClock = new SimulationClock();
private inSimulationTick = false;
private simulateTick(stepMs: number): boolean {
  if (this.isRunBlocked()) return false;
  this.inSimulationTick = true;
  try {
  this.gameTimeMs += stepMs;
  while (this.spawnQueue.length && this.spawnQueue[0].atMs <= this.gameTimeMs) {
    const spawn = this.spawnQueue.shift()!;
    const enemy = this.spawnEnemy(spawn.enemyId, spawn.hpBonus);
    if (enemy.isBoss && [10, 20, 30].includes(this.wave)) this.scheduledBossIds.set(enemy.id, this.wave);
  }
  this.moveEnemies(stepMs);
  if (this.isRunBlocked()) return false;
  this.enemies = this.enemies.filter(e => e.alive);
  this.updateFlights(stepMs);
  this.processFieldTicks();
  this.enemies = this.enemies.filter(e => e.alive);
  this.fireTowers(stepMs / 1000);
  this.checkWaveClear();
  } finally { this.inSimulationTick = false; }
  this.presentReward();
  return !this.isRunBlocked();
}
```

Add `if (this.inSimulationTick) return;` as the first guard of presentReward.
Thus kill/grant callbacks enqueue rewards without opening a dialog inside impact,
field or attack batches; the complete current tick commits, then presentReward
opens any required dialog and the false return stops catch-up before the next tick.
This preserves all due impacts rather than deleting an arrived batch part-way.
Terminal/victory guards remain authoritative: movement stops on terminal, and
checkWaveClear is the last simulation action. Manual reward calls outside a tick
retain immediate presentation. Reset inSimulationTick in init/cleanup. This flag
only defers reward presentation; it never suppresses reward creation or resolution.
Keep fireTowers' no-target cooldown reset and existing shot creation. A fixed tick
is shorter than every legal configured attack interval; assert this contract in
the timing test, including Battle Cry. Do not remove error/validation branches.
updateFlights retains target tracking and arrival/impact/chain resolution, while
its still-flying view position/rotation loop moves into renderFrame. Move crown
recoil and field-view synchronization there too. Heading is simulation state;
render facing uses its sine/cosine and current effective movement status.

- [x] **Step 4: Wire visible update and resets.** Retain Auto's timestamp validation and pre-update waiting snapshot. The unblocked core becomes:

```ts
const validDelta = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
this.runningDurationMs += validDelta;
const consumed = this.simulationClock.advance(validDelta * this.speed, step => this.simulateTick(step));
if (this.ended || this.siege.phase === 'terminal') return;
this.renderFrame(consumed * SIMULATION_STEP_MS);
this.tickAuto(autoDeltaMs, frameWasWaiting);
this.refreshAutoDisplay();
this.presentReward();
```

Blocked updates never call clock.advance; Auto only observes blocked state there.
renderFrame calls the existing boss/death/effect/notice/view work once and moves
floaters by processed game time; it does not advance combat. It may render the
victory state, but tickAuto's existing phase guard cannot act there. Use finite
unscaled delta for achievement notices; reset the clock in init and cleanup.
Stop movement immediately after handleLeak ends the run. Publish QA once per
visible frame at its existing game-time interval, not once per tick.

- [x] **Step 5: Update simulation presentation stubs and run GREEN.** Stub the new renderFrame in simulationBot; do not stub simulateTick/moveEnemies/clock. Its existing 50-ms unscaled updates now consume three ticks. Add the clock accessor to AutoRun only for tests using it. Preserve the existing real-time Auto timestamp tests and current reward policies. Run Step 2 plus `rtk npm test` and typecheck; commit only Task 3 files as `Make combat advance independently of rendered frames`.

### Task 4: Stage current images and make all loading gates recoverable

**Files:** Create `src/game/art/assetManifest.ts`, `tests/assets.test.ts`, `tests/preload.test.ts`; modify PreloadScene, BootScene, DifficultyScene, GameScene, GameOverScene, `src/game/art/artkit.ts`, `src/game/qa.ts`, simulationBot and affected scene/screen/QA fixtures.
**Interfaces:** AssetStage is `'menu' | 'gameplay' | 'defeat'`. Export `AssetSpec`, `STAGE_ASSETS`, `requiredAssets(stage): readonly AssetSpec[]`, `missingAssets(stage, exists: (key: string) => boolean): AssetSpec[]`. Export `GameStartData { difficulty: DifficultyId; playerName: string }`, and `GameOverData` (rename/export the current GameOverScene Data interface). LoadingRequest is:

```ts
export type LoadingRequest =
  | { stage: 'menu'; destination: 'MainMenu'; data?: undefined }
  | { stage: 'gameplay'; destination: 'Game'; data: GameStartData }
  | { stage: 'gameplay' | 'defeat'; destination: 'GameOver'; data: GameOverData };
```

PreloadScene additionally has private `retryLoading(): void`,
`completeLoading(generation: number): void` and `returnToMenu(): void` lifecycle
methods. PreloadScene.init defaults to menu/MainMenu. Consumers route via
`scene.start('Preload', request satisfies LoadingRequest)`. artkit additionally
exports `ensureMenuTextures(scene: Phaser.Scene): void` for the existing procedural
menu wave/score icons; atlas-derived game icons are generated only at gameplay readiness.

- [x] **Step 1: Pin stage membership and cold/warm gates.**

```ts
import { expect, it } from 'vitest';
import { STAGE_ASSETS, missingAssets } from '../src/game/art/assetManifest.ts';
it('assigns all source assets once and keeps cold menu small', () => {
  expect(STAGE_ASSETS.menu).toHaveLength(6);
  expect(STAGE_ASSETS.gameplay).toHaveLength(15);
  expect(STAGE_ASSETS.defeat).toHaveLength(1);
  const all = Object.values(STAGE_ASSETS).flat();
  expect(new Set(all.map(a => a.key)).size).toBe(22);
  expect(STAGE_ASSETS.menu.some(a => a.path.includes('/enemies/'))).toBe(false);
  expect(missingAssets('gameplay', () => true)).toEqual([]);
});
```

For preload.test.ts use vi.mock Phaser Scene as in screens.test.ts, add EventEmitter
load/events, a textures Set and queue array. Stub presentation drawLoading and art
generation; keep actual stage/readiness/lifecycle code. Drive preload/create and
loaderror/complete events: failed enemy atlas never starts Game; setting its loaded
key and native Retry starts Game exactly once with the original name/difficulty.
Test an old font promise resolving after shutdown/reinit, menu Retry without all
keys, cancellation, result data identity on Retry, resize without new loads, warm
cache with zero queue items, and repeated Retry while already loading. The concrete
fixture/test starting point is:

```ts
import { afterEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'eventemitter3';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
vi.mock('../src/game/art/artkit.ts', () => ({ ensureMenuTextures: vi.fn(), ensureArtTextures: vi.fn() }));
vi.mock('../src/game/art/towerArt.ts', () => ({ ensureTowerPortraits: vi.fn() }));
import { PreloadScene } from '../src/game/scenes/PreloadScene.ts';
import { requiredAssets } from '../src/game/art/assetManifest.ts';
afterEach(() => vi.unstubAllGlobals());
function loaderFixture() {
  const scene = new PreloadScene();
  const loose = scene as unknown as Record<string, any>;
  const loaded = new Set<string>(), queued: string[] = [], timers: Array<() => void> = [];
  const load = Object.assign(new EventEmitter(), {
    image: vi.fn((key: string) => { queued.push(key); }),
    spritesheet: vi.fn((key: string) => { queued.push(key); }), start: vi.fn()
  });
  let active = true;
  const start = vi.fn();
  loose.load = load; loose.events = new EventEmitter();
  loose.scale = { width: 390, height: 844, on: vi.fn(), off: vi.fn() };
  loose.textures = { exists: (key: string) => loaded.has(key), get: (key: string) => ({ has: () => loaded.has(key) }) };
  loose.scene = { isActive: () => active, start };
  loose.time = { delayedCall: (_ms: number, callback: () => void) => { timers.push(callback); return { remove: vi.fn() }; } };
  loose.drawLoading = vi.fn();
  vi.stubGlobal('document', { fonts: { ready: Promise.resolve() } });
  return { scene, loose, loaded, queued, load, start, timers, stop: () => { active = false; loose.events.emit('shutdown'); } };
}
it('waits through a failed atlas and retries only missing assets', async () => {
  const f = loaderFixture();
  const data = { difficulty: 'medium' as const, playerName: 'Jos\u00e9' };
  f.scene.init({ stage: 'gameplay', destination: 'Game', data });
  f.scene.preload();
  for (const asset of requiredAssets('gameplay')) if (asset.key !== 'enemy_walk_atlas_nature-v2') f.loaded.add(asset.key);
  f.load.emit('loaderror', { key: 'enemy_walk_atlas_nature-v2' });
  f.scene.create(); await Promise.resolve();
  expect(f.start).not.toHaveBeenCalled();
  f.queued.length = 0; f.loose.retryLoading();
  expect(f.queued).toEqual(['enemy_walk_atlas_nature-v2']);
  f.loaded.add('enemy_walk_atlas_nature-v2'); f.load.emit('complete');
  await Promise.resolve(); await Promise.resolve();
  expect(f.start).toHaveBeenCalledTimes(1);
  expect(f.start).toHaveBeenCalledWith('Game', data);
});
```

Extend this same fixture with a manually resolved fonts.ready promise and an active
setter for reinit: stop the first request, reinit another incomplete request, resolve
the old font promise and invoke its captured timer, and assert no start call. For
result retry, pass a GameOverData fixture and assert exact object identity at start.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/assets.test.ts tests/preload.test.ts tests/qa.test.ts tests/screens.test.ts tests/scene-siege.test.ts`; expected absent stages or failed-load fall-through.
- [x] **Step 3: Move the literal image list into the manifest.** AssetSpec is a discriminated image/sheet record:

```ts
export type AssetSpec = { key: string; path: string } &
  ({ kind: 'image' } | { kind: 'sheet'; frameWidth: number; frameHeight: number });
export const STAGE_ASSETS: Record<AssetStage, readonly AssetSpec[]> = {
  menu: [
    { kind: 'image', key: 'emblem', path: '/assets/branding/aegis-emblem-v1.webp' },
    { kind: 'image', key: 'menu_vista', path: '/assets/world/vistas/ancient-border-keep-vista-v1.webp' },
    { kind: 'image', key: 'menu_vista_sunset', path: '/assets/world/vistas/ancient-border-keep-vista-menu-v2.webp' },
    ...(['easy', 'medium', 'hard'] as const).map(id => ({ kind: 'image' as const, key: `difficulty_helm_${id}`, path: `/assets/ui/difficulty-helm-${id}-v1.webp` }))
  ],
  gameplay: [
    { kind: 'image', key: 'map_ancient_border_keep', path: '/assets/world/maps/ancient-border-keep-map-v2.webp' },
    ...Object.entries({ longbow: 'ranger_stages-v2', ember: 'bombard_stages-v1', glacier: 'frost_stages-v1', starfire: 'arcane_stages-v1', tempest: 'tempest_stages-v1' }).map(([id, name]) => ({ kind: 'sheet' as const, key: TOWERS[id].assetKey, path: `/assets/towers/tower_${name}.webp`, frameWidth: 627, frameHeight: 627 })),
    ...([1, 2, 3] as const).map(rank => ({ kind: 'image' as const, key: `tower_ember_stage_${rank}_v2`, path: `/assets/towers/tower_bombard_stage${rank}-v2.webp` })),
    ...(['nature-v2', 'warden-v1', 'elite-v1'] as const).map(name => ({ kind: 'image' as const, key: `enemy_walk_atlas_${name}`, path: `/assets/enemies/enemy_walk_atlas_${name}.webp` })),
    { kind: 'image', key: 'relic_icons_atlas', path: '/assets/powerups/relic-icons-atlas-v1.webp' },
    { kind: 'image', key: 'hud_icons_atlas', path: '/assets/ui/hud-icons-atlas-v1.webp' },
    { kind: 'image', key: 'stronghold_beacon_atlas', path: '/assets/world/overlays/borderkeep-beacon-states-v1.webp' }
  ],
  defeat: [{ kind: 'image', key: 'map_ancient_border_keep_defeated', path: '/assets/world/maps/ancient-border-keep-defeated-v1.webp' }]
};
export function requiredAssets(stage: AssetStage): readonly AssetSpec[] {
  return stage === 'menu' ? STAGE_ASSETS.menu : stage === 'gameplay'
    ? [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay]
    : [...STAGE_ASSETS.menu, ...STAGE_ASSETS.gameplay, ...STAGE_ASSETS.defeat];
}
export function missingAssets(stage: AssetStage, exists: (key: string) => boolean): AssetSpec[] {
  return requiredAssets(stage).filter(a => !exists(a.key));
}
```

Preserve every key's current source filename. In artkit create only the existing
procedural `hud_wave`/`hud_score` symbols for menu use; mark those generated Texture
objects in a WeakSet. Once hud_icons_atlas exists, remove just those marked fallback
objects before deriving painted HUD icons. Do not pre-generate relic icons or tower
portraits in the menu stage; do not remove already painted textures on menu replay.
Use existing tex/swords/star helpers, not a new icon design or dependency. Test this
promotion and warm-menu retention in assets.test.ts with the fake texture manager.

- [x] **Step 4: Implement the request-owned loading state machine.** Store request,
generation, state (`loading | failed | ready`), current error and destination-started
flag. Queue missingAssets using load.image/load.spritesheet. Bind one owned set of
progress/error/complete listeners; remove it on shutdown and before Retry. On
complete/create, check the full required key set and every sheet's frame 3 before
declaring ready. A failed attempt remains failed even if another callback fires.
Retry cannot run during loading; it increments generation, clears current error,
requeues missing assets and calls load.start. Generation captures wrap every font,
loader and timer completion; transition uses this exact guard:

```ts
if (generation !== this.generation || !this.scene.isActive('Preload') ||
    this.state !== 'ready' || this.destinationStarted) return;
this.destinationStarted = true;
this.scene.start(this.request.destination, this.request.data);
```

Draw 44px Retry and Back to Keep controls with existing house button and measured
wrapping. Initial menu failure uses Retry/Reload; gameplay/results Back targets the
loaded MainMenu. Menu can wait for fonts with a guarded 2500ms timer; image readiness
always gates it. Reuse the existing resize loading root and retain result/request
data. Successful gameplay readiness calls ensureArtTextures/ensureTowerPortraits;
menu readiness calls only ensureMenuTextures.

- [x] **Step 5: Route every current entry point.** Difficulty beginSiege and both
GameOver Play Again controls go through gameplay Preload. GameScene finishRun builds
one `const result: GameOverData` before navigation; use defeat Preload only when its
same-map snapshot has strongholdRatio <= .02, otherwise navigate GameOver directly
with cached gameplay art. In-place Restart/QA restart has already loaded gameplay;
keep its existing cleanup/reset. QA startGameFixture routes through gameplay Preload,
retaining the listener on the eventual Game create. QA gameover goes through gameplay
Preload with its explicit display fixture. simulationBot intercepts a terminal
defeat Preload's destination/data as the result, without running a mocked loader.
Update the screenshot harness to wait for the requested stage rather than all 22
images. The next task changes era constants; use imported constants for new fixtures.

- [x] **Step 6: Run GREEN and commit.** Step 2 plus `rtk npm test`/typecheck. Check cold-menu requests and result-art failure in Task 11's browser suite. Commit only Task 4 files as `Stage game assets and recover failed loading transitions`.

### Task 5: Enforce and tune the corrected balance

**Files:** Create `tests/balance-acceptance.test.ts`, `tests/helpers/balanceRuns.ts`, `artifacts/audit-fixes/balance/candidates.test.ts`; modify `tests/helpers/simulationBot.ts`, `tests/helpers/progressionTrace.ts`, `src/game/config/evolutions.ts` (and only evidence-required existing typed balance config), relevant price/mastery assertions, and the old opt-in report runner.
**Interfaces:** Extend SimulationOptions with `goldRelics?: 'normal' | 'disabled'` (default normal). Extend SimulationTrace with `terminalPayload: GameResultPayload | null`, taken from the actual scene result/Preload request, and `goldRelics: 'normal' | 'disabled'`. Preserve runSimulation signature and strategy/seed behavior. Export `BALANCE_RUNS: readonly SimulationOptions[]` from `tests/helpers/balanceRuns.ts` (new shared test-data file) with eight scenarios: five existing labels/seeds plus three Medium no-gold variants of seeds 1/2/3. This file is test data, not runtime configuration.

- [x] **Step 1: Fix only the evidence plumbing and add failing acceptance.** In
simulationBot prevent goldRushIndex use when disabled; filter bossRelicsToActivate
through `!GOLD_RELICS.has(id)` in that mode. Retain reward rolls, inventory resolution,
buy strategy, no selling, targeting and 10s preparation. Capture actual terminal
data and preserve siege snapshot timing for endless. In progressionTrace separate
Medium gates from Easy/Hard sanity checks without weakening any Medium bound.

```ts
import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
import { BALANCE_RUNS } from './helpers/balanceRuns.ts';
import { runSimulation, GOLD_RELICS } from './helpers/simulationBot.ts';
import { verifyTrace } from './helpers/progressionTrace.ts';
import { validateScorePayload } from '../src/shared/validation.ts';
describe('real seeded balance acceptance', () => {
  it.each(BALANCE_RUNS)('$label', options => {
    const trace = runSimulation(options);
    if (options.difficulty === 'medium') expect(verifyTrace(trace), JSON.stringify(trace)).toEqual([]);
    else expect(trace.siegeWon).toBe(true);
    expect(trace.debugAssisted).toBe(false);
    expect(trace.purchases.every(p => Number.isSafeInteger(p.goldAfter) && p.goldAfter >= 0)).toBe(true);
    if (trace.outcome === 'endless' || trace.outcome === 'incomplete') {
      expect(options.continueEndless).toBe(true);
      expect(trace.wavesCompleted).toBe(options.throughWave);
      expect(trace.terminalPayload).toBeNull();
    } else {
      expect(trace.terminalPayload).not.toBeNull();
      expect(validateScorePayload(trace.terminalPayload).errors).toEqual([]);
    }
    if (options.goldRelics === 'disabled') {
      expect(trace.relicUses.some(use => GOLD_RELICS.has(use.id))).toBe(false);
      expect(trace.ordinaryRewardsOnly).toBe(true);
    }
  }, 120000);
});
```

The default acceptance test logs the actual trace on failure and never overwrites
tracked report JSON. The explicit report tool saves every successful and failing
trace under `artifacts/audit-fixes/balance/traces/`. Keep synthetic reporter tests,
but do not use them as evidence of gameplay acceptance.

- [x] **Step 2: Run RED and record the corrected baseline.** `rtk proxy npx vitest run tests/balance-acceptance.test.ts tests/progression-balance.test.ts tests/simulation-bot.test.ts`; expected real gate failures, including the reported excess rank-3 towers. Fix only fixture/trace wiring before evaluating coefficients.
- [x] **Step 3: Search late-price candidates with the fixed strategy.** candidates.test.ts
is opt-in (`BALANCE_TUNE=1`), shares BALANCE_RUNS, imports EVOLUTIONS/TOWERS, and
temporarily changes only each branch's `stats[3].cost`, restoring costs in finally.
The trial body is:

```ts
const originals = Object.values(EVOLUTIONS).map(def => [def, def.stats[3].cost] as const);
const reports: Array<{ factor: number; failures: Record<string, string[]> }> = [];
for (const factor of [4, 5, 6, 8, 10, 12, 16]) {
  try {
    for (const [def] of originals) def.stats[3].cost = Math.ceil(TOWERS[def.towerId].levels[3].cost * factor);
    const failures: Record<string, string[]> = {};
    for (const options of BALANCE_RUNS) {
      const trace = runSimulation(options);
      const gates = options.difficulty === 'medium' ? verifyTrace(trace) : trace.siegeWon ? [] : ['Siege victory required'];
      failures[options.label] = gates;
      writeFileSync(`artifacts/audit-fixes/balance/traces/factor-${factor}-${options.label}.json`, JSON.stringify(trace, null, 2));
    }
    reports.push({ factor, failures });
  } finally {
    for (const [def, cost] of originals) def.stats[3].cost = cost;
  }
}
writeFileSync('artifacts/audit-fixes/balance/candidates.json', JSON.stringify(reports, null, 2));
expect(reports.some(r => Object.values(r.failures).every(gates => gates.length === 0))).toBe(true);
```

Include imports from node:fs, mkdirSync for the trace directory, Vitest and the
same Phaser mock as Step 1. Run with PowerShell:
`rtk proxy powershell -NoProfile -Command '$env:BALANCE_TUNE="1"; npx vitest run artifacts/audit-fixes/balance/candidates.test.ts --silent=false'`.
Select the smallest factor satisfying all gates, then commit that factor in the
real EVOLUTION_COST_FACTORS rank-3 literal. Do not leave test-only mutation as the fix.

- [x] **Step 4: Resolve a genuinely empty feasible set without changing the gates.**
If no rank-3 factor passes, use the recorded failed gates to expand the same explicit
candidate evaluator to rank-1/rank-2 factors, preserving rank-0 `1.5` initially:
rank 1 in `[2, 2.5, 3]`, rank 2 in `[2.75, 3.5, 4.5]`, rank 3 in `[6, 8, 10, 12]`.
Set all three candidate costs through `Math.ceil(level4.cost * factors[rank])`, restore
all in finally, and preserve every trace/gate. Evaluate the full eight-run matrix,
not just the best seed. If legal price candidates satisfy economy but fail victory,
evaluate configured DAMAGE_FACTORS rank 2/3 multipliers `[1, 1.15, 1.3]` against the
same matrix; regenerate trial damage from the original per-branch rank stats,
restore it after each trial, and leave branch effects/identities intact. Record
each chosen change's evidence and keep existing armor/score plausibility tests.
If these bounded trials cannot meet all approved gates, stop with concrete traces
and request a spec adjustment; never silently relax assertions or change strategy.

- [x] **Step 5: Verify final source coefficients and commit.** Run the acceptance
test using untouched imports (no trial mutation), ordinary-income affordability/
nine-plot checks and evolution/config/system/scene purchase/combat tests. Update
old seed-price assertions to the newly chosen documented prices or shared formula;
retain monotonic prices, equal branch costs, refunds, safe mastery limits and
preview-vs-actual checks. All eight runs must pass the appropriate gates and produce
valid finished results; a surviving continued-endless checkpoint retains null
terminalPayload. Appendix C produces separate natural terminal evidence, without
changing any reference run. Commit the configs/tests/evidence as `Enforce seeded balance gates and tune late progression`.

### Task 6: Move current rankings/bests to era 3 and retain legacy records

**Files:** Modify `src/shared/version.ts`, package.json/package-lock.json,
Settings.ts, ProgressionScene.ts, MainMenuScene.ts, GameOverScene.ts,
personal-best/progression-scene/worker/client/result tests and current-era fixtures.
**Interfaces:** Consumes Task 1 settings and Task 5 final rules. Produces
`GAME_VERSION = '0.3.0'`, `SCORE_VERSION = 3`, `loadLegacyBests(): LocalBest[]`
(descending eras 2 then 1), and existing `loadLegacyBest(): LocalBest | null`
returning that list's first record. `loadBest/saveBest` target v3. Change
`progressionPanelLines(view: UnlockView, currentBest: LocalBest | null, legacyBests: readonly LocalBest[]): string[]`.

- [x] **Step 1: Add retention/label tests before changing versions.** Extend
personal-best.test.ts using its current storage Map:

```ts
it('keeps both prior eras untouched and prefers the newest legacy era', () => {
  const one = JSON.stringify({ ...best(100000), scoreVersion: 1 });
  const two = JSON.stringify({ ...best(5), scoreVersion: 2 });
  storage.set('aetherhold-best-v1', one);
  storage.set('aetherhold-best-score-v2', two);
  expect(loadLegacyBests().map(v => v.scoreVersion)).toEqual([2, 1]);
  expect(loadLegacyBest()?.score).toBe(5);
  saveBest(best(10));
  expect(loadBest()?.score).toBe(10);
  expect(storage.get('aetherhold-best-v1')).toBe(one);
  expect(storage.get('aetherhold-best-score-v2')).toBe(two);
  expect(JSON.parse(storage.get('aetherhold-best-score-v3')!).scoreVersion).toBe(3);
});
```

Add invalid v2 with valid v1 fallback, independent current-era comparisons, absent
legacy keys, and mismatched/current-future-era data. In progression-scene.test.ts
assert both explicit era labels and no cross-era numeric comparison. In worker.test.ts
retain current filtering, old POST rejection and duplicate cases; change its exact
active-era assertion from 2 to 3. Assert existing fake DB legacy rows stay present.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/personal-best.test.ts tests/progression-scene.test.ts tests/worker.test.ts tests/progression-results.test.ts`; expect absent legacy-list interface and era-2 storage mismatch.
- [x] **Step 3: Change versions and readers.**

```ts
// shared/version.ts
export const GAME_VERSION = '0.3.0';
export const SCORE_VERSION = 3;
// Settings.ts: after implementing parseBest(key, expectedEra, implicitEra)
export function loadLegacyBests(): LocalBest[] {
  return [parseBest('aetherhold-best-score-v2', 2, 2), parseBest('aetherhold-best-v1', 1, 1)]
    .filter((record): record is LocalBest => record !== null);
}
export function loadLegacyBest(): LocalBest | null { return loadLegacyBests()[0] ?? null; }
```

Make parseBest's exact signature `(key: string, expectedEra: number, implicitEra?: number): LocalBest | null`.
Guard unknown JSON object/array, finite nonnegative safe score/wave, legal difficulty,
parseable date and matching expected era. Only legacy v1/v2 may infer their own era
when its field is absent; current v3 requires the explicit version. A malformed
legacy record stays unchanged. Current save retains the existing higher-score policy.
Run `rtk proxy npm version 0.3.0 --no-git-tag-version` to update package metadata
without a tag or dependency upgrade. Keep shared/version as client/Worker truth.

- [x] **Step 4: Wire labels and all current fixtures.** Progression displays
`Legacy era ${record.scoreVersion} best` for both retained records; menu/results
display the newest available legacy era with the same label and measured wrapping.
Pass loadLegacyBests to progressionPanelLines. Update partial Settings mocks to expose
newly imported functions without replacing real storage behavior in repository tests.
Search `rtk proxy rg -n 'scoreVersion.*2|SCORE_VERSION.*2|best-score-v2|Legacy best' src tests`
and inspect each hit: old-era rejection/retention cases remain 2, current-era cases
become 3 or use the canonical constant. Preserve historical release evidence/scripts.

- [x] **Step 5: Run GREEN and commit.** Re-run Step 2, current client/validation
tests, Task 5 acceptance and typecheck. Keep forged-result rejection assertions
unchanged. Commit Task 6 files as `Start score era 3 and preserve both legacy bests`.

### Task 7: Use native throttling and apply page headers

**Files:** Modify worker/index.ts, wrangler.toml and every current Worker Env fixture;
create public/_headers and tests/static-headers.test.ts; extend tests/worker.test.ts.
**Interfaces:** Env gains `SCORE_RATE_LIMITER: RateLimit` using installed Workers
types. Existing fetch/API envelope stays compatible; denial is 429 RATE_LIMITED
with Retry-After 60, binding failure is 503 SCORE_API_UNAVAILABLE. Assets policy
is copied by the existing Vite public-directory mechanism.

- [x] **Step 1: Add denied/missing/failing binding checks.** In worker.test.ts add
a per-test factory attaching a fresh allow limiter to makeDb; update all existing
Env fixtures to use it. A configured fake denial is an explicit behavior test,
not a substitute for local native integration:

```ts
it('does not write when native quota denies the request', async () => {
  const db = makeDb();
  const env = { DB: db, SCORE_RATE_LIMITER: { limit: async () => ({ success: false }) } } as unknown as Env;
  const response = await post(env, validPayload());
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBe('60');
  expect(db.rows).toEqual([]);
});
```

Use worker.fetch/req directly if the file's post helper is describe-local. Add a
spy limiter asserting `scores:${trustedIP}`, anonymous fallback despite a spoofed
X-Forwarded-For, no limiter calls on GET/OPTIONS, and missing/throwing binding ->
503 without a DB call. Existing bounded-stream, invalid JSON, forged score and SQL
binding tests still run with an allow limiter; denial cannot conceal them.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/worker.test.ts tests/static-headers.test.ts`; expect no native call/headers, not stale score-era fixtures.
- [x] **Step 3: Configure and wire the native limiter.** Add:

```toml
[[ratelimits]]
name = "SCORE_RATE_LIMITER"
namespace_id = "3867429103"
simple = { limit = 10, period = 60 }
```

Use this dedicated Worker namespace rather than an example ID shared with another
binding. Verify the installed Wrangler schema/types accept it via build/dry-run.
Delete buckets, RATE_LIMIT/WINDOW_MS and rateLimited. At the beginning of the POST
branch, before parsing or DB work:

```ts
let quota: RateLimitOutcome | undefined;
try {
  quota = await env.SCORE_RATE_LIMITER?.limit({ key: `scores:${request.headers.get('CF-Connecting-IP') ?? 'anon'}` });
} catch {
  return apiError('SCORE_API_UNAVAILABLE', 'Score submission is temporarily unavailable. Please retry.', 503);
}
if (!quota) return apiError('SCORE_API_UNAVAILABLE', 'Score submission is temporarily unavailable. Please retry.', 503);
if (!quota.success) {
  const response = apiError('RATE_LIMITED', 'Rate limit exceeded. Slow down, warden.', 429);
  response.headers.set('Retry-After', '60');
  return response;
}
```

Keep the original validation/readBoundedBody/prepared INSERT and generic error
handling. Unit fixtures missing the newly required binding must be fixed, except
the deliberate missing-binding case.

- [x] **Step 4: Add the actual static policy and checks.** public/_headers:

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'
```

static-headers.test.ts reads this exact file, checks the wildcard rule and required
directives, excludes script unsafe-eval/unsafe-inline, and verifies line lengths
fit Cloudflare's parser limit. Code:

```ts
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('protects HTML while allowing the current local assets and styles', () => {
  const text = readFileSync('public/_headers', 'utf8');
  expect(text).toMatch(/^\/\*/);
  for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "font-src 'self'", "script-src 'self'"]) expect(text).toContain(directive);
  expect(text.match(/script-src[^;]+/)?.[0]).not.toContain('unsafe-');
  expect(text.split('\n').every(line => line.length <= 2000)).toBe(true);
});
```

Worker JSON headers remain in worker/index.ts; `_headers` is not a replacement
for those. Do not add a new CDN route or DB migration.

- [x] **Step 5: Run GREEN, build/dry-run and commit.** Step 2, full API tests,
`rtk npm run build`, `rtk proxy npx wrangler deploy --dry-run --outdir artifacts/audit-fixes/worker-dry-run`.
Confirm dist/_headers equals source and dry-run includes the binding. Task 11
exercises it through local Wrangler. Commit Task 7 files as `Use native score throttling and protect static game responses`.

### Task 8: Retain one immutable submission with safe cross-tab settlement

**Files:** Create `src/game/systems/ScoreRetry.ts`, `tests/score-retry.test.ts`,
`tests/score-submission.test.ts`; export a named SubmitScoreResult in
`src/api/leaderboardClient.ts` without changing submitScore behavior.
**Interfaces:** Consumes finalized era-3 validation and existing GameResultPayload.
Produces the following exact types/API; networking is outside the repository lock:

```ts
export type SubmitScoreResult = { ok: boolean; id?: number; error?: string; duplicate?: boolean }; // leaderboardClient.ts
export const SCORE_RETRY_KEY = 'aetherhold-score-retry-v1';
export interface SavedSubmission { version: 1; attemptedAt: string; payload: GameResultPayload; }
export interface RetryView {
  status: 'empty' | 'ready' | 'incompatible' | 'unreadable';
  record: SavedSubmission | null;
  persisted: boolean;
  warning: string | null;
}
export interface RetainedScoreResult {
  result: SubmitScoreResult;
  retry: RetryView;
  attempted: SavedSubmission | null;
}
export type RetryStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type RetryLock = <T>(work: () => T | Promise<T>) => Promise<T>;
export class ScoreRetryRepository {
  constructor(storage: RetryStore | null, lock: RetryLock | null, now?: () => string);
  view(): Promise<RetryView>;
  stage(payload: GameResultPayload): Promise<RetryView>;
  claimRetry(expected: SavedSubmission): Promise<{ matched: boolean; view: RetryView }>;
  settle(runId: string): Promise<RetryView>;
}
export const scoreRetryRepository: ScoreRetryRepository;
export async function submitRetainedScore(payload: GameResultPayload,
  repository?: ScoreRetryRepository, expected?: SavedSubmission): Promise<RetainedScoreResult>;
```

The optional repository argument is a bounded testing seam for actual persistence
and asynchronous settlement; it is not gameplay configuration. Payload
projection uses validateScorePayload's returned `value`, retaining only the API
fields. Malformed or retired records are never rewritten as era 3.

- [x] **Step 1: Build storage/lock test fixtures and RED tests.** A Map implements
get/set/remove; two repository instances share that Map and this serialized lock:

```ts
function serialLock(): RetryLock {
  let tail: Promise<unknown> = Promise.resolve();
  return work => {
    const result = tail.then(work);
    tail = result.catch(() => {});
    return result;
  };
}
```

Use resultFixture from tests/helpers/progressionResult.ts for real validated payloads:

```ts
it('keeps another tab\'s newer run when the older request settles', async () => {
  const bytes = new Map<string, string>();
  const store = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  const lock = serialLock();
  const a = new ScoreRetryRepository(store, lock), b = new ScoreRetryRepository(store, lock);
  const progress = { highestWave: 30, wavesCompleted: 30, outcome: 'victory' as const, siegeBossesDefeated: 7 };
  const first = resultFixture(progress, 10, { runId: 'retained-first-0001' });
  const second = resultFixture(progress, 10, { runId: 'retained-second-0001' });
  await a.stage(first); await b.stage(second); await a.settle(first.runId);
  expect((await b.view()).record?.payload.runId).toBe(second.runId);
  expect((await new ScoreRetryRepository(store, lock).view()).persisted).toBe(true);
});
```

Appendix D supplies concrete storage/lock failure and stale-claim tests. Add byte-preservation cases for invalid JSON/null/array, unknown version, >4096
UTF-8 bytes and invalid current-era payload; a recognized era-2 payload is visible
but incompatible. Test null/throwing store, unavailable/throwing lock, set/remove
failures, newest explicit replacement, immutable caller mutation, concurrent
stage/settle order, and reload of a staged unknown-outcome request. Validate input
before storing; invalid fresh submissions throw a readable validation error and
never invoke send.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/score-retry.test.ts tests/score-submission.test.ts tests/leaderboard-client.test.ts`; expected missing repository/service exports.
- [x] **Step 3: Implement the bounded reader/repository.** classify raw records
using 4096 UTF-8 bytes maximum, object/version/timestamp/payload schema, exact
current/retired era, and shared validation. For retired payloads validate structural
fields/result consistency without current-era score-envelope conversion; show
incompatible and preserve bytes. Treat future/unreadable data as protected. Current
invalid payloads show unreadable and are not posted. Keep session memory only when
persistence or locks fail; confirmed stored records are read fresh under the lock.
Use Object.freeze on a copied primitive API projection, never retain the caller's
mutable object. Use this structural guard for retired/current stored fields,
importing validatePlayerName from Task 1 and resultProgressErrors/ResultProgress
from their existing shared modules:

```ts
const API_FIELDS: readonly (keyof GameResultPayload)[] = [
  'playerName', 'difficulty', 'highestWave', 'wavesCompleted', 'outcome',
  'siegeBossesDefeated', 'finalScore', 'enemiesKilled', 'bossesKilled',
  'remainingLives', 'gameDurationSeconds', 'runId', 'gameVersion', 'scoreVersion'
];
function storedPayload(value: unknown): GameResultPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  if (!validatePlayerName(b.playerName).ok || (b.difficulty !== 'easy' && b.difficulty !== 'medium' && b.difficulty !== 'hard')) return null;
  if (typeof b.runId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(b.runId)) return null;
  if (typeof b.gameVersion !== 'string' || !b.gameVersion.length || b.gameVersion.length > 16) return null;
  const bounds: Record<string, readonly [number, number]> = {
    highestWave: [1, 500], wavesCompleted: [0, 500], finalScore: [0, 10000000],
    enemiesKilled: [0, 100000], bossesKilled: [0, 500], remainingLives: [0, 25],
    gameDurationSeconds: [0, 86400], siegeBossesDefeated: [0, 7], scoreVersion: [1, Number.MAX_SAFE_INTEGER]
  };
  for (const [key, [min, max]] of Object.entries(bounds)) {
    const n = b[key];
    if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < min || n > max) return null;
  }
  if ((b.bossesKilled as number) > (b.enemiesKilled as number)) return null;
  if (resultProgressErrors(b as unknown as ResultProgress, b.remainingLives as number, b.bossesKilled as number).length) return null;
  return Object.freeze(Object.fromEntries(API_FIELDS.map(key => [key, b[key]]))) as unknown as GameResultPayload;
}
```

Read only strings of at most 4096 code units and 4096 encoded UTF-8 bytes before
JSON.parse. Record version must be 1, attemptedAt must round-trip through
`new Date(attemptedAt).toISOString()` unchanged, and payload must pass storedPayload.
For era 3 additionally require validateScorePayload(payload).ok. Eras 1/2 are
recognized retired/readable; a higher payload era is protected/incompatible,
even when the outer record version remains 1. Malformed/unknown outer versions
are protected/unreadable. Internal classification records the protected flag
separately from RetryView; stage/settle may never write/remove protected bytes.
Each guarded operation converts read/write/lock errors into a session-only view
and warning. A protected read still allows stage to return its newly validated
session snapshot to the explicitly initiated POST, while preserving the old bytes.
settle reads current storage and removes only a readable matching runId;
clear matching memory separately. If removal fails, retain saved data and show a
warning rather than claiming it was cleared. Never hold the lock during fetch.

Browser construction wraps localStorage and navigator.locks access in try/catch,
with no access assumptions at module import. The actual lock adapter is:

```ts
const lock: RetryLock | null = typeof navigator !== 'undefined' && navigator.locks
  ? work => navigator.locks.request(SCORE_RETRY_KEY, () => work())
  : null;
```

stage validates current payload, stores `{version:1, attemptedAt:now(), payload}`
only into absent/readable supported storage, and otherwise records a session-only
attempt without changing protected bytes. A recognized older record is replaceable
only by an explicit new stage call. Return a view reflecting the real persistence
result, not a hoped-for write. A new view rereads shared persisted state so an old
tab does not resurrect a successfully settled payload from stale memory.

claimRetry reads and compares under the same lock, and never calls stage. Match
requires ready status, equal attemptedAt, equal runId and equal values for every
API_FIELDS member. It returns an immutable copy of that matching current record,
without changing its timestamp/bytes. On mismatch it returns matched:false and
the fresh view, with no write/POST. With unavailable locks/storage it compares only
the repository's actual session snapshot and warns session-only; it never reads or
writes persisted bytes without the lock. A later explicit new attempt may replace
the record after the claim; the in-flight snapshot remains immutable and settlement
is still conditional on current runId. Fresh Submit is stage; every Retry uses
claimRetry. A result-screen retry after its first attempt also passes its retained
SavedSubmission as expected, so it cannot silently replace a newer tab's attempt.

- [x] **Step 4: Implement shared submission ownership and exception cases.**

```ts
export async function submitRetainedScore(payload: GameResultPayload,
  repository = scoreRetryRepository, expected?: SavedSubmission): Promise<RetainedScoreResult> {
  const claim = expected ? await repository.claimRetry(expected) : null;
  if (claim && !claim.matched) return {
    result: { ok: false, error: 'The saved score changed. Open the latest saved score before retrying.' },
    retry: claim.view, attempted: null
  };
  const staged = claim ? claim.view : await repository.stage(payload);
  const snapshot = staged.record?.payload;
  if (!snapshot || staged.status !== 'ready') throw new Error('This score is not available for submission.');
  const result = await submitScore(snapshot);
  const retry = result.ok || result.duplicate
    ? await repository.settle(snapshot.runId)
    : await repository.view();
  return { result, retry, attempted: staged.record };
}
```

submitScore already returns failures for fetch exceptions; preserve that behavior.
In score-submission.test.ts mock submitScore only, using a real repository. Assert
the persisted bytes exist when send starts; duplicate and success settle; 429,
5xx, offline and timeout leave byte-identical retry; delayed success after a newer
stage never erases it. A corrupted/future storage record does not block a valid
explicit POST, but the returned retry must say session-only. No function here
invokes network on construction, view, stage or reload.

- [x] **Step 5: Run GREEN and commit.** Step 2 plus personal-best/unlocks/result
validation tests and typecheck. Commit Task 8 files as `Retain manual score submissions safely across reload and tabs`.

### Task 9: Wire saved-score UI and truthful offline messaging

**Files:** Modify GameOverScene.ts, MainMenuScene.ts, LeaderboardScene.ts and
tests/screens.test.ts; create `tests/saved-score-ui.test.ts`.
**Interfaces:** Consumes RetryView, scoreRetryRepository and submitRetainedScore
from Task 8. MainMenu gains private `drawSavedScore(view: RetryView): void`,
`openSavedScore(): Promise<void>`, a nullable saved sheet and a scene-generation
ticket. Its init accepts optional `{ openSaved?: boolean }` for resize restoration.
Results keeps its existing strict payload snapshot and per-run generation and
retains `scoreAttempt: SavedSubmission | null` from RetainedScoreResult.attempted.
All service mocks include attempted, and only retry view controls current storage
messages; the owned attempt controls subsequent conditional submission.

- [x] **Step 1: Add scene tests with a real repository fake-store seam.** Extend
screens mocks to expose repository/service functions and complete Settings exports;
prefer injected repository instances in service tests rather than silently allowing
all persistence. Verify no send on open/Back/restart, explicit replacement note,
ready/failed/incompatible/unreadable/session-only text, disabled duplicate clicks,
and menu resize preserving its open sheet. The retained asynchronous pattern is:

```ts
it('settles after results navigation but never redraws the closed screen', async () => {
  let resolve!: (value: RetainedScoreResult) => void;
  screenMocks.submitRetainedScore.mockReturnValue(new Promise(r => { resolve = r; }));
  const scene = new GameOverScene();
  scene.create(gameOverData('retained-navigation-0001'));
  press('Submit Score');
  scene.events.emit('shutdown');
  const draws = screenMocks.displays.length;
  resolve({ result: { ok: true, id: 1 }, retry: { status: 'empty', record: null, persisted: false, warning: null }, attempted: null });
  await Promise.resolve(); await Promise.resolve();
  expect(screenMocks.displays.length).toBe(draws);
});
```

This goes inside screens.test.ts where screenMocks/gameOverData/press already exist;
add the service mock to its hoisted object. Task 8's tests separately establish
actual settlement. Use an actually valid resultFixture-backed payload for tests
that exercise the real validation. Do not reduce assertions to counts alone.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/screens.test.ts tests/saved-score-ui.test.ts tests/score-submission.test.ts`; expect missing Saved Score action/wrong offline claims or stale UI behavior.
- [x] **Step 3: Update results submission without losing ownership.** Capture the
existing frozen payload in a local const before awaiting anything. Mark submitting
immediately and call submitRetainedScore; its persistence/settlement runs to
completion even if results closes. Add `private scoreAttempt: SavedSubmission | null = null`
to GameOverScene and reset it with the existing per-run init. The service returns
the staged/claimed attempt separately from the final repository view; those may
refer to different runs after a cross-tab replacement. Keep an already held
attempt on mismatch (`attempted:null`), so subsequent Retry remains conditional
and never silently becomes a new stage. Only the UI update uses isRunCurrent afterward:

```ts
const payload = this.payload;
if (!payload || !this.canSubmit()) return;
const generation = this.runGeneration;
this.submitState = 'submitting';
this.submitMessage = 'Submitting score...';
this.drawPanel(data);
try {
  const completed = await submitRetainedScore(payload, scoreRetryRepository, this.scoreAttempt ?? undefined);
  if (!this.isRunCurrent(data, generation)) return;
  if (completed.attempted) this.scoreAttempt = completed.attempted;
  const result = completed.result;
  this.submitState = result.ok || result.duplicate ? 'submitted' : 'failed';
  const retained = completed.retry.record?.payload.runId === payload.runId;
  this.submitMessage = result.ok ? 'Score saved to the Hall of Legends.'
    : result.duplicate ? 'This run was already recorded.'
    : retained && completed.retry.persisted ? `Could not save online (${result.error ?? 'offline'}). Saved for manual retry from the menu.`
    : retained ? `Could not save online (${result.error ?? 'offline'}). Retry is available in this session only.`
    : `Could not save online (${result.error ?? 'offline'}). A newer attempt replaced this saved retry.`;
} catch (error) {
  if (!this.isRunCurrent(data, generation)) return;
  this.submitState = 'failed';
  this.submitMessage = error instanceof Error ? error.message : 'This score could not be submitted.';
}
if (this.isRunCurrent(data, generation)) this.drawPanel(data);
```

Before rendering any Submit button, asynchronously read retry view under a
generation guard. If another saved run exists, show `Submitting replaces the
previous saved score retry.` beside it; opening results does not stage anything.
If protected bytes prevent replacement, show the session-only warning instead.
The same exact payload/runId is reused after failure. Present returned clearing/
storage warnings on success too when storage could not remove the saved duplicate.

- [x] **Step 4: Add a reachable saved-score sheet to the menu.** Keep current Play,
Hall, Settings and Progression layout. A small 44px Saved Score action is placed
in the existing footer region when ready/incompatible; unreadable storage gets
the explanatory footer warning. At compact sizes reserve its height and use the
existing responsive dimensions; it must not overlap legacy bests/Play. on create,
read repository.view with a scene generation; on shutdown invalidate it and
destroy the sheet. Resize restarts with openSaved state and clamps sheet scrolling.

```ts
const record = view.record;
const root = this.add.container(0, 0);
const sheet = new ScrollSheet(this, root, { x: 12, y: 12, width: this.scale.width - 24, height: this.scale.height - 24 }, 'Saved Score', () => this.scene.restart());
if (record) {
  const p = record.payload;
  let y = 0;
  for (const line of [p.playerName, `${p.difficulty.toUpperCase()} · ${p.outcome}`, `Wave ${p.highestWave} · Score ${p.finalScore.toLocaleString('en-US')}`, view.warning ?? (view.persisted ? 'Saved in this browser.' : 'Available in this session only.')]) {
    const text = sheet.text(y, line); y += text.height + 12;
  }
  sheet.action(y, 'Retry Submission', () => { void this.retrySavedScore(record); }, 'primary', view.status === 'ready');
  sheet.action(y + 52, 'Back', () => this.scene.restart());
}
```

Define private `retrySavedScore(record: SavedSubmission): Promise<void>` as the
menu counterpart of Step 3: synchronously return if submitting, otherwise set
submitting=true and disable the held action BEFORE its first await. Call
`submitRetainedScore(record.payload, scoreRetryRepository, record)`; no separate
view-then-stage sequence. A mismatched claim redraws the fresh view with its
replacement explanation and sends nothing until a new explicit action. Clear
submitting in finally, but update objects only if the captured generation is live.
Appendix D supplies a held-lock regression. Redraw only if its
generation and current saved run still match. Show already-recorded/success/failure
without fabricating GameOverData or restarting Game. Incompatible records show
`This saved score belongs to an earlier leaderboard era and cannot be submitted
to the current board.` Unreadable records show a storage warning and Back only.
No reset/discard/history/scheduler UI is added.

- [x] **Step 5: Correct leaderboard failure text.** Remove `Your run remains saved
locally.` in both branches. Show `Local progress is unaffected.` plus a confirmed
saved-retry/session-only notice only when the repository view actually establishes
it. Async repository text uses the same load/request-generation guard as board
fetching. Preserve Retry/filter/scroll/highlight behavior and no implicit POST.

- [x] **Step 6: Run GREEN and commit.** Step 2 plus full screens/progression/
personal-best/leaderboard/repository tests and typecheck. Commit Task 9 files as
`Expose saved manual retries and report offline persistence accurately`.

### Task 10: Show the next rank/mastery purchase before spending

**Files:** Modify EvolutionSystem.ts, progressionView.ts, GameScene.ts and
tests/evolution-system.test.ts, tests/progression-ui.test.ts,
tests/scene-progression-ui.test.ts and compact-sheet tests.
**Interfaces:** Export `previewPurchaseStats(id: TowerId, state: EvolutionState, intent: PurchaseIntent): EffectiveTowerStats | null` from EvolutionSystem; add `nextStats: EffectiveTowerStats | null` to ProgressionAction. Existing labels/reasons/revision/branches stay compatible.

- [x] **Step 1: Add preview-vs-purchase and disabled-state tests.**

```ts
it('previews a rank without requiring gold and matches its committed stats', () => {
  const t = tower('marksman', 1);
  const before = structuredClone(t.progression);
  const intent = { kind: 'evolution-rank' as const };
  const preview = previewPurchaseStats(t.towerId, t.progression, intent);
  const bought = purchaseEvolution(t.towerId, t.progression, intent,
    { gold: 1000000, evolutionOpen: true, endless: false, blocked: false, unlocked: new Set() }, t.progression.revision);
  expect(bought.ok).toBe(true);
  if (!bought.ok) throw Error(bought.reason);
  expect(preview).toEqual(bought.stats);
  expect(t.progression).toEqual(before);
  expect(towerProgressionView(t, ctx({ gold: 0, blocked: true })).actions[0].nextStats).toEqual(preview);
});
```

Use each file's existing tower/ctx fixtures or import them from their named helper.
Parameterize all five towers/both branches across foundation/evolve/rank/mastery,
and numeric mastery overflow -> null. Scene text assertions must find current-to-
next labels before the matching action and confirm the model fields do not mutate
gold/cooldown/counters/shot snapshots. Retain existing branch comparisons.

- [x] **Step 2: Run RED.** `rtk proxy npx vitest run tests/evolution-system.test.ts tests/progression-ui.test.ts tests/scene-progression-ui.test.ts tests/compact-sheet.test.ts`; expected missing preview/nextStats.
- [x] **Step 3: Derive the preview using the existing purchase reducer.** It can
dry-run purchaseEvolution with maximum safe gold, permissive prerequisites and
all available branches; the source state is still validated and never changed:

```ts
export function previewPurchaseStats(id: TowerId, state: EvolutionState, intent: PurchaseIntent): EffectiveTowerStats | null {
  const result = purchaseEvolution(id, state, intent, {
    gold: Number.MAX_SAFE_INTEGER, evolutionOpen: true, endless: true, blocked: false,
    unlocked: new Set<BranchId>(Object.keys(EVOLUTIONS) as BranchId[])
  }, state.revision);
  return result.ok ? result.stats : null;
}
```

Retain initial branch previews from branch rank-0 config below level 4: those
already intentionally preview a locked future evolution; the new helper is for
legal next-stage numeric states, not a replacement for that comparison.
progressionView puts nextStats on each action. In drawProgressionModel insert base
current-to-next damage/attack/range before foundation/rank/mastery controls. Mastery
includes unchanged attack/range; null nextStats uses the existing numeric-limit
reason with no NaN/infinite value. Desktop and compact inspector use the same
model action rather than `t.cfg.levels[t.level]` as the sole preview. Word-wrap and
derive action y positions from measured text height, keeping ScrollSheet reachability.

- [x] **Step 4: Refresh and verify.** Existing affordability refresh only changes
availability; a committed purchase refreshes model/values while retaining captured
identity/revision semantics. Check held/stale controls remain inert and scrolling
does not buy anything. Run Step 2 plus purchase/combat/stat-format tests and
typecheck; commit as `Preview next evolution ranks and mastery before purchase`.

### Task 11: Verify the complete browser/API flows and document real evidence

**Files:** Create `artifacts/audit-fixes/browser.cjs`, `artifacts/audit-fixes/api.cjs`,
`artifacts/audit-fixes/vite.config.ts`, `artifacts/audit-fixes/legacy-fixture.sql`,
`artifacts/audit-fixes/verification.md`, `agent_docs/audit_fixes_2026-10-09.md`;
update current SPEC.md and agent_docs/latest_session_work.md. Task output includes
browser screenshots/request/error logs and final era-3 balance traces.
**Interfaces:** Consumes all preceding product code, GameOverData/LoadingRequest,
SavedSubmission schema, final BALANCE_RUNS/terminalPayloads, and native local Worker.
Produces checked evidence, not new application interfaces or runtime debugging hooks.

- [x] **Step 1: Run full prerequisites and produce current balance traces.**
`rtk npm run typecheck`, `rtk npm test`, `rtk npm run build` must pass. Extend the
explicit opt-in report writer to use BALANCE_RUNS/final era-3 source configuration
and output each trace under artifacts/audit-fixes/balance/traces. It asserts the
same Medium/sanity gates as the default acceptance suite. Report actual failures
before throwing; never claim old-era reports verify the final release. Preserve
the previous shipped evidence as history. Record the build's existing bundle warning
if it remains; this scope changes image loading, not the Phaser bundle architecture.
The exact report writer/test command and terminal producers are in Appendix C.

- [x] **Step 2: Start isolated local services with owned process/session IDs.**
Use a new `.scratch/audit-fixes-d1` state directory; do not delete another local DB
or stop unrelated servers. Check ports 8877/5191 are free before starting. If occupied
by unrelated work, select free ports and change only this verification config/runner
URLs, not the product's development configuration. Apply migrations locally:
`rtk proxy npx wrangler d1 migrations apply aetherhold_scores --local --persist-to .scratch/audit-fixes-d1`.
Start `rtk proxy npx wrangler dev --ip 127.0.0.1 --port 8877 --persist-to .scratch/audit-fixes-d1`
in a retained tool session or Start-Process with `-WindowStyle Hidden`, redirecting
logs to artifacts/audit-fixes. Wait for its real /api/health response before use.
The verification-only Vite configuration is:

```ts
import { defineConfig, mergeConfig } from 'vite';
import base from '../../vite.config.ts';
export default mergeConfig(base, defineConfig({
  server: { host: '127.0.0.1', port: 5191, strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8877' } }
}));
```

Start `rtk proxy npx vite --config artifacts/audit-fixes/vite.config.ts` separately.
Stop only the process/session IDs created by this task after verification. These
servers never use `--remote` or write production scores.

- [x] **Step 3: Write real local API assertions, including a preserved legacy row.**
legacy-fixture.sql is a single era-2 INSERT with fixed test run_id
`audit-legacy-row-0001`, player `Legacy Audit`, difficulty medium, highest_wave 8,
final_score 6000, enemies_killed 200, bosses_killed 0, remaining_lives 0,
game_duration_seconds 600, game_version 0.2.0, score_version 2, waves_completed 7,
outcome defeat and siege_bosses_defeated 0. Run it only in the isolated local DB:
`rtk proxy npx wrangler d1 execute aetherhold_scores --local --persist-to .scratch/audit-fixes-d1 --file artifacts/audit-fixes/legacy-fixture.sql`.
Use one actual final Medium trace's terminalPayload as the current valid POST.
The api.cjs core is:

```js
const assert = require('node:assert/strict'), fs = require('node:fs'), crypto = require('node:crypto');
(async () => {
  const base = 'http://127.0.0.1:8877';
  const trace = JSON.parse(fs.readFileSync('artifacts/audit-fixes/balance/traces/medium-starter-1.json', 'utf8'));
  const payload = { ...trace.terminalPayload, runId: crypto.randomUUID(), playerName: 'Jos\u00e9 API' };
  assert.equal(payload.scoreVersion, 3);
  const post = body => fetch(base + '/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.11' }, body: JSON.stringify(body) });
  const accepted = await post(payload); assert.equal(accepted.status, 201);
  assert.equal((await post(payload)).status, 409);
  assert.equal((await post({ ...payload, runId: crypto.randomUUID(), scoreVersion: 2 })).status, 400);
  const board = await (await fetch(base + '/api/leaderboard?limit=100')).json();
  assert.equal(board.scoreVersion, 3);
  assert(board.scores.some(row => row.runId === payload.runId));
  assert(board.scores.every(row => row.scoreVersion === 3 && row.runId !== 'audit-legacy-row-0001'));
  const denials = [];
  for (let i = 0; i < 30; i++) {
    const response = await fetch(base + '/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.12' }, body: '{}' });
    if (response.status === 429) { assert.equal(response.headers.get('Retry-After'), '60'); denials.push(response.status); break; }
    assert.equal(response.status, 400);
  }
  assert(denials.length > 0, 'Native local limiter never denied requests');
  fs.writeFileSync('artifacts/audit-fixes/api.json', JSON.stringify({ accepted: accepted.status, currentRun: payload.runId, currentEra: board.scoreVersion, nativeDenials: denials }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
```

Use fresh test-IP keys for browser POST cases if the local runtime supports those
request headers; otherwise wait the native local quota window between API and
browser phases rather than disabling the binding. After the script, query local
D1 to assert the legacy row still exists. Appendix E supplies the additional local
API bodies and browser runner bodies/commands. Keep native-limiter evidence
distinct from its fake unit tests; no production quota precision claim.

- [x] **Step 4: Build the browser harness with native input and request evidence.**
Reuse the installed Playwright path observed in artifacts/auto-mode/check.cjs; do
not install another package. Create a fresh browser context for each cold-load case.
Read-only development instrumentation exposes the Phaser Game as `window.__auditGame`
by replacing the existing main.ts constructor assignment in a labeled routed source
response, using the same established harness approach. Native mouse/keyboard actions
trigger all tested user controls. The control locator is:

```js
async function point(page, label) {
  return page.evaluate(label => {
    const game = window.__auditGame;
    const roots = game.scene.getScenes(true).map(scene => ({ visible: true, list: scene.children.list }));
    let found = null;
    function visit(item) {
      if (!item || item.visible === false || found) return;
      const list = item.list || [];
      for (let i = 0; i < list.length; i++) {
        const text = list[i], box = list[i - 1];
        if (text.visible !== false && typeof text.text === 'string' && text.text.startsWith(label) && box?.input?.enabled) {
          const b = box.getBounds(); found = { x: b.centerX, y: b.centerY }; return;
        }
        visit(text);
      }
    }
    for (const root of roots) visit(root);
    return found;
  }, label);
}
async function click(page, label) {
  let location = await point(page, label);
  for (let attempt = 0; !location && attempt < 20; attempt++) {
    const bounds = await page.evaluate(() => {
      const game = window.__auditGame;
      for (const scene of game.scene.getScenes(true)) {
        const sheet = scene.savedSheet || scene.phoneSheet || scene.sheet || scene.modalSheet;
        if (sheet) return sheet.bounds;
      }
      return null;
    });
    assert(bounds, `No scrollable sheet for ${label}`);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, 48);
    await page.waitForTimeout(50); location = await point(page, label);
  }
  assert(location, `Unreachable control ${label}`);
  await page.mouse.click(location.x, location.y);
}
```

The locator wraps scene.children.list as a single root to retain sibling order.
If a house
control's text is nested differently, use the verified getBounds of the matching
interactive object, not a guessed coordinate in the development test. Instrumented
state reads and intentionally seeded QA cases are labeled; unmodified local Worker
and production checks below have no injected Game reference.

Attach pageerror, console error/CSP, request/response and requestfailed collectors.
Save each case's input actions, image requests, POST bodies/statuses and screenshot.
Tests explicitly allow only their injected failures; an unrelated request/error is
a failure. On failure write evidence before throwing and close contexts in finally.

- [x] **Step 5: Execute the browser matrix with concrete assertions.**

Use the executable cases in Appendix E; the table below is their evidence checklist.

| Case | Setup/action | Required result |
|---|---|---|
| Cold menu at all six sizes | New context -> menu; collect .webp requests before Play | Exactly six menu sources, no game/defeat source, bytes below 29.6 MB, no error; all menu actions reachable |
| Gameplay stage at all six sizes | Native Play/name/Continue; hold one enemy atlas response | Preload stays active and Game inactive until response succeeds; name/difficulty retained |
| Asset failure/Retry | Abort enemy nature atlas once; click Retry | Understandable failure with native controls; no enemy spawn/crash before retry; eventual Game ready |
| Loading cancel and stale completion | Hold atlas -> Back to Keep -> release held response | Menu remains active; no run or score POST; old font/load callback cannot navigate |
| Defeat art recovery | Hold/abort defeated map on a real terminal defeat; Retry | Same terminal runId/score/snapshot retained and no run resumes |
| Warm replay | Complete/leave a run -> Play Again or Restart | No repeated source image request; new UUID, no dirty clock/Auto state |
| IME/name | compositionstart; input decomposed/supplementary name; compositionend; native Enter | Intermediate value untouched, final valid NFC name, no surrogate split, same server-stored spelling |
| Malformed settings | Init script sets invalid difficulty/name/types before boot | Play starts with valid defaults and no exception; legal saved volume retained |
| Rank/mastery preview at all six sizes | Labeled QA evolution/mastery fixture through loading; native scroll/purchase | Preview matches actual next values/cost; lock/poor-gold reason visible; dragging/held stale action cannot buy |
| Auto/pause/rotation | Native A/Start/P; background visibility integration labeled; rotate viewport | Auto count is real-time; pause freezes combat/debt; explicit Resume; selection/scroll/run/target preserved |
| Victory/endless | Labeled QA victory, native reward resolution/Finish or Continue | Once-only rewards, phase guards, correct stage/result; no implicit score POST |
| Offline retry after reload | Real Hard loss, native Submit with aborted network -> menu -> reload -> Saved Score -> Retry | Identical payload/runId retained, one explicit POST per attempt, real local 201, entry clears |
| Accepted response lost | First score route.fetch reaches local 201, then abort response; reload/Retry | Real local 409, already-recorded state, matching entry clears, no duplicate DB row |
| Storage refusal/future record | Controlled setItem failure or malformed/newer record | Session-only/protected-data warning, exact old bytes retained, gameplay works, no auto POST |
| Two tabs and late response | Tab A POST held; Tab B submits/saves later run; release A success | B's saved payload remains; no late A redraw or mistaken saved-for-retry message |
| Native built Worker policy | Unmodified page at http://127.0.0.1:8877 | Fonts/Phaser/inputs/staged images/audio work, required HTML/bundle headers and no CSP violation |

The six sizes are 1440x900, 1280x720, 1024x768, 844x390, 390x844, 360x640. Save
before/after screenshots of the affected loading, preview and retry sheets and
inspect them rather than claiming visual acceptance from a screenshot's existence.
For a real Hard result, choose Hard, build no towers, start wave 1 and then wave 2
after the first clears; 3x may shorten the wait but is set through the native Speed
control. This creates a legitimate terminal payload with the current rules. Never
fake a success response: use route.fetch against the local Worker, or real fetch
after removing the intentional failure route. Before reload let persistent staging
complete; the UI's saved/session-only message is the observable signal.

The unmodified built Worker check uses rendered control coordinates verified in the
development cases and DOM name input, not a patched bundle. Keep global no-POST
assertions in tests that are not explicitly about submission. Native audio requires
a user gesture; inspect the runtime AudioContext and volume routing after native
Play, and record that speaker output/physical hardware is not measured.

- [x] **Step 6: Write verified current documentation and run a complete cold review.**
SPEC.md updates actual final coefficient tables/prices/mastery, era/current-best
keys, both legacy records, saved submission rules, name policy, staged/recovery
entry and native protection. Preserve its historical exceptions as history in the
older evidence; the current document points to final results instead of claiming
the old failures now passed. latest_session_work links the new handoff with actual
test totals, exact trace gates and runtime limits. The handoff includes an eleven-
item completion/evidence table and clear unresolved blockers, if any. Dispatch one
fresh read-only whole-change reviewer under the required code-review skill, comparing
the implementation against the approved spec and baseline 06938d9. Address actionable
findings and rerun only affected checks plus the final release gate. No skill-
required reviewer is given production file ownership in this Light route.

- [x] **Step 7: Commit verified evidence and documentation.** Run typecheck,
default tests and build with final configs and no candidate mutations. Verify
tracked old score/profile fixtures and unrelated files were preserved. Commit the
hand-off/evidence/current documentation as `Verify the combined audit release end to end`.

### Task 12: Publish once, verify live, and synchronize the branch

**Files:** Create `artifacts/audit-fixes/live.cjs`; update the handoff, latest session
record, spec and this plan's completion checkboxes/status. No new product API.
**Interfaces:** Consumes the final dist bundle, existing Worker/D1 bindings,
score era 3 and verified whole-change review. Produces live verification record,
published URL/Worker version and matching local/remote HEAD.

- [x] **Step 1: Prepare the read-only live checker before deployment.** Reuse the
observed Playwright runtime path and Node standard-library fetch/fs/crypto. The
checker must use the exact current HTML-selected bundle and verify bytes, not
only filename or status:

```js
const assert = require('node:assert/strict'), fs = require('node:fs'), crypto = require('node:crypto');
(async () => {
  const base = 'https://aetherhold-defense.ljournllagas.workers.dev/';
  const html = await fetch(base, { cache: 'no-store' }); assert.equal(html.status, 200);
  const source = await html.text();
  const bundle = source.match(/src="([^\"]+\.js)"/)[1];
  assert(fs.readFileSync('dist/index.html', 'utf8').includes(bundle));
  const js = await fetch(new URL(bundle, base)); assert.equal(js.status, 200);
  assert.match(js.headers.get('Content-Type'), /javascript/);
  const bytes = Buffer.from(await js.arrayBuffer());
  assert(bytes.equals(fs.readFileSync('dist' + bundle)));
  for (const [name, value] of [['X-Frame-Options', 'DENY'], ['X-Content-Type-Options', 'nosniff'], ['Referrer-Policy', 'no-referrer']]) assert.equal(html.headers.get(name), value);
  assert(html.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
  const health = await fetch(new URL('/api/health', base)); assert.equal(health.status, 200);
  const data = await health.json(); assert.equal(data.ok, true); assert.equal(data.scoreVersion, 3);
  const boardResponse = await fetch(new URL('/api/leaderboard?limit=100', base)); assert.equal(boardResponse.status, 200);
  const board = await boardResponse.json(); assert.equal(board.scoreVersion, 3);
  assert(board.scores.every(row => row.scoreVersion === 3));
  fs.writeFileSync('artifacts/audit-fixes/live.json', JSON.stringify({ url: base, bundle, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), health: data, rows: board.scores.length, headers: Object.fromEntries(html.headers) }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
```

Add the unmodified native Play/name/entry/Pause/Resume/Restart browser smoke using
the verified local built-layout coordinates and DOM input. Wait for six menu images
then the gameplay-stage requests; do not wait for all 22 before allowing Play.
Collect page errors, CSP messages, unexpected requests and screenshots. Attach a
request guard rejecting every POST during live verification. Do not add QA/global
Game hooks, intercept the live bundle, seed live storage or manufacture live data.

- [x] **Step 2: Publish the complete application.** With a clean verified change
and all acceptance gates passing, run `rtk npm run deploy` in a retained session.
This command must execute tests/build before `wrangler deploy --keep-vars`; keep the
existing Worker and D1 database. Record the actual Worker version/URL and deployment
log. A failed test/build/binding/deploy is resolved or reported as a concrete blocker;
there is no partial-success release claim and no new approval request for publishing.

- [x] **Step 3: Run live verification and fix any release failure.** Run
`rtk proxy node artifacts/audit-fixes/live.cjs`; expect actual HTML/current bundle/
health/API/header checks and native smoke to pass, with zero POSTs. If a deployment
defect requires a code fix, run its focused regression and the deploy gate before
republishing. Preserve existing remote score rows; this release needs no migration.
If verification cannot pass, report the failing endpoint/behavior/version precisely.

- [x] **Step 4: Record completion, commit/push and compare HEAD.** Write final
test totals, actual prices/trace outcomes, reviewed findings, browser limits,
deployment version/URL and live SHA into handoff and latest_session_work. Mark only
completed plan/spec work done. Stage only the release's source/tests/docs/evidence;
commit `Record verified combined audit release`. Run `rtk git push`, then read
`rtk git rev-parse HEAD` and `rtk git ls-remote origin refs/heads/main` (use the
verified current branch if it changed at the user's instruction); hashes must
match. Check `rtk git status --short` and explain any preserved unrelated changes.
Report a push failure explicitly and keep the local commit recoverable.

## Requirement coverage

| Approved requirement | Owning tasks |
|---|---|
| R1 time/debt/events/pause/Auto/render/reset/count equivalence | 2, 3, 11 |
| R2/R9 manifest/stages/derived textures/entry/results/failure/retry/cancel/font/resize/cache | 4, 11, 12 |
| R3/R7 type-safe settings/NFC/UTF-16/IME/server boundaries | 1, 11 |
| R4 fixed-strategy gates/no-gold evidence/Easy-Hard/price/mastery/report/default enforcement | 5, 6, 11 |
| R5 quota/trusted key/binding failure/no DB write/native integration | 7, 11 |
| R6 static/API headers/fonts/scripts/images/audio/CSP/live proof | 7, 11, 12 |
| R10 numerical previews/disabled states/format/purchase equivalence/scroll/stale controls | 10, 11 |
| R8/R11 latest immutable attempt/explicit replacement/locks/storage/callback/duplicate/retired/malformed/offline UI | 8, 9, 11 |
| Era 3/current filtering/retained DB rows/legacy bytes/unlocks/old-client rejection | 6, 7, 8, 11, 12 |
| Full tests/build/native browser/cold review/evidence/deploy/live/push equality | 11, 12 |

## Appendix A — Concrete remaining name/settings regressions (Task 1)

Add these bodies to settings.test.ts with the imports in Task 1 plus saveSettings;
the defaults are verified against the current public settings behavior.

```ts
it.each(['musicOn', 'sfxOn'] as const)('accepts only booleans for %s', key => {
  for (const value of [false, true]) expect(normalizeSettings({ [key]: value })[key]).toBe(value);
  for (const value of [0, 1, null, 'false', [], {}]) expect(normalizeSettings({ [key]: value })[key]).toBe(true);
});
it.each([1, 2, 3])('retains legal speed %i', gameSpeed => expect(normalizeSettings({ gameSpeed }).gameSpeed).toBe(gameSpeed));
it.each([0, -1, 4, NaN, Infinity, '2'])('defaults illegal speed %s', gameSpeed => expect(normalizeSettings({ gameSpeed }).gameSpeed).toBe(1));
it.each(['easy', 'medium', 'hard'] as const)('retains difficulty %s', difficulty => expect(normalizeSettings({ difficulty }).difficulty).toBe(difficulty));
it.each(['', 'unknown', 42, null])('defaults illegal difficulty %s', difficulty => expect(normalizeSettings({ difficulty }).difficulty).toBe('medium'));
it.each(['masterVolume', 'musicVolume', 'sfxVolume'] as const)('bounds finite volumes %s', key => {
  expect(normalizeSettings({ [key]: -1 })[key]).toBe(0);
  expect(normalizeSettings({ [key]: 2 })[key]).toBe(1);
  expect(normalizeSettings({ [key]: .4 })[key]).toBe(.4);
  for (const value of [NaN, Infinity, '0.4', null]) expect(normalizeSettings({ [key]: value })[key]).toBe(normalizeSettings({})[key]);
});
it.each([null, '', '{broken', 'null', '[]'])('defaults missing/malformed settings %s', raw => {
  vi.stubGlobal('localStorage', { getItem: () => raw });
  expect(loadSettings()).toEqual(normalizeSettings({}));
});
it('survives refused storage and sanitizes writes', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
  expect(loadSettings()).toEqual(normalizeSettings({}));
  expect(() => saveSettings(normalizeSettings({}))).not.toThrow();
  const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem });
  saveSettings({ ...normalizeSettings({}), playerName: 'Jose\u0301 A.' });
  expect(JSON.parse(setItem.mock.calls[0][1]).playerName).toBe('Jos\u00e9 A.');
});
```

In game.test.ts use its current valid-score fixture (keep the existing fixture
variable name); the exact additional assertion body is:

```ts
const named = { ...good, playerName: 'Jose\u0301 A.' };
expect(validateScorePayload(named)).toMatchObject({ ok: true, value: { playerName: 'Jos\u00e9 A.' } });
for (const playerName of ['a'.repeat(21), '<script>', '\u{1F600}']) {
  expect(validateScorePayload({ ...named, playerName }).ok).toBe(false);
}
```

Place that body inside a new it in the existing score validation describe, where
the current `good` fixture is in scope.

## Appendix B — Real combat partition and modal acceptance (Task 3)

Add these tests to scene-timing.test.ts in addition to the diagnostic attackCount.
Only rendering and modal presentation are stubbed; fireProjectile, damageEnemy,
killEnemy, updateFlights and EconomySystem remain real. Use the existing seeded
mulberry32 export; install Phaser.Math.Vector2 in the fixture exactly as the bot
does, because the headless Phaser Scene mock otherwise lacks this art primitive.

```ts
import Phaser from 'phaser';
import { mulberry32 } from './helpers/simulationBot.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
function partitions(kind: '60' | '30' | '10' | 'irregular'): number[] {
  if (kind !== 'irregular') return Array(Number(kind) * 10).fill(1000 / Number(kind));
  const pattern = [3, 231, 17, 79, 5, 1100, 41], values: number[] = [];
  for (let total = 0, i = 0; total < 10000; i++) {
    const dt = Math.min(pattern[i % pattern.length], 10000 - total); values.push(dt); total += dt;
  }
  return values;
}
function realCombat(parts: number[], speed: number, seed: number) {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
  const math = Phaser as unknown as { Math?: { Vector2: unknown } };
  math.Math = { Vector2: class { constructor(public x: number, public y: number) {} } };
  const { run, loose } = autoScene();
  loose.renderFrame = vi.fn(); loose.presentReward = vi.fn();
  const tower = new Tower('longbow', 300, 300, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: 'volley', rank: 3 };
  run.towers = [tower]; run.battleCryUntil = Infinity; loose.speed = speed;
  run.enemies = Array.from({ length: 80 }, () => {
    const e = new Enemy('thornling', 250, 0, 8); e.x = 300; e.y = 300; e.regen = 0; return e;
  });
  const goldBefore = run.gold;
  const combat = run as unknown as { fireProjectile(...args: unknown[]): void; enemiesKilled: number; simulationClock: { pendingMs: number } };
  const attacks = vi.spyOn(combat, 'fireProjectile'); // call-through spy
  const rewards = vi.spyOn(run.vault, 'offer'); // call-through spy
  let time = 0;
  for (const dt of parts) { time += dt; run.update(time, dt); }
  for (let i = 0; combat.simulationClock.pendingMs + 1e-7 >= SIMULATION_STEP_MS && i < 100; i++) run.update(time, 0);
  expect(combat.simulationClock.pendingMs).toBeLessThan(SIMULATION_STEP_MS);
  const result = { attacks: attacks.mock.calls.length, kills: combat.enemiesKilled,
    gold: run.gold - goldBefore, relicRewards: rewards.mock.calls.length };
  vi.restoreAllMocks();
  return result;
}
it.each([1, 2, 3])('matches seeded real attack/kill/reward resolution at speed %i', speed => {
  for (const seed of [1, 2, 3]) {
    const baseline = realCombat(partitions('60'), speed, seed);
    expect(baseline.attacks).toBeGreaterThan(0); expect(baseline.kills).toBeGreaterThan(0); expect(baseline.gold).toBeGreaterThan(0);
    for (const kind of ['30', '10', 'irregular'] as const) expect(realCombat(partitions(kind), speed, seed)).toEqual(baseline);
  }
});
it('commits all current-tick impacts and opens the overflow dialog before another catch-up tick', () => {
  const { run, loose } = autoScene(); loose.renderFrame = vi.fn();
  run.vault.stored.push('battle_cry', 'gold_rush', 'time_freeze');
  // Force a real drop and stub only its visual dialog, retaining the blocker state.
  vi.spyOn(Math, 'random').mockReturnValue(0);
  loose.showInventoryFullModal = vi.fn(() => { loose.modal = {}; loose.pausedByModal = true; });
  const tower = new Tower('longbow', 300, 300, 0);
  const enemies = [1, 2].map(() => { const e = new Enemy('thornling', 1, 0, 8); e.x = e.y = 300; return e; });
  const combat = run as unknown as { evolutionCombat: { makeShot(t: Tower, all: Tower[], n: number): unknown }; flights: unknown[];
    simulationClock: { pendingMs: number }; simulateTick(ms: number): boolean; enemiesKilled: number };
  run.enemies = enemies;
  combat.flights = enemies.map(e => ({ elapsedMs: 0, durationMs: 1, x1: 300, y1: 300, x2: 300, y2: 300,
    targetId: e.id, towerId: tower.towerId, shot: combat.evolutionCombat.makeShot(tower, [tower], 1), view: { destroy: vi.fn() }, chainIndex: 0, hit: new Set<number>() }));
  const tick = vi.spyOn(combat, 'simulateTick'); run.update(0, 2500);
  expect(combat.enemiesKilled).toBe(2); expect(combat.flights).toHaveLength(0);
  expect(loose.showInventoryFullModal).toHaveBeenCalledTimes(1); expect(tick).toHaveBeenCalledTimes(1);
  const debt = combat.simulationClock.pendingMs, time = run.gameTimeMs;
  run.update(2500, 500); expect(run.gameTimeMs).toBe(time); expect(combat.simulationClock.pendingMs).toBe(debt);
});
```

Each fixture restores the prior Phaser.Math reference in afterEach as well as
Vitest spies. Access the current Tower identifier field (`towerId`) from Tower.ts;
do not modify the production types just to accommodate this structural test cast.

## Appendix C — Report command and separate terminal producers (Tasks 5/11)

Create `artifacts/audit-fixes/balance/report.test.ts`, reusing the Phaser mock from
Task 5, with this executable writer. Default acceptance never writes reports.

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { BALANCE_RUNS } from '../../../tests/helpers/balanceRuns.ts';
import { runSimulation } from '../../../tests/helpers/simulationBot.ts';
import { verifyTrace } from '../../../tests/helpers/progressionTrace.ts';
import { validateScorePayload } from '../../../src/shared/validation.ts';
it.runIf(process.env.BALANCE_SIM === '1')('records final balance and a separately finished seed-2 run', () => {
  const out = 'artifacts/audit-fixes/balance/traces'; mkdirSync(out, { recursive: true });
  const scenarios = [...BALANCE_RUNS, { ...BALANCE_RUNS.find(r => r.label === 'medium-starter-2')!,
    label: 'terminal-victory-seed-2', throughWave: 30, continueEndless: false }];
  const failures: Record<string, string[]> = {};
  for (const options of scenarios) {
    const trace = runSimulation(options);
    const gates = options.difficulty === 'medium' ? verifyTrace(trace) : trace.siegeWon ? [] : ['Siege victory required'];
    if (trace.terminalPayload) gates.push(...validateScorePayload(trace.terminalPayload).errors);
    else if (!options.continueEndless) gates.push('Finished run has no terminal payload');
    writeFileSync(`${out}/${options.label}.json`, JSON.stringify(trace, null, 2)); failures[options.label] = gates;
  }
  writeFileSync(`${out}/summary.json`, JSON.stringify(failures, null, 2));
  expect(Object.values(failures).flat(), JSON.stringify(failures)).toEqual([]);
}, 600000);
```

Exact command: `rtk proxy powershell -NoProfile -Command '$env:BALANCE_SIM="1"; npx vitest run artifacts/audit-fixes/balance/report.test.ts --silent=false'`.
Expected: nine real gameplay traces, summary with every list empty; all completed
traces carry validated era-3 payloads. A wave-40 survivor is a playable checkpoint,
not a terminal result. Do not force a loss or extend/change the reference strategy.

For siege-failed and endless-defeat validation use **labeled seeded rule fixtures**,
not falsely claimed natural balance traces. Extend scene-siege.test.ts's existing
atWave/advanceSiege fixtures with current resultFixture-based counters, real
handleLeak/finishRun, and validateScorePayload on the scene-produced result. These
are terminal rule integration tests under the final configuration. Their exact
body is below; write resulting payloads only in the opt-in report invocation to
`terminal-rule-siege-failed.json` / `terminal-rule-endless-defeat.json` with
`evidenceKind: 'seeded terminal rule integration, not natural play'`.

```ts
it.each(['siege-failed', 'endless-defeat'] as const)('validates the final %s scene-produced payload', kind => {
  const { run, loose } = sceneFixture();
  const progress = kind === 'siege-failed'
    ? { highestWave: 10, wavesCompleted: 9, outcome: 'siege-failed' as const, siegeBossesDefeated: 0 }
    : { highestWave: 31, wavesCompleted: 30, outcome: 'defeat' as const, siegeBossesDefeated: 7 };
  const before = resultFixture(progress, kind === 'siege-failed' ? 15 : 0);
  if (kind === 'siege-failed') atWave(run, 10);
  else { run.siege = advanceSiege(30); run.chooseVictory('continue'); run.siege.startWave(31);
    run.wave = 31; run.wavesCompleted = 30; run.waveActive = true; }
  loose.enemiesKilled = before.enemiesKilled; loose.bossesKilled = before.bossesKilled;
  // Derive elite kills from buildWave/ENEMIES for the actual completed-wave fixture.
  loose.elitesKilled = Array.from({ length: progress.wavesCompleted }, (_, i) => buildWave(i + 1).groups)
    .flat().filter(g => ENEMIES[g.enemyId].isElite).reduce((n, g) => n + g.count, 0);
  loose.runningDurationMs = before.gameDurationSeconds * 1000; run.gold = 0;
  const enemy = kind === 'siege-failed' ? warlord() : new Enemy('thornling', 1, 40, 8);
  run.lives = kind === 'siege-failed' ? 20 : enemy.livesLost;
  run.enemies = [enemy]; if (kind === 'siege-failed') run.scheduledBossIds.set(enemy.id, 10);
  run.handleLeak(enemy);
  expect(run.scene.start).toHaveBeenCalledTimes(1);
  const [key, data] = run.scene.start.mock.calls[0];
  const payload = key === 'Preload' ? data.data : data; // Task 4's LoadingRequest data
  expect(payload).toMatchObject(progress);
  expect(validateScorePayload(payload).errors).toEqual([]);
  if (process.env.BALANCE_SIM === '1') {
    mkdirSync('artifacts/audit-fixes/balance/traces', { recursive: true });
    writeFileSync(`artifacts/audit-fixes/balance/traces/terminal-rule-${kind}.json`,
      JSON.stringify({ evidenceKind: 'seeded terminal rule integration, not natural play', terminalPayload: payload }, null, 2));
  }
});
```

Add imports from progressionResult, validation, WaveSystem, enemies and node:fs;
run alongside the report: `rtk proxy powershell -NoProfile -Command '$env:BALANCE_SIM="1"; npx vitest run artifacts/audit-fixes/balance/report.test.ts tests/scene-siege.test.ts --silent=false'`.
Expected: report and terminal cases pass; fixture payload files exist and validate.
Natural Hard defeat remains the browser producer for storage/retry/defeat-art tests.

## Appendix D — Failure/claim and double-click tests (Tasks 8/9)

Add imports expect/it/vi, repository/service types, resultFixture, and submitScore
(mock only the last for service tests). Reuse serialLock from Task 8. Concrete
fixtures and tests in score-retry.test.ts:

```ts
const progress = { highestWave: 30, wavesCompleted: 30, outcome: 'victory' as const, siegeBossesDefeated: 7 };
const payload = (id: string) => resultFixture(progress, 10, { runId: id });
function memoryStore() {
  const bytes = new Map<string, string>();
  const store = { getItem: (k: string) => bytes.get(k) ?? null,
    setItem: (k: string, v: string) => { bytes.set(k, v); }, removeItem: (k: string) => { bytes.delete(k); } };
  return { bytes, store };
}
it.each(['{broken', 'null', '[]', JSON.stringify({ version: 2 }), 'x'.repeat(4097)])('preserves protected bytes %s', async raw => {
  const { bytes, store } = memoryStore(); bytes.set(SCORE_RETRY_KEY, raw);
  const repo = new ScoreRetryRepository(store, serialLock());
  expect((await repo.view()).status).toBe('unreadable');
  const next = await repo.stage(payload('retry-protected-0001'));
  expect(next.persisted).toBe(false); expect(next.warning).toBeTruthy();
  await repo.settle('retry-protected-0001'); expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
});
it.each(['read', 'write', 'lock', 'no-lock', 'no-store'] as const)('falls back safely on %s failure', async failure => {
  const { store, bytes } = memoryStore(), before = JSON.stringify({ version: 2 });
  bytes.set(SCORE_RETRY_KEY, before);
  if (failure === 'read') store.getItem = () => { throw new Error('denied read'); };
  if (failure === 'write') { bytes.clear(); store.setItem = () => { throw new Error('quota'); }; }
  const lock: RetryLock | null = failure === 'no-lock' ? null : failure === 'lock'
    ? async () => { throw new Error('denied lock'); } : serialLock();
  const repo = new ScoreRetryRepository(failure === 'no-store' ? null : store, lock);
  const staged = await repo.stage(payload('retry-failure-0001'));
  expect(staged).toMatchObject({ status: 'ready', persisted: false }); expect(staged.warning).toBeTruthy();
  expect(staged.record?.payload.runId).toBe('retry-failure-0001');
  if (failure !== 'write') expect(bytes.get(SCORE_RETRY_KEY)).toBe(before);
});
it('retains a matching saved record when removal fails', async () => {
  const { store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
  await repo.stage(payload('retry-remove-0001')); store.removeItem = () => { throw new Error('denied remove'); };
  const view = await repo.settle('retry-remove-0001');
  expect(view.record?.payload.runId).toBe('retry-remove-0001'); expect(view.persisted).toBe(true); expect(view.warning).toBeTruthy();
});
it('claims a current snapshot atomically and rejects a stale displayed retry without overwriting', async () => {
  const { store, bytes } = memoryStore(), lock = serialLock();
  const a = new ScoreRetryRepository(store, lock), b = new ScoreRetryRepository(store, lock);
  const first = (await a.stage(payload('retry-stale-A-0001'))).record!;
  await b.stage(payload('retry-newer-B-0001')); const raw = bytes.get(SCORE_RETRY_KEY);
  const claim = await a.claimRetry(first);
  expect(claim.matched).toBe(false); expect(claim.view.record?.payload.runId).toBe('retry-newer-B-0001');
  expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
});
it('copies the caller, reloads unknown outcomes and preserves retry timestamp/bytes', async () => {
  const { store, bytes } = memoryStore(), lock = serialLock();
  const repo = new ScoreRetryRepository(store, lock), input = payload('retry-immutable-0001');
  const staged = await repo.stage(input); input.playerName = 'Changed';
  const raw = bytes.get(SCORE_RETRY_KEY), reloaded = new ScoreRetryRepository(store, lock);
  expect((await reloaded.view()).record?.payload.playerName).toBe('TestWarden');
  expect((await reloaded.claimRetry(staged.record!)).matched).toBe(true);
  expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw); expect(Object.isFrozen(staged.record?.payload)).toBe(true);
});
```

In score-submission.test.ts add this no-network stale retry case and parameterized
failure body (same payload/memoryStore fixtures); retain success/duplicate/late
settlement tests described in Task 8 with actual repository calls.

```ts
it('does not POST an obsolete retry', async () => {
  const { store } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
  const first = (await repo.stage(payload('retry-send-A-0001'))).record!;
  await repo.stage(payload('retry-send-B-0001')); vi.mocked(submitScore).mockClear();
  const completed = await submitRetainedScore(first.payload, repo, first);
  expect(completed.result.ok).toBe(false); expect(completed.result.error).toContain('changed');
  expect(completed.retry.record?.payload.runId).toBe('retry-send-B-0001'); expect(submitScore).not.toHaveBeenCalled();
});
it.each(['429', '503', 'offline', 'timeout'])('retains identical retry after %s', async error => {
  const { store, bytes } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
  const first = (await repo.stage(payload('retry-network-0001'))).record!, raw = bytes.get(SCORE_RETRY_KEY);
  vi.mocked(submitScore).mockImplementation(async sent => {
    expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw); expect(sent).toEqual(first.payload); return { ok: false, error };
  });
  const completed = await submitRetainedScore(first.payload, repo, first);
  expect(completed.retry.persisted).toBe(true); expect(bytes.get(SCORE_RETRY_KEY)).toBe(raw);
  expect(completed.attempted).toEqual(first);
});
```

MainMenu exposes no new public gameplay API. In screens.test.ts's structural cast,
invoke its actual retrySavedScore twice while the real repository lock is held:

```ts
it('guards repeated menu retry clicks synchronously while repository claim awaits a lock', async () => {
  const { store } = memoryStore(), lock = serialLock(), repo = new ScoreRetryRepository(store, lock);
  const saved = (await repo.stage(payload('retry-doubleclick-0001'))).record!;
  let release!: () => void;
  const held = lock(() => new Promise<void>(r => { release = r; }));
  await Promise.resolve();
  screenMocks.scoreRetryRepository = repo; // getter-based mock export, not module reassignment
  screenMocks.submitRetainedScore.mockImplementation((p, r, expected) => realSubmitRetainedScore(p, r, expected));
  const scene = new MainMenuScene(); scene.create();
  const menu = scene as unknown as { retrySavedScore(record: SavedSubmission): Promise<void> };
  vi.mocked(submitScore).mockResolvedValue({ ok: true, id: 1 }); vi.mocked(submitScore).mockClear();
  const one = menu.retrySavedScore(saved), two = menu.retrySavedScore(saved);
  await Promise.resolve(); expect(submitScore).not.toHaveBeenCalled();
  release(); await held; await Promise.all([one, two]); expect(submitScore).toHaveBeenCalledTimes(1);
});
```

The mocked ScoreRetry export uses a getter for screenMocks.scoreRetryRepository
and delegates to the original service using importOriginal; keep its pure class
real. Use the existing fake display infrastructure for the disabled held action.
Store completed.attempted in results after its first explicit attempt, regardless
of which run is in completed.retry. Pass the owned attempt on every subsequent
Retry; clear it only on new run init. A stale result retry gets the same replacement
message and no POST as the menu test. Add this real-service scene regression:

```ts
it('keeps A attempt identity after B replaces it and refuses a stale results retry', async () => {
  const { store, bytes } = memoryStore(), repo = new ScoreRetryRepository(store, serialLock());
  screenMocks.scoreRetryRepository = repo;
  screenMocks.submitRetainedScore.mockImplementation((p, r, expected) => realSubmitRetainedScore(p, r, expected));
  let failA!: (result: SubmitScoreResult) => void;
  vi.mocked(submitScore).mockClear();
  vi.mocked(submitScore).mockImplementation(() => new Promise(resolve => { failA = resolve; }));
  const first = payload('retry-result-A-0001'), second = payload('retry-result-B-0001');
  const scene = new GameOverScene(); scene.create({ ...gameOverData(first.runId), ...first });
  press('Submit Score');
  for (let i = 0; i < 20 && !failA; i++) await Promise.resolve();
  expect(submitScore).toHaveBeenCalledTimes(1);
  const stagedA = JSON.parse(bytes.get(SCORE_RETRY_KEY)!);
  await repo.stage(second); const rawB = bytes.get(SCORE_RETRY_KEY);
  failA({ ok: false, error: 'offline' });
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect((scene as unknown as { scoreAttempt: SavedSubmission }).scoreAttempt).toEqual(stagedA);
  press('Submit Score'); // existing failure state keeps the same button label
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(submitScore).toHaveBeenCalledTimes(1); expect(bytes.get(SCORE_RETRY_KEY)).toBe(rawB);
  expect(screenMocks.displays.some(d => String(d.currentText || d.initialText).includes('newer attempt'))).toBe(true);
});
```

## Appendix E — Executable local API/browser checks (Task 11)

Append inside api.cjs's existing async body, before rate-limit saturation. These
two files are labeled rule fixtures from Appendix C, not natural game traces.

```js
for (const kind of ['siege-failed', 'endless-defeat']) {
  const fixture = JSON.parse(fs.readFileSync(`artifacts/audit-fixes/balance/traces/terminal-rule-${kind}.json`, 'utf8'));
  assert.equal(fixture.evidenceKind, 'seeded terminal rule integration, not natural play');
  assert.equal((await post({ ...fixture.terminalPayload, runId: crypto.randomUUID() })).status, 201);
}
assert.equal((await post({ ...payload, runId: crypto.randomUUID(), wavesCompleted: 31 })).status, 400);
const oversized = await fetch(base + '/api/scores', { method: 'POST',
  headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.13' }, body: 'x'.repeat(4097) });
assert.equal(oversized.status, 413);
```

Exact commands, after the services in Task 11 Step 2 are ready:
`rtk proxy node artifacts/audit-fixes/api.cjs` (exit 0, api.json confirms 201/409/era3/native429);
`rtk proxy npx wrangler d1 execute aetherhold_scores --local --persist-to .scratch/audit-fixes-d1 --command "SELECT run_id,score_version FROM scores WHERE run_id='audit-legacy-row-0001'"`
(one untouched era-2 row); `rtk proxy node artifacts/audit-fixes/browser.cjs`
(exit 0, browser.json has every case passed; failures write logs and exit nonzero).

browser.cjs uses point/click from Task 11 Step 4 plus this complete runner skeleton
and case bodies. Source manifest membership is read from a generated JSON export
of Task 4's actual manifest (`asset-manifest.json`, via a small Vitest
writer), so expected paths do not drift from current source. The writer's body is
`writeFileSync('artifacts/audit-fixes/asset-manifest.json', JSON.stringify(STAGE_ASSETS));`
inside an opt-in `it.runIf(process.env.BALANCE_SIM === '1')` with its actual import.
Add that writer to Appendix C's report command. Its expected stage sets are also
pinned separately by Task 4 tests, so using the manifest here does not excuse a
wrong allocation.

```js
const { chromium } = require('C:/Users/ljour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs'), assert = require('node:assert/strict');
const base = 'http://127.0.0.1:5191', out = 'artifacts/audit-fixes';
const sizes = [[1440,900],[1280,720],[1024,768],[844,390],[390,844],[360,640]];
const manifest = JSON.parse(fs.readFileSync(`${out}/asset-manifest.json`, 'utf8'));
const paths = stage => manifest[stage].map(a => a.path).sort();
const retryKey = 'aetherhold-score-retry-v1';
async function active(page, key) {
  await page.waitForFunction(key => window.__auditGame?.scene.isActive(key), key, { timeout: 60000 });
}
async function state(page) {
  return page.evaluate(() => {
    const s = window.__auditGame.scene.getScene('Game');
    return { id: s.runId, time: s.gameTimeMs, debt: s.simulationClock.pendingMs, name: s.playerName,
      difficulty: s.difficultyId, wave: s.wave, active: s.waveActive, paused: s.isRunBlocked(),
      selected: s.selectedTower?.id, target: s.vault.target, auto: s.auto.enabled, remaining: s.auto.remainingMs };
  });
}
async function start(page, difficulty = 'Medium', name = 'Jos\u00e9 A.') {
  await click(page, 'Play'); await active(page, 'Difficulty');
  const input = page.locator('input[aria-label^="Defender name"]'); await input.fill(name);
  // Difficulty cards expose interactive bounds; mouse input chooses the card.
  if (page.viewportSize().width < 768) {
    const selected = await page.evaluate(() => window.__auditGame.scene.getScene('Difficulty').selectedDiff);
    if (selected !== difficulty.toLowerCase()) await click(page, difficulty);
  } else {
  const card = await page.evaluate(label => {
    const s = window.__auditGame.scene.getScene('Difficulty');
    const displays = s.children.list.flatMap(x => x.list || [x]);
    const text = displays.find(x => typeof x.text === 'string' && x.text.toLowerCase() === label.toLowerCase());
    if (!text) return null; const b = text.getBounds(); return { x: b.centerX, y: b.centerY };
  }, difficulty);
  assert(card, `Missing difficulty ${difficulty}`); await page.mouse.click(card.x, card.y);
  }
  await click(page, 'Continue');
}
async function naturalDefeat(page) {
  await start(page, 'Hard'); await active(page, 'Game');
  await click(page, '1×'); await click(page, '2×');
  for (let wave = 1; wave <= 3; wave++) {
    if (await page.evaluate(() => window.__auditGame.scene.isActive('GameOver') || window.__auditGame.scene.isActive('Preload'))) break;
    await click(page, `Start Wave ${wave}`);
    await page.waitForFunction(() => {
      const g = window.__auditGame, s = g.scene.getScene('Game');
      return g.scene.isActive('GameOver') || g.scene.isActive('Preload') || !s.waveActive;
    }, null, { timeout: 180000 });
  }
  await active(page, 'GameOver');
  return page.evaluate(() => ({ ...window.__auditGame.scene.getScene('GameOver').payload }));
}
async function runCase(browser, label, viewport, body, init) {
  const context = await browser.newContext({ viewport }), page = await context.newPage();
  const log = { label, viewport, images: [], imageBytes: 0, menuImageBytes: null, posts: [], errors: [], failedRequests: [], expectedFailures: [], actions: [], passed: false };
  const imageReads = [];
  if (init) await context.addInitScript(init);
  page.on('pageerror', e => log.errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') {
    const location = msg.location().url;
    if (!(msg.text().startsWith('Failed to load resource') && log.expectedFailures.some(path => location.includes(path)))) log.errors.push(msg.text());
  } });
  page.on('requestfailed', req => { log.failedRequests.push({ url: req.url(), error: req.failure()?.errorText }); });
  page.on('response', response => {
    if (!response.url().includes('.webp') || !response.ok()) return;
    imageReads.push(response.body().then(body => { log.imageBytes += body.byteLength; })
      .catch(error => { log.errors.push(`Image body ${response.url()}: ${String(error)}`); }));
  });
  page.on('request', req => {
    if (req.url().includes('.webp')) log.images.push(new URL(req.url()).pathname);
    if (req.method() === 'POST') log.posts.push(JSON.parse(req.postData() || '{}'));
  });
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch(), source = await response.text();
    assert(source.includes('const game = new Phaser.Game(config);'));
    await route.fulfill({ response, body: source.replace('const game = new Phaser.Game(config);',
      'const game = new Phaser.Game(config); window.__auditGame = game;') });
  });
  try {
    await body(page, log, context, () => Promise.all(imageReads));
    await Promise.all(imageReads); assert.deepEqual(log.errors, []);
    assert(log.failedRequests.every(req => log.expectedFailures.some(path => req.url.includes(path))), JSON.stringify(log.failedRequests)); log.passed = true;
  } finally {
    await page.screenshot({ path: `${out}/${label}-${viewport.width}x${viewport.height}.png` }).catch(() => {});
    fs.writeFileSync(`${out}/${label}-${viewport.width}x${viewport.height}.json`, JSON.stringify(log, null, 2));
    await context.close();
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of sizes) {
      await runCase(browser, 'cold-staged', { width, height }, async (page, log, context, drainImages) => {
        await page.goto(base); await active(page, 'MainMenu');
        await drainImages();
        log.menuImageBytes = log.imageBytes;
        assert(log.menuImageBytes > 0 && log.menuImageBytes < 29626078, `Cold menu bytes: ${log.menuImageBytes}`);
        assert.deepEqual([...new Set(log.images)].sort(), paths('menu'));
        assert.equal(log.posts.length, 0);
        const menu = log.images.slice(); let release;
        const held = new Promise(r => { release = r; });
        await page.route('**/enemy_walk_atlas_nature-v2.webp', async route => { await held; await route.continue(); });
        await start(page); await active(page, 'Preload');
        assert.equal(await page.evaluate(() => window.__auditGame.scene.isActive('Game')), false);
        release(); await active(page, 'Game');
        assert.deepEqual([...new Set(log.images)].sort(), [...paths('menu'), ...paths('gameplay')].sort());
        assert.equal((await state(page)).name, 'Jos\u00e9 A.');
        await page.keyboard.press('P'); await click(page, 'Restart Run'); await active(page, 'Game');
        assert.equal(log.images.length, menu.length + paths('gameplay').length);
        assert.equal(log.posts.length, 0);
      });
    }
    await runCase(browser, 'asset-retry', { width: 390, height: 844 }, async (page, log) => {
      log.expectedFailures.push('enemy_walk_atlas_nature-v2.webp');
      let once = true; await page.route('**/enemy_walk_atlas_nature-v2.webp', route => {
        if (once) { once = false; return route.abort(); } return route.continue();
      });
      await page.goto(base); await active(page, 'MainMenu'); await start(page); await active(page, 'Preload');
      await page.waitForFunction(() => window.__auditGame.scene.getScene('Preload').state === 'failed');
      assert.equal(await page.evaluate(() => window.__auditGame.scene.isActive('Game')), false);
      await click(page, 'Retry'); await active(page, 'Game'); assert.equal(log.posts.length, 0);
    });
    await runCase(browser, 'cancel-stale-load', { width: 360, height: 640 }, async (page, log) => {
      let release; const held = new Promise(r => { release = r; });
      await page.route('**/enemy_walk_atlas_nature-v2.webp', async route => { await held; await route.continue(); });
      await page.goto(base); await active(page, 'MainMenu'); await start(page); await active(page, 'Preload');
      await click(page, 'Back to Keep'); release(); await active(page, 'MainMenu'); await page.waitForTimeout(1200);
      assert.equal(await page.evaluate(() => window.__auditGame.scene.isActive('Game')), false); assert.equal(log.posts.length, 0);
    });
    await runCase(browser, 'name-ime', { width: 390, height: 844 }, async (page, log) => {
      await page.goto(base); await active(page, 'MainMenu'); await click(page, 'Play'); await active(page, 'Difficulty');
      const input = page.locator('input[aria-label^="Defender name"]');
      await input.evaluate(el => { el.dispatchEvent(new CompositionEvent('compositionstart')); el.value = 'Jose\u0301 A.';
        el.dispatchEvent(new InputEvent('input', { isComposing: true })); });
      assert.equal(await input.inputValue(), 'Jose\u0301 A.');
      await input.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionend')));
      assert.equal(await input.inputValue(), 'Jos\u00e9 A.');
      await input.fill('a'.repeat(19) + '\u{10400}' + 'b'); assert.equal(await input.inputValue(), 'a'.repeat(19));
      await input.fill('Jos\u00e9 A.'); await input.press('Enter'); await active(page, 'Game');
      assert.equal((await state(page)).name, 'Jos\u00e9 A.'); assert.equal(log.posts.length, 0);
    });
    await runCase(browser, 'malformed-settings', { width: 1280, height: 720 }, async (page, log) => {
      await page.goto(base); await active(page, 'MainMenu'); await start(page); await active(page, 'Game');
      const s = await state(page); assert.equal(s.difficulty, 'medium'); assert.equal(log.posts.length, 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('aetherhold-settings-v1')).sfxVolume), .4);
    }, () => localStorage.setItem('aetherhold-settings-v1', JSON.stringify({ playerName: 42, difficulty: 'bad', gameSpeed: 9, sfxVolume: .4 })));
    // Additional concrete cases below are inserted here, inside the same browser try.
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
```

Before implementing, derive enemy atlas URL from manifest: use its actual url,
not the display key, in route globs. Derive input selector from its current
aria-label (desktop/phone share that label after Task 1). Use the actual `1×`
then `2×` controls, opening the current More sheet on phone if needed. These are locator
adaptations to actual product controls, not optional tests or simulated clicks.

Add this actual helper before the runner, used by the additional cases below:

```js
async function texts(page) {
  return page.evaluate(() => {
    const out = [];
    function visit(item) { if (!item || item.visible === false) return;
      if (typeof item.text === 'string') out.push(item.text); for (const child of item.list || []) visit(child); }
    for (const scene of window.__auditGame.scene.getScenes(true)) for (const item of scene.children.list) visit(item);
    return out.join('\n');
  });
}
async function waitText(page, fragment) {
  for (let i = 0; i < 600; i++) { if ((await texts(page)).includes(fragment)) return; await page.waitForTimeout(100); }
  throw new Error(`Missing visible text ${fragment}`);
}
async function saved(page) { return page.evaluate(key => localStorage.getItem(key), retryKey); }
async function retryFromMenu(page) {
  await click(page, 'Main Menu'); await active(page, 'MainMenu'); await page.reload(); await active(page, 'MainMenu');
  await click(page, 'Saved Score'); await waitText(page, 'Retry Submission');
}
```

Insert these bodies at the marked location in the runner. Assertions operate on
the real game/Worker; only fault injection and explicitly labeled QA setup mutate
the test environment. All native actions remain mouse/keyboard events.

```js
    for (const lostResponse of [false, true]) {
      await runCase(browser, lostResponse ? 'accepted-response-lost' : 'offline-reload', { width: 1280, height: 720 }, async (page, log) => {
        log.expectedFailures.push('/api/scores');
        await page.goto(base); await active(page, 'MainMenu'); const original = await naturalDefeat(page);
        let status;
        await page.route('**/api/scores', async route => {
          if (lostResponse) { const response = await route.fetch(); status = response.status(); assert.equal(status, 201); }
          await route.abort();
        });
        await click(page, 'Submit Score'); await waitText(page, 'Saved for manual retry');
        const retained = JSON.parse(await saved(page)); assert.deepEqual(retained.payload, original);
        assert.equal(log.posts.length, 1);
        await page.unroute('**/api/scores'); await retryFromMenu(page);
        const response = page.waitForResponse(r => r.url().endsWith('/api/scores') && r.request().method() === 'POST');
        await click(page, 'Retry Submission'); const retried = await response;
        assert.equal(retried.status(), lostResponse ? 409 : 201);
        await waitText(page, lostResponse ? 'already recorded' : 'Score saved');
        assert.equal(await saved(page), null); assert.equal(log.posts.length, 2);
        assert.deepEqual(log.posts[0], log.posts[1]);
        const board = await (await page.request.get('http://127.0.0.1:8877/api/leaderboard?limit=100')).json();
        assert.equal(board.scores.filter(row => row.runId === original.runId).length, 1);
        assert.equal(board.scores.find(row => row.runId === original.runId).playerName, original.playerName);
      });
    }
    await runCase(browser, 'defeat-art-retry', { width: 1280, height: 720 }, async (page, log) => {
      log.expectedFailures.push('ancient-border-keep-defeated-v1.webp');
      let once = true;
      await page.route('**/ancient-border-keep-defeated-v1.webp', route => {
        if (once) { once = false; return route.abort(); } return route.continue();
      });
      await page.goto(base); await active(page, 'MainMenu'); await start(page, 'Hard'); await active(page, 'Game');
      await click(page, '1×'); await click(page, '2×');
      for (let wave = 1; wave <= 3; wave++) {
        await click(page, `Start Wave ${wave}`);
        await page.waitForFunction(() => window.__auditGame.scene.isActive('Preload') || !window.__auditGame.scene.getScene('Game').waveActive, null, { timeout: 180000 });
        if (await page.evaluate(() => window.__auditGame.scene.isActive('Preload'))) break;
      }
      await active(page, 'Preload');
      await page.waitForFunction(() => window.__auditGame.scene.getScene('Preload').state === 'failed');
      const terminal = await page.evaluate(() => ({ ...window.__auditGame.scene.getScene('Preload').request.data }));
      assert.equal(terminal.remainingLives, 0); assert.equal(log.posts.length, 0);
      await click(page, 'Retry'); await active(page, 'GameOver');
      const result = await page.evaluate(() => ({ ...window.__auditGame.scene.getScene('GameOver').payload }));
      for (const key of Object.keys(result)) assert.deepEqual(result[key], terminal[key]);
      assert.equal(await page.evaluate(() => window.__auditGame.scene.isActive('Game')), false);
      await click(page, 'Play Again'); await active(page, 'Game'); assert.notEqual((await state(page)).id, terminal.runId);
      assert((await state(page)).debt < 1000 / 60); assert.equal((await state(page)).auto, false); assert.equal(log.posts.length, 0);
    });
    for (const kind of ['denied', 'future', 'malformed']) {
      await runCase(browser, `storage-${kind}`, { width: 1280, height: 720 }, async (page, log) => {
        log.expectedFailures.push('/api/scores');
        await page.goto(base); await active(page, 'MainMenu'); const before = await saved(page);
        if (kind !== 'denied') assert((await texts(page)).includes('storage'));
        const original = await naturalDefeat(page); await page.route('**/api/scores', route => route.abort());
        await click(page, 'Submit Score'); await waitText(page, 'session only');
        assert.equal(log.posts.length, 1); assert.deepEqual(log.posts[0], original);
        assert.equal(await saved(page), before);
        await click(page, 'Main Menu'); await active(page, 'MainMenu'); assert.equal(log.posts.length, 1);
      }, kind === 'denied' ? () => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) { if (key === 'aetherhold-score-retry-v1') throw new DOMException('denied', 'SecurityError'); return original.call(this, key, value); };
      } : kind === 'future' ? () => localStorage.setItem('aetherhold-score-retry-v1', JSON.stringify({ version: 2, preserve: 'future bytes' }))
        : () => localStorage.setItem('aetherhold-score-retry-v1', '{broken'));
    }
    await runCase(browser, 'cross-tab-late-success', { width: 1280, height: 720 }, async (a, log, context) => {
      await a.goto(base); await active(a, 'MainMenu'); const first = await naturalDefeat(a);
      let release, accepted; const held = new Promise(r => { release = r; });
      await a.route('**/api/scores', async route => { const response = await route.fetch(); accepted = response.status(); await held; await route.fulfill({ response }); });
      await click(a, 'Submit Score');
      await a.waitForFunction(key => !!localStorage.getItem(key), retryKey);
      await click(a, 'Main Menu'); await active(a, 'MainMenu');
      const b = await context.newPage();
      // Reuse the same labeled dev-source route on tab B; context shares localStorage/Web Locks.
      await b.route('**/src/main.ts*', async route => { const response = await route.fetch(); await route.fulfill({ response,
        body: (await response.text()).replace('const game = new Phaser.Game(config);', 'const game = new Phaser.Game(config); window.__auditGame = game;') }); });
      await b.goto(base); await active(b, 'MainMenu'); const second = await naturalDefeat(b);
      await b.route('**/api/scores', route => route.abort());
      await waitText(b, 'replaces'); await click(b, 'Submit Score'); await waitText(b, 'Saved for manual retry');
      const bytes = await saved(b); assert.equal(JSON.parse(bytes).payload.runId, second.runId);
      release(); await a.waitForTimeout(600); assert.equal(accepted, 201);
      assert.equal(await saved(a), bytes); assert.notEqual(first.runId, second.runId);
      assert.equal(await a.evaluate(() => window.__auditGame.scene.isActive('MainMenu')), true);
      await b.close();
    });
    for (const [width, height] of sizes) {
      for (const qa of ['evolution', 'mastery']) {
        await runCase(browser, `preview-${qa}`, { width, height }, async (page, log) => {
          await page.goto(`${base}/?qa=${qa}`); await active(page, 'Game');
          // Labeled QA setup: retain real reducer/combat, put the selected evolution at rank 0.
          await page.evaluate(qa => { const s = window.__auditGame.scene.getScene('Game'), t = s.selectedTower;
            if (qa === 'evolution') t.progression = { ...t.progression, branchId: 'marksman', rank: 0 };
            s.gold = 1000000; s.refreshInfoPanel(); s.sheetKind = s.layout.inspector ? 'evolve' : 'tower'; s.drawSheet();
          }, qa);
          const model = await page.evaluate(async () => {
            const { towerProgressionView, formatStat } = await import('/src/game/ui/progressionView.ts');
            const s = window.__auditGame.scene.getScene('Game'), t = s.selectedTower, view = towerProgressionView(t, s.purchaseContext());
            const action = view.actions.find(a => a.intent.kind === (t.progression.rank < 3 ? 'evolution-rank' : 'mastery'));
            return { before: t.stats, next: action.nextStats, action: action.label, revision: t.progression.revision,
              formatted: ['damage', 'range', 'attackInterval'].map(key => [formatStat(key, view.stats[key]), formatStat(key, action.nextStats[key])]) };
          });
          const visible = await texts(page); assert(model.next);
          for (const [before, next] of model.formatted) assert(visible.includes(before) && visible.includes(next));
          const p = await point(page, model.action); if (p) {
            await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x, p.y - 45, { steps: 5 }); await page.mouse.up();
            assert.equal(await page.evaluate(() => window.__auditGame.scene.getScene('Game').selectedTower.progression.revision), model.revision);
          }
          await click(page, model.action);
          const after = await page.evaluate(() => ({ ...window.__auditGame.scene.getScene('Game').selectedTower.stats }));
          assert.deepEqual(after, model.next); assert.equal(log.posts.length, 0);
          // Test disabled state with the same next-stat preview still visible.
          await page.evaluate(() => { const s = window.__auditGame.scene.getScene('Game'); s.gold = 0; s.refreshInfoPanel(); s.drawSheet(); });
          assert((await texts(page)).includes('Not enough gold'));
        });
      }
    }
    await runCase(browser, 'auto-pause-rotate', { width: 390, height: 844 }, async (page, log) => {
      await page.goto(`${base}/?qa=evolution`); await active(page, 'Game');
      await page.keyboard.press('A'); assert.equal((await state(page)).auto, true);
      await page.waitForFunction(() => window.__auditGame.scene.getScene('Game').auto.remainingMs !== null);
      const countdown = await state(page); await page.waitForTimeout(2100); const counted = await state(page);
      assert(countdown.remaining - counted.remaining > 1600 && countdown.remaining - counted.remaining < 2600);
      await page.keyboard.press('P'); const before = await state(page); await page.waitForTimeout(1200);
      const during = await state(page); assert.equal(during.time, before.time); assert.equal(during.debt, before.debt);
      assert.equal(during.remaining, before.remaining);
      await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(200);
      const rotated = await state(page); assert.equal(rotated.id, before.id); assert.equal(rotated.selected, before.selected); assert.deepEqual(rotated.target, before.target);
      await click(page, 'Resume');
      // Visibility signal injection is labeled integration evidence, not physical background measurement.
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      const hidden = await state(page); assert(hidden.paused); await page.waitForTimeout(600); assert.equal((await state(page)).time, hidden.time);
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
      assert((await state(page)).paused); await click(page, 'Resume'); assert.equal(log.posts.length, 0);
    });
    for (const choice of ['Finish Run', 'Continue Endless']) {
      await runCase(browser, choice.startsWith('Finish') ? 'victory-finish' : 'victory-endless', { width: 844, height: 390 }, async (page, log) => {
        await page.goto(`${base}/?qa=victory`); await active(page, 'Game');
        // Resolve only through native available reward controls before the decision.
        for (let i = 0; i < 10 && await page.evaluate(() => window.__auditGame.scene.getScene('Game').vault.pending.length > 0); i++) {
          await click(page, 'Discard new');
        }
        const before = await state(page); await click(page, choice);
        if (choice === 'Finish Run') { await active(page, 'GameOver'); assert.equal(await page.evaluate(() => window.__auditGame.scene.getScene('GameOver').payload.outcome), 'victory'); }
        else { const after = await state(page); assert.equal(after.id, before.id);
          assert.equal(await page.evaluate(() => window.__auditGame.scene.getScene('Game').siege.phase), 'endless'); }
        assert.equal(log.posts.length, 0);
      });
    }
```

The unknown outer version case above is unreadable protected data, so its expected
visible phrase is the storage warning, not an earlier-era message. Add a separate
recognized era-2 SavedSubmission case using the actual archived era-2 trace from
`artifacts/progression/balance/traces/medium-starter-1.json`, with a timestamp and
outer version 1, in a pre-boot init script. Assert visible earlier-era text, disabled
Retry and byte equality, with zero POSTs. The concrete body is:

```js
const oldPayload = JSON.parse(fs.readFileSync('artifacts/audit-fixes/era-2-payload.json', 'utf8'));
const oldBytes = JSON.stringify({ version: 1, attemptedAt: '2026-10-09T00:00:00.000Z', payload: oldPayload });
await runCase(browser, 'retired-retry', { width: 360, height: 640 }, async (page, log) => {
  await page.goto(base); await active(page, 'MainMenu');
  await page.evaluate(bytes => localStorage.setItem('aetherhold-score-retry-v1', bytes), oldBytes);
  await page.reload(); await active(page, 'MainMenu'); await click(page, 'Saved Score');
  await waitText(page, 'earlier leaderboard era'); await click(page, 'Retry Submission'); await page.waitForTimeout(300);
  assert.equal(await saved(page), oldBytes); assert.equal(log.posts.length, 0);
});
```

Generate era-2-payload.json as a labeled structural repository fixture in
score-retry.test.ts. No historical score-envelope claim is made: retired stored
records receive structural/result validation, not current-era envelope conversion.
Exact opt-in body:

```ts
it.runIf(process.env.BALANCE_SIM === '1')('writes a retired structural compatibility fixture', () => {
  mkdirSync('artifacts/audit-fixes', { recursive: true });
  writeFileSync('artifacts/audit-fixes/era-2-payload.json', JSON.stringify({
    ...payload('retry-era-two-0001'), scoreVersion: 2, gameVersion: '0.2.0'
  }, null, 2));
});
```

Include tests/score-retry.test.ts in Appendix C's opt-in report command; expected
fixture file exists. This is stored-record compatibility evidence only.

For the unmodified built Worker case, use a separate context without the main.ts
route/injected Game. Native Play/name/Continue/Pause/Resume/Restart uses verified
rendered control coordinates from the development cases. The body is:

```js
const native = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await native.newPage(), policyErrors = [];
page.on('pageerror', e => policyErrors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') policyErrors.push(msg.text()); });
await page.goto('http://127.0.0.1:8877'); await page.locator('canvas').waitFor();
await page.waitForFunction(() => document.fonts.status === 'loaded');
// native-controls.json is written from point() before clicks in the 1280x720 dev case.
const controls = JSON.parse(fs.readFileSync(`${out}/native-controls.json`, 'utf8'));
for (const label of ['Play', 'Continue', 'Pause', 'Resume', 'Pause', 'Restart Run']) {
  if (label === 'Continue') await page.locator('input[aria-label^="Defender name"]').fill('Native Policy');
  const p = controls[label]; assert(p); await page.mouse.click(p.x, p.y); await page.waitForTimeout(500);
}
assert.equal(await page.evaluate(() => '__auditGame' in window), false);
assert.deepEqual(policyErrors, []);
const html = await page.request.get('http://127.0.0.1:8877');
for (const header of ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy']) assert(html.headers()[header]);
const source = await html.text(), bundle = source.match(/src="([^"]+\.js)"/)[1];
const js = await page.request.get(new URL(bundle, 'http://127.0.0.1:8877').href); assert.equal(js.status(), 200);
assert(js.headers()['content-security-policy']);
await native.close();
```

Write native-controls.json during the instrumented case from actual point results
after each corresponding state is active; repeat Pause to capture its steady
in-game position. Do not read Phaser private state in this unmodified context.
The body verifies boot/font/canvas/rendered-control policy. Task 12's live checker
does bundle equality/health/headers with the production origin and same native
control smoke. Record any unavailable physical audio/device checks explicitly.

Capture those coordinates using this additional dev case before the native body:

```js
await runCase(browser, 'native-coordinate-source', { width: 1280, height: 720 }, async (page, log) => {
  const coordinates = {}; await page.goto(base); await active(page, 'MainMenu');
  coordinates.Play = await point(page, 'Play'); await click(page, 'Play'); await active(page, 'Difficulty');
  await page.locator('input[aria-label^="Defender name"]').fill('Native Policy');
  coordinates.Continue = await point(page, 'Continue'); await click(page, 'Continue'); await active(page, 'Game');
  coordinates.Pause = await point(page, 'Pause'); await click(page, 'Pause');
  coordinates.Resume = await point(page, 'Resume'); coordinates['Restart Run'] = await point(page, 'Restart Run');
  assert(Object.values(coordinates).every(Boolean));
  fs.writeFileSync(`${out}/native-controls.json`, JSON.stringify(coordinates, null, 2)); assert.equal(log.posts.length, 0);
});
```

Finally, after each completed runCase write an aggregate browser.json with its
label/viewport/passed/errors and POST count; expected total includes every size
and both purchase/decision variants. Add `results.push(log)` in runCase's finally
before closing, then `fs.writeFileSync(..., JSON.stringify(results, null, 2))`.
Keep a failing assertion's passed:false evidence, and process exit nonzero; the
runner does not continue past a failure as if acceptance succeeded.

The main implements these dependent tasks sequentially under Native/inline execution
if chosen. A different user-selected method must keep these interfaces and ordering.
This plan is documentation until its cold review clears and the user approves its
execution; approved scope/spec alone does not authorize skipping that plan gate.

## Execution record (2026-10-09)

Tasks 1-10 are complete and committed; Task 11 is complete except the cold review and its follow-up; Task 12 is in progress.

| Task | Commit | Notes |
|---|---|---|
| 1-4 | `c84b90e`, `ea55ea8`, `ebacccb`, `98c80af` | Completed in the earlier session before it stopped at the Task 5 boundary |
| 5 | `0741ba1` | Rank-3 cost factor 8 and the x1.3 late-rank damage multiplier; nine recorded traces with empty gate lists |
| 6 | `af8664e` | Score era 3, `aetherhold-best-score-v3`, both legacy eras retained and labelled |
| 7 | `d7f94d1` | Native rate-limit binding, 503 on a missing binding, `public/_headers` |
| 8 | `2fbb04a` | Retained manual submission, Web Locks settlement, protected bytes |
| 9 | `5e6e951` | Results retry, menu Saved Score sheet, truthful offline messaging |
| 10 | `ac910f0` | `previewPurchaseStats` and current-to-next preview lines |
| 11 | `3f37eeb`, `2d2fbbd` | Evidence harness, report runner, two real defect fixes, SPEC.md and handoff docs; 34 browser cases pass |

Verification at the Task 11 gate: `npm run typecheck` clean, `npm test` 728 passed / 11 skipped / 0 failed, `npm run build` green (pre-existing large-bundle warning), isolated local Worker API evidence, and 34 browser cases with 0 failures. Full detail: `agent_docs/audit_fixes_2026-10-09.md`.

