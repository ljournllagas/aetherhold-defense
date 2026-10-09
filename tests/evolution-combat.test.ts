import { describe, expect, it } from 'vitest';
import { EvolutionCombat, chainShot, nextChainTarget, volleyTargets } from '../src/game/systems/EvolutionCombat.ts';
import { effectiveStats, initialEvolution } from '../src/game/systems/EvolutionSystem.ts';
import type { CombatTower } from '../src/shared/progression.ts';
import { tower, victim } from './helpers/evolutionFixtures.ts';

const neutral = { slowFactor: 0, frozen: false, stunned: false, vulnerability: 1 };

describe('snapshots and Beacon auras', () => {
  it('snapshots damage, branch and aura at firing', () => {
    const ranger: CombatTower = { id: 1, towerId: 'longbow', x: 0, y: 0, counter: { successes: 0 }, progression: { ...initialEvolution('longbow'), foundationLevel: 4, branchId: 'marksman', rank: 0 } };
    const beacon: CombatTower = { id: 2, towerId: 'starfire', x: 10, y: 0, counter: { successes: 0 }, progression: { ...initialEvolution('starfire'), foundationLevel: 4, branchId: 'arcane-beacon', rank: 3 } };
    const engine = new EvolutionCombat(), shot = engine.makeShot(ranger, [ranger, beacon], 1.5);
    expect(shot.rawDamage).toBe(Math.round(effectiveStats('longbow', ranger.progression).damage * 1.3 * 1.5));
    expect(shot).toMatchObject({ ownerId: 1, towerId: 'longbow', branchId: 'marksman', primary: true });
    expect(shot.counter).toBe(ranger.counter);
    const before = structuredClone(shot);
    ranger.progression = { ...ranger.progression, rank: 3 }; engine.removeOwner(1);
    expect(shot).toEqual(before);
  });
  it('uses only the largest in-range Beacon of other towers, never recursively', () => {
    const engine = new EvolutionCombat(), owner = tower(null, 0, 1);
    const strong = { ...tower('arcane-beacon', 3, 2), x: 10 }, weak = { ...tower('arcane-beacon', 0, 3), x: 20 };
    const base = effectiveStats('longbow', owner.progression).damage;
    expect(engine.makeShot(owner, [owner, strong, weak], 1).rawDamage).toBe(Math.round(base * 1.3));
    expect(engine.makeShot(owner, [owner, { ...strong, x: 161 }, weak], 1).rawDamage).toBe(Math.round(base * 1.15));
    expect(engine.makeShot(owner, [owner, { ...strong, x: 161 }, { ...weak, x: 161 }], 1).rawDamage).toBe(base);
    const own = effectiveStats('starfire', strong.progression).damage;
    expect(engine.makeShot(strong, [strong], 1).rawDamage).toBe(own);
    expect(engine.makeShot(strong, [strong, weak], 1).rawDamage).toBe(Math.round(own * 1.15));
    expect(engine.makeShot(owner, [owner, strong], 1).stats.auraDamageMultiplier).toBe(1);
  });
});

describe('damage', () => {
  it.each([['siegebreaker', 'physical', 'physicalArmor'], ['spellbreaker', 'arcane', 'wardArmor']] as const)('penetrates only its own channel: %s', (branch, type, armor) => {
    const engine = new EvolutionCombat(), owner = tower(branch), target = victim();
    target[armor] = 0.55;
    expect(engine.damage(100, type, target, 0, engine.makeShot(owner, [owner], 1))).toBe(73);
    expect(engine.damage(100, type, target, 0)).toBe(45);
    const other = victim(2); other[armor === 'physicalArmor' ? 'wardArmor' : 'physicalArmor'] = 0.55;
    expect(engine.damage(100, type, other, 0, engine.makeShot(owner, [owner], 1))).toBe(100);
  });
  it('never damages dead targets and adds the Marksman boss bonus', () => {
    const engine = new EvolutionCombat(), dead = victim(); dead.alive = false;
    expect(engine.damage(100, 'physical', dead, 0)).toBe(0);
    const owner = tower('marksman'), boss = victim(2); boss.isBoss = true;
    expect(engine.damage(100, 'physical', boss, 0, engine.makeShot(owner, [owner], 1))).toBe(150);
  });
});

describe('targets and chains', () => {
  it('gives Volley distinct targets by mode with ID ties, only in range', () => {
    const v = tower('volley'), stats = effectiveStats(v.towerId, v.progression);
    expect(volleyTargets([victim(1), victim(2), victim(3), victim(4)], v, stats, 'first').map((t) => t.id)).toEqual([4, 3, 2]);
    expect(volleyTargets([victim(5), victim(6), victim(7)].map((t) => ({ ...t, distanceTraveled: 1 })), v, stats, 'first').map((t) => t.id)).toEqual([5, 6, 7]);
    expect(volleyTargets([victim(1), victim(9, 500, 0)], v, stats, 'first').map((t) => t.id)).toEqual([1]);
  });
  it('chains with x0.85 per jump, keeps the snapshot and never repeats a victim', () => {
    const engine = new EvolutionCombat(), owner = tower('stormcaller');
    const first = engine.makeShot(owner, [owner], 1.5), second = chainShot(first);
    expect(second.rawDamage).toBeCloseTo(first.rawDamage * 0.85);
    expect(second.primary).toBe(false); expect(second.counter).toBe(first.counter); expect(second.branchId).toBe(first.branchId);
    expect(nextChainTarget([victim(1), victim(2, 50), victim(3, 150)], { x: 0, y: 0 }, new Set([1]))?.id).toBe(2);
    expect(nextChainTarget([victim(2, 50), victim(3, 150)], { x: 0, y: 0 }, new Set([2]))).toBe(null);
  });
});

describe('statuses', () => {
  it.each([['winterguard', 'frozen', 500, 150], ['thunderlord', 'stunned', 350, 100]] as const)('uses fifth primaries and shared 1.5 s immunity: %s', (branch, status, normalMs, bossMs) => {
    const engine = new EvolutionCombat(), owner = tower(branch), target = victim(), shot = engine.makeShot(owner, [owner], 1);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 0);
    expect(engine.statuses(target.id, 0)[status]).toBe(true);
    expect(engine.statuses(target.id, normalMs)[status]).toBe(false);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 700);
    expect(engine.statuses(target.id, 700)[status]).toBe(false);
    for (let n = 0; n < 5; n++) engine.primaryHit(shot, target, 1501);
    expect(engine.statuses(target.id, 1501)[status]).toBe(true);
    const boss = victim(2); boss.isBoss = true; const other = tower(branch, 0, 2);
    for (let n = 0; n < 5; n++) engine.primaryHit(engine.makeShot(other, [other], 1), boss, 0);
    expect(engine.statuses(boss.id, bossMs)[status]).toBe(false);
  });
  it('counts only primary hits that land, letting a killing hit count without effects', () => {
    const engine = new EvolutionCombat(), owner = tower('winterguard'), shot = engine.makeShot(owner, [owner], 1);
    engine.primaryHit(chainShot(shot), victim(), 0);
    const dead = victim(2); dead.alive = false;
    engine.primaryHit(shot, dead, 0);
    expect(owner.counter.successes).toBe(0);
    engine.primaryHit(shot, dead, 0, true);
    expect(owner.counter.successes).toBe(1);
    expect(engine.statuses(dead.id, 0)).toEqual(neutral);
  });
  it('keeps independent vulnerability and slow expiries; weaker never extends stronger', () => {
    const engine = new EvolutionCombat(), target = victim(), strong = tower('brittle-ice', 3), weak = tower('brittle-ice', 0, 2);
    engine.primaryHit(engine.makeShot(strong, [strong], 1), target, 0);
    engine.primaryHit(engine.makeShot(weak, [weak], 1), target, 2000);
    expect(engine.damage(100, 'elemental', target, 2500)).toBe(130);
    expect(engine.damage(100, 'elemental', target, 3500)).toBe(115);
    expect(engine.damage(100, 'elemental', target, 5000)).toBe(100);
    const frost = tower('winterguard', 0, 3), brittle = tower('brittle-ice', 0, 4), slowed = victim(5);
    engine.primaryHit(engine.makeShot(frost, [frost], 1), slowed, 0);
    engine.primaryHit(engine.makeShot(brittle, [brittle], 1), slowed, 2000);
    expect(engine.statuses(slowed.id, 2799).slowFactor).toBe(0.6);
    expect(engine.statuses(slowed.id, 2900).slowFactor).toBe(0.3);
    expect(engine.statuses(slowed.id, 4000).slowFactor).toBe(0);
  });
  it('forgets an enemy on death or escape', () => {
    const engine = new EvolutionCombat(), owner = tower('thunderlord'), target = victim();
    for (let n = 0; n < 5; n++) engine.primaryHit(engine.makeShot(owner, [owner], 1), target, 0);
    engine.removeEnemy(target.id);
    expect(engine.statuses(target.id, 100)).toEqual(neutral);
  });
});

describe('burning fields', () => {
  it('snapshots field damage, replaces per owner and catches up exactly six ticks', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 4.5);
    engine.addField(shot, 0, 0, 0); expect(engine.tickFields(0)).toEqual([]);
    engine.addField(shot, 10, 0, 0); expect(engine.activeFieldCount).toBe(1);
    const ticks = engine.tickFields(3000);
    expect(ticks.map((t) => t.atMs)).toEqual([500, 1000, 1500, 2000, 2500, 3000]);
    expect(ticks.every((t) => t.rawDamage === shot.rawDamage * 0.3 && t.x === 10 && t.radius === 90)).toBe(true);
    expect(engine.activeFieldCount).toBe(0);
    engine.addField(shot, 0, 0, 4000); engine.addField({ ...shot, ownerId: 2 }, 0, 0, 4000);
    expect(engine.activeFieldCount).toBe(2);
    engine.removeOwner(1); expect(engine.activeFieldCount).toBe(1);
    engine.clear(); expect(engine.activeFieldCount).toBe(0); expect(engine.activeFields).toEqual([]);
  });
  it('emits a replaced field’s due ticks once and drops the rest across a large delta', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0); engine.addField(shot, 50, 0, 1200);
    expect(engine.tickFields(1200).map((t) => [t.atMs, t.x])).toEqual([[500, 0], [1000, 0]]);
    expect(engine.tickFields(1200)).toEqual([]);
    expect(engine.tickFields(1700).map((t) => [t.atMs, t.x])).toEqual([[1700, 50]]);
  });
  it.each([1150, 1035])('yields at most two ticks per field under continuous fire every %i ms', (interval) => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1), ticks: number[] = [];
    for (let k = 0; k < 5; k++) { ticks.push(...engine.tickFields(k * interval).map((t) => t.atMs)); engine.addField(shot, 0, 0, k * interval); }
    for (let k = 0; k < 4; k++) expect(ticks.filter((at) => at > k * interval && at <= (k + 1) * interval)).toHaveLength(2);
  });
  it('follows game time only and reports active fields', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0);
    expect(engine.tickFields(250 * 2)).toHaveLength(1);
    expect(engine.tickFields(500)).toHaveLength(0);
    expect(engine.activeFields).toEqual([{ ownerId: 1, x: 0, y: 0, radius: 90 }]);
    engine.addField(engine.makeShot(tower('siegebreaker', 0, 7), [], 1), 0, 0, 0);
    expect(engine.activeFieldCount).toBe(1);
  });
  it('drops a sold owner’s pending ticks', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), shot = engine.makeShot(owner, [owner], 1);
    engine.addField(shot, 0, 0, 0); engine.addField(shot, 0, 0, 1200); engine.removeOwner(1);
    expect(engine.tickFields(5000)).toEqual([]); expect(engine.activeFieldCount).toBe(0);
  });
  it('credits no second death from overlapping fields', () => {
    const engine = new EvolutionCombat(), owner = tower('flame-mortar'), target = victim(), shot = engine.makeShot(owner, [owner], 1);
    target.hp = 1;
    engine.addField(shot, 0, 0, 0); engine.addField({ ...shot, ownerId: 2 }, 0, 0, 0);
    let deaths = 0;
    for (const tick of engine.tickFields(500)) {
      if (!target.alive) continue;
      target.hp -= engine.damage(tick.rawDamage, 'elemental', target, tick.atMs);
      if (target.hp <= 0) { target.alive = false; deaths++; }
    }
    expect(deaths).toBe(1);
  });
});
