import { afterEach, expect, it, vi } from 'vitest';
import { autoScene } from './helpers/autoScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
const previousMath = (Phaser as unknown as { Math?: unknown }).Math;
afterEach(() => { vi.restoreAllMocks(); const mock = Phaser as unknown as { Math?: unknown }; if (previousMath === undefined) delete mock.Math; else mock.Math = previousMath; });
function attackCount(fps: number, speed: number): number {
  const { run, loose } = autoScene();
  const tower = new Tower('longbow', 300, 300, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: 'volley', rank: 3 };
  run.towers = [tower]; run.battleCryUntil = Infinity; loose.speed = speed;
  run.enemies = [1, 2, 3].map(() => { const e = new Enemy('thornling', 1e9, 0, 8); e.x = 300; e.y = 300; return e; });
  const fire = vi.fn(); loose.fireProjectile = fire; loose.renderFrame = vi.fn();
  for (let i = 0; i < fps * 10; i++) run.update(i * 1000 / fps, 1000 / fps);
  for (let i = 0; i < 5; i++) run.update(10000, 0);
  return fire.mock.calls.length;
}
it.each([1, 2, 3])('keeps attack counts across FPS at speed %i', speed => {
  expect(attackCount(10, speed)).toBe(attackCount(60, speed));
  expect(attackCount(30, speed)).toBe(attackCount(60, speed));
});

import Phaser from 'phaser';
import { mulberry32 } from './helpers/simulationBot.ts';
import { SIMULATION_STEP_MS } from '../src/game/systems/SimulationClock.ts';
import { TOWERS } from '../src/game/config/towers.ts';
import { EVOLUTIONS } from '../src/game/config/evolutions.ts';
import { POWERUP_EFFECTS } from '../src/game/config/powerUps.ts';
it('keeps every legal attack interval longer than a tick, including Battle Tempo', () => {
  const rows = [...Object.values(TOWERS).flatMap(t => t.levels), ...Object.values(EVOLUTIONS).flatMap(e => e.stats)];
  for (const row of rows) expect(row.attackInterval * POWERUP_EFFECTS.tempo.intervalMultiplier * 1000).toBeGreaterThan(SIMULATION_STEP_MS);
});
function partitions(kind: '60' | '30' | '10' | 'irregular'): number[] {
  if (kind !== 'irregular') return Array(Number(kind) * 10).fill(1000 / Number(kind));
  const pattern = [3, 231, 17, 79, 5, 1100, 41], values: number[] = [];
  for (let total = 0, i = 0; total < 10000; i++) {
    const dt = Math.min(pattern[i % pattern.length], 10000 - total); values.push(dt); total += dt;
  }
  return values;
}
function realCombat(parts: number[], speed: number, seed: number, kind: 'volley' | 'chain' | 'ground' = 'volley') {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
  const math = Phaser as unknown as { Math?: { Vector2: unknown } };
  math.Math = { Vector2: class { constructor(public x: number, public y: number) {} } };
  const { run, loose } = autoScene();
  loose.renderFrame = vi.fn(); loose.presentReward = vi.fn();
  const tower = new Tower(kind === 'chain' ? 'tempest' : kind === 'ground' ? 'ember' : 'longbow', 300, 300, 0);
  tower.progression = { ...tower.progression, foundationLevel: 4, branchId: kind === 'chain' ? 'stormcaller' : kind === 'ground' ? 'flame-mortar' : 'volley', rank: 3 };
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
  for (const seed of [1, 2, 3]) for (const kind of ['volley', 'chain', 'ground'] as const) {
    const baseline = realCombat(partitions('60'), speed, seed, kind);
    expect(baseline.attacks).toBeGreaterThan(0); expect(baseline.kills).toBeGreaterThan(0); expect(baseline.gold).toBeGreaterThan(0);
    for (const partition of ['30', '10', 'irregular'] as const) expect(realCombat(partitions(partition), speed, seed, kind)).toEqual(baseline);
  }
});

it('retains debt while paused and applies new speed only to new playable delta', () => {
  const { run, loose } = autoScene(); loose.renderFrame = vi.fn();
  const clock = loose.simulationClock as { pendingMs: number };
  run.update(0, 2500); const debt = clock.pendingMs, time = run.gameTimeMs;
  loose.paused = true; loose.speed = 3; run.update(2000, 2000);
  expect(clock.pendingMs).toBe(debt); expect(run.gameTimeMs).toBe(time);
  loose.paused = false; run.update(2100, 100);
  for (let i = 0; i < 10; i++) run.update(2100, 0);
  expect(run.gameTimeMs).toBeCloseTo(2800); expect(loose.runningDurationMs).toBe(2600);
  expect(clock.pendingMs).toBeLessThan(SIMULATION_STEP_MS);
});
it('does not turn idle no-target time into an attack burst', () => {
  const { run, loose } = autoScene(); loose.renderFrame = vi.fn();
  run.towers = [new Tower('longbow', 300, 300, 0)]; loose.fireProjectile = vi.fn();
  run.update(0, 5000); for (let i = 0; i < 10; i++) run.update(5000, 0);
  const e = new Enemy('thornling', 1e9, 0, 8); e.x = e.y = 300; run.enemies = [e];
  run.update(5017, SIMULATION_STEP_MS); expect(loose.fireProjectile).toHaveBeenCalledTimes(1);
});
it('stops catch-up and Auto after a real last-life leak and resets the clock', () => {
  const { run, loose } = autoScene(); loose.renderFrame = vi.fn();
  const e = new Enemy('thornling', 1, 1, 8); e.waypointIndex = 1000;
  run.siege.startWave(1); run.wave = 1; run.waveActive = true; run.enemies = [e]; run.lives = e.livesLost;
  const tick = vi.spyOn(loose as any, 'simulateTick'), auto = vi.spyOn(run, 'tickAuto');
  run.update(0, 2500);
  expect(run.scene.start).toHaveBeenCalledTimes(1); expect(run.lives).toBe(0);
  expect(tick).toHaveBeenCalledTimes(1); expect(auto).not.toHaveBeenCalled();
  expect((loose.simulationClock as { pendingMs: number }).pendingMs).toBe(0);
});
it('keeps regeneration, freeze expiry and boss summon boundaries across irregular partitions', () => {
  function statusRun(parts: number[]) {
    const { run, loose } = autoScene(); loose.renderFrame = vi.fn(); loose.presentReward = vi.fn();
    const e = new Enemy('warlord', 1e6, 1, 150); e.hp = 500; e.regen = 1; e.frozenUntil = 3000;
    run.freezeUntil = 5000; run.enemies = [e]; run.wave = 20;
    for (const dt of [...parts, ...parts]) run.update(0, dt);
    for (let i = 0; i < 20; i++) run.update(0, 0);
    return { hp: e.hp, distance: e.distanceTraveled, summons: run.enemies.length - 1 };
  }
  const baseline = statusRun(partitions('60'));
  expect(baseline.hp).toBeCloseTo(520); expect(baseline.summons).toBeGreaterThan(0);
  for (const kind of ['30', '10', 'irregular'] as const) expect(statusRun(partitions(kind))).toEqual(baseline);
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
