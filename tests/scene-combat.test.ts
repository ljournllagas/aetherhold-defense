import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { Tower } from '../src/game/entities/Tower.ts';
import { Enemy } from '../src/game/entities/Enemy.ts';
import { SoundManager } from '../src/game/systems/SoundManager.ts';
import type { EvolutionCombat } from '../src/game/systems/EvolutionCombat.ts';
import type { BranchId, EvolutionRank, ShotSnapshot, TowerId } from '../src/shared/progression.ts';
import type { DamageType } from '../src/shared/types.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} }, Scenes: { Events: { SHUTDOWN: 'shutdown' } }, Scale: { Events: { RESIZE: 'resize' } } } }));
function anyStub(): any {
  const proxy: any = new Proxy(function () { return proxy; }, { get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
}
interface FlightLike { elapsedMs: number; durationMs: number; x1: number; y1: number; x2: number; y2: number; towerId: string; targetId: number; shot: ShotSnapshot; view: unknown; chainIndex: number; hit: Set<number>; }
interface Run {
  towers: Tower[]; enemies: Enemy[]; flights: FlightLike[]; gameTimeMs: number; gold: number; enemiesKilled: number; surgeUntil: number; evolutionCombat: EvolutionCombat;
  damageEnemy(e: Enemy, raw: number, type: DamageType, shot?: ShotSnapshot): number; updateFlights(deltaMs: number): void; processFieldTicks(): void; fireTowers(dt: number): void;
  fireProjectile: (...args: unknown[]) => void;
}
const PRESENTATION = ['updateHUD', 'floatText', 'floatTextForEnemy', 'impactAt', 'impactBurst', 'startDeathAnim', 'drawPowerupBar', 'presentReward', 'addEffect', 'drawTempestArc'];
function sceneFixture() {
  vi.spyOn(SoundManager, 'get').mockReturnValue(anyStub());
  const scene = new GameScene(); scene.init({ difficulty: 'medium' });
  const run = scene as unknown as Run, loose = scene as unknown as Record<string, unknown>;
  for (const name of PRESENTATION) loose[name] = () => {};
  loose.add = anyStub(); loose.world = (value: unknown) => value;
  return run;
}
function evolved(towerId: TowerId, branchId: BranchId | null, rank: EvolutionRank = 0): Tower {
  const t = new Tower(towerId, 0, 0, 0);
  t.progression = { ...t.progression, foundationLevel: 4, branchId, rank: branchId ? rank : null };
  return t;
}
const enemyAt = (x: number, y: number, hp = 100000) => { const e = new Enemy('thornling', hp, 50, 8); e.x = x; e.y = y; return e; };
const flightFor = (shot: ShotSnapshot, enemy: Enemy, chainIndex = 0, hit = new Set<number>()): FlightLike => ({ elapsedMs: 1, durationMs: 1, x1: 0, y1: 0, x2: enemy.x, y2: enemy.y, towerId: shot.towerId, targetId: enemy.id, shot, view: anyStub(), chainIndex, hit });
const neutral = { slowFactor: 0, frozen: false, stunned: false, vulnerability: 1 };
afterEach(() => vi.restoreAllMocks());

describe('scene combat', () => {
  it('routes damage through penetration once; relic damage stays neutral', () => {
    const run = sceneFixture(), owner = evolved('ember', 'siegebreaker'), e = enemyAt(0, 0); e.physicalArmor = 0.55;
    expect(run.damageEnemy(e, 100, 'physical', run.evolutionCombat.makeShot(owner, [owner], 1))).toBe(73);
    expect(run.damageEnemy(e, 100, 'physical')).toBe(45);
  });
  it('counts living primary impacts and freezes movement on the fifth Winterguard hit', () => {
    const run = sceneFixture(), frost = evolved('glacier', 'winterguard'), e = enemyAt(10, 10);
    run.towers = [frost]; run.enemies = [e];
    for (let n = 0; n < 5; n++) { run.flights.push(flightFor(run.evolutionCombat.makeShot(frost, run.towers, 1), e)); run.updateFlights(0); }
    expect(frost.counter.successes).toBe(5);
    const status = run.evolutionCombat.statuses(e.id, run.gameTimeMs);
    expect(status.frozen).toBe(true); expect(e.effectiveSpeed(run.gameTimeMs, 0, status)).toBe(0);
  });
  it('chains with x0.85 per jump and x0.75 per secondary impact without repeats', () => {
    const run = sceneFixture(), storm = evolved('tempest', 'stormcaller'), a = enemyAt(100, 100), b = enemyAt(150, 100);
    run.towers = [storm]; run.enemies = [a, b];
    const fire = vi.fn(); run.fireProjectile = fire;
    const damage = vi.spyOn(run, 'damageEnemy'), shot = run.evolutionCombat.makeShot(storm, [storm], 1);
    run.flights.push(flightFor(shot, a)); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(a, shot.rawDamage, 'elemental', shot);
    const [, , next, nextShot, chainIndex, hit] = fire.mock.calls[0] as [number, number, Enemy, ShotSnapshot, number, Set<number>];
    expect([next, chainIndex, nextShot.primary, hit.has(a.id)]).toEqual([b, 1, false, true]);
    expect(nextShot.rawDamage).toBeCloseTo(shot.rawDamage * 0.85);
    damage.mockClear();
    run.flights.push(flightFor(nextShot, b, 1, new Set([a.id]))); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(b, nextShot.rawDamage * 0.75, 'elemental', nextShot);
    expect(fire).toHaveBeenCalledTimes(1); expect(storm.counter.successes).toBe(1);
  });
  it('stops a Thunderlord chain after its third victim using the snapshot chain limit', () => {
    const run = sceneFixture(), lord = evolved('tempest', 'thunderlord');
    const [a, b, c, d] = [100, 150, 200, 250].map((x) => enemyAt(x, 100));
    run.towers = [lord]; run.enemies = [a, b, c, d];
    const fire = vi.fn(); run.fireProjectile = fire;
    const shot = run.evolutionCombat.makeShot(lord, [lord], 1);
    expect(shot.stats.chainCount).toBe(3);
    run.flights.push(flightFor({ ...shot, primary: false }, b, 1, new Set([a.id]))); run.updateFlights(0);
    expect(fire).toHaveBeenCalledTimes(1); expect(fire.mock.calls[0][2]).toBe(c);
    run.flights.push(flightFor({ ...shot, primary: false }, c, 2, new Set([a.id, b.id]))); run.updateFlights(0);
    expect(fire).toHaveBeenCalledTimes(1);
  });
  it('keeps the fired snapshot after a sale and creates fields only for a live owner', () => {
    const run = sceneFixture(), mortar = evolved('ember', 'flame-mortar'), e = enemyAt(300, 300);
    run.towers = [mortar]; run.enemies = [e];
    const shot = run.evolutionCombat.makeShot(mortar, run.towers, 1), damage = vi.spyOn(run, 'damageEnemy');
    run.towers = []; run.flights.push(flightFor(shot, e)); run.updateFlights(0);
    expect(damage).toHaveBeenCalledWith(e, shot.rawDamage, 'physical', shot);
    expect(run.evolutionCombat.activeFieldCount).toBe(0);
    run.towers = [mortar]; run.flights.push(flightFor(shot, e)); run.updateFlights(0);
    expect(run.evolutionCombat.activeFieldCount).toBe(1);
  });
  it('processes overlapping field ticks with one death reward and forgets the enemy', () => {
    const run = sceneFixture(), mortar = evolved('ember', 'flame-mortar'), e = enemyAt(0, 0, 1);
    run.enemies = [e];
    const shot = run.evolutionCombat.makeShot(mortar, [mortar], 1);
    run.evolutionCombat.addField(shot, 0, 0, 0); run.evolutionCombat.addField({ ...shot, ownerId: 99 }, 0, 0, 0);
    run.gameTimeMs = 500; const gold = run.gold;
    run.processFieldTicks();
    expect([run.enemiesKilled, e.alive, run.gold]).toEqual([1, false, gold + 8]);
    expect(run.evolutionCombat.statuses(e.id, 500)).toEqual(neutral);
  });
  it('fires Volley at three distinct enemies with one snapshot and surge applied once', () => {
    const run = sceneFixture(), volley = evolved('longbow', 'volley');
    run.towers = [volley];
    run.enemies = [1, 2, 3, 4].map((n) => { const e = enemyAt(n * 10, 0); e.distanceTraveled = n; return e; });
    const fire = vi.fn(); run.fireProjectile = fire; run.surgeUntil = run.gameTimeMs + 1000;
    run.fireTowers(0.016);
    expect(fire).toHaveBeenCalledTimes(3);
    expect(new Set(fire.mock.calls.map((c) => (c[2] as Enemy).id)).size).toBe(3);
    expect(fire.mock.calls[0][3]).toBe(fire.mock.calls[1][3]);
    expect((fire.mock.calls[0][3] as ShotSnapshot).rawDamage).toBe(Math.round(volley.stats.damage * 1.5));
  });
  it('lets statuses drive speed while Time Lock stays independent', () => {
    const e = new Enemy('thornling', 10, 100, 1);
    expect(e.effectiveSpeed(0, 0)).toBe(100);
    expect(e.effectiveSpeed(0, 0, { ...neutral, slowFactor: 0.3 })).toBeCloseTo(70);
    expect(e.effectiveSpeed(0, 0, { ...neutral, stunned: true })).toBe(0);
    expect(e.effectiveSpeed(0, 500, neutral)).toBe(0);
    e.slowUntil = 100; e.slowFactor = 0.5; expect(e.effectiveSpeed(0, 0)).toBe(50);
  });
});
