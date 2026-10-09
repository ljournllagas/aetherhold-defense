import { describe, expect, it } from 'vitest';
import { ALTERNATIVE_BRANCH, DAMAGE_FACTORS, EVOLUTION_COST_FACTORS, EVOLUTION_RULES, EVOLUTIONS, INTERVAL_FACTORS, RANGE_FACTORS, STARTER_BRANCH } from '../src/game/config/evolutions.ts';
import { TOWERS, TOWER_IDS, isTowerId } from '../src/game/config/towers.ts';
import type { BranchId, EffectiveTowerStats } from '../src/shared/progression.ts';

const ids = Object.keys(EVOLUTIONS) as BranchId[];
const all = <K extends keyof EffectiveTowerStats>(b: BranchId, k: K) => EVOLUTIONS[b].stats.map((s) => s[k]);
function expectDerived(b: BranchId, damage: number, interval: number): void {
  const ref = TOWERS[EVOLUTIONS[b].towerId].levels[3];
  EVOLUTIONS[b].stats.forEach((s, r) => {
    expect(s.damage).toBe(Math.round(ref.damage * DAMAGE_FACTORS[r] * damage));
    expect(s.attackInterval).toBeCloseTo(ref.attackInterval * INTERVAL_FACTORS[r] * interval);
    expect(s.range).toBeCloseTo(ref.range * RANGE_FACTORS[r]);
    expect(s.damageType).toBe(ref.damageType);
  });
}

describe('evolution roster', () => {
  it('has one starter and one alternative per archetype with four integer-priced ranks', () => {
    expect(ids).toHaveLength(10);
    expect([...TOWER_IDS].sort()).toEqual(Object.keys(TOWERS).sort());
    for (const id of TOWER_IDS) {
      expect(EVOLUTIONS[STARTER_BRANCH[id]].starter).toBe(true);
      expect(EVOLUTIONS[ALTERNATIVE_BRANCH[id]].starter).toBe(false);
      for (const b of [STARTER_BRANCH[id], ALTERNATIVE_BRANCH[id]]) {
        expect(EVOLUTIONS[b]).toMatchObject({ id: b, towerId: id });
        expect(EVOLUTIONS[b].description.length).toBeGreaterThan(0);
        expect(EVOLUTIONS[b].stats).toHaveLength(4);
        for (const s of EVOLUTIONS[b].stats) {
          expect(Number.isSafeInteger(s.cost) && s.cost > 0).toBe(true);
          expect(Number.isSafeInteger(s.damage)).toBe(true);
          expect(s.attackInterval).toBeGreaterThan(0);
        }
      }
    }
  });
  it('names the approved branches and starters', () => {
    expect(STARTER_BRANCH).toEqual({ longbow: 'marksman', ember: 'siegebreaker', glacier: 'winterguard', starfire: 'spellbreaker', tempest: 'stormcaller' });
    expect(ALTERNATIVE_BRANCH).toEqual({ longbow: 'volley', ember: 'flame-mortar', glacier: 'brittle-ice', starfire: 'arcane-beacon', tempest: 'thunderlord' });
    expect(ids.map((b) => EVOLUTIONS[b].name).sort()).toEqual(['Arcane Beacon', 'Brittle Ice', 'Flame Mortar', 'Marksman', 'Siegebreaker', 'Spellbreaker', 'Stormcaller', 'Thunderlord', 'Volley', 'Winterguard']);
  });
  it('narrows tower ids', () => { expect(isTowerId('longbow')).toBe(true); expect(isTowerId('laser')).toBe(false); });
});

describe('rank progression and prices', () => {
  it('uses the common seed factors and rules', () => {
    expect(DAMAGE_FACTORS).toEqual([1.2, 1.55, 2.6, 3.38]);
    expect(INTERVAL_FACTORS).toEqual([1, 0.97, 0.94, 0.9]);
    expect(RANGE_FACTORS).toEqual([1, 1.03, 1.06, 1.1]);
    expect(EVOLUTION_COST_FACTORS).toEqual([1.5, 2, 2.75, 8]);
    expect(EVOLUTION_RULES).toEqual({ fieldMs: 3000, tickMs: 500, fieldFraction: 0.3, controlCadence: 5, controlImmunityMs: 1500, masteryGain: 0.05, masteryCostGrowth: 1.25 });
  });
  it('keeps rank prices and rank damage strictly monotonic', () => {
    for (let rank = 1; rank < EVOLUTION_COST_FACTORS.length; rank++) {
      expect(EVOLUTION_COST_FACTORS[rank]).toBeGreaterThan(EVOLUTION_COST_FACTORS[rank - 1]);
      expect(DAMAGE_FACTORS[rank]).toBeGreaterThan(DAMAGE_FACTORS[rank - 1]);
    }
  });
  it.each([...TOWER_IDS])('prices both %s branches identically from the level-4 cost', (id) => {
    const expected = EVOLUTION_COST_FACTORS.map((f) => Math.ceil(TOWERS[id].levels[3].cost * f));
    expect(all(STARTER_BRANCH[id], 'cost')).toEqual(expected);
    expect(all(ALTERNATIVE_BRANCH[id], 'cost')).toEqual(expected);
  });
  it('prices Ranger at 510, 680, 935, 2720', () => expect(all('marksman', 'cost')).toEqual([510, 680, 935, 2720]));
});

describe('branch modifiers (seed values)', () => {
  it('Marksman', () => { expectDerived('marksman', 1.35, 1.25); expect(all('marksman', 'bossDamageMultiplier')).toEqual([1.5, 1.5, 1.5, 1.5]); expect(all('marksman', 'volleyTargets')).toEqual([1, 1, 1, 1]); });
  it('Volley', () => { expectDerived('volley', 0.55, 1); expect(all('volley', 'volleyTargets')).toEqual([3, 3, 3, 3]); expect(all('volley', 'bossDamageMultiplier')).toEqual([1, 1, 1, 1]); });
  it('Siegebreaker', () => { expectDerived('siegebreaker', 1, 1); expect(all('siegebreaker', 'physicalArmorScale')).toEqual([0.5, 0.5, 0.5, 0.5]); expect(all('siegebreaker', 'wardArmorScale')).toEqual([1, 1, 1, 1]); expect(all('siegebreaker', 'splashRadius')).toEqual([90, 90, 90, 90]); expect(all('siegebreaker', 'burningField')).toEqual([false, false, false, false]); });
  it('Flame Mortar', () => { expectDerived('flame-mortar', 0.75, 1); expect(all('flame-mortar', 'burningField')).toEqual([true, true, true, true]); expect(all('flame-mortar', 'splashRadius')).toEqual([90, 90, 90, 90]); });
  it('Winterguard', () => { expectDerived('winterguard', 1, 1); expect(all('winterguard', 'control')).toEqual(['freeze', 'freeze', 'freeze', 'freeze']); expect(all('winterguard', 'controlMs')).toEqual([500, 500, 500, 500]); expect(all('winterguard', 'bossControlMs')).toEqual([150, 150, 150, 150]); expect(all('winterguard', 'slowFactor')).toEqual([0.6, 0.6, 0.6, 0.6]); expect(all('winterguard', 'slowDuration')).toEqual([2.8, 2.8, 2.8, 2.8]); });
  it('Brittle Ice', () => { expectDerived('brittle-ice', 1, 1); expect(all('brittle-ice', 'slowFactor')).toEqual([0.3, 0.3, 0.3, 0.3]); expect(all('brittle-ice', 'slowDuration')).toEqual([2, 2, 2, 2]); expect(all('brittle-ice', 'vulnerabilityMultiplier')).toEqual([1.15, 1.2, 1.25, 1.3]); expect(all('brittle-ice', 'vulnerabilityMs')).toEqual([3000, 3000, 3000, 3000]); expect(all('brittle-ice', 'control')).toEqual([null, null, null, null]); });
  it('Spellbreaker', () => { expectDerived('spellbreaker', 1, 1); expect(all('spellbreaker', 'wardArmorScale')).toEqual([0.5, 0.5, 0.5, 0.5]); expect(all('spellbreaker', 'physicalArmorScale')).toEqual([1, 1, 1, 1]); });
  it('Arcane Beacon', () => { expectDerived('arcane-beacon', 0.6, 1); expect(all('arcane-beacon', 'auraDamageMultiplier')).toEqual([1.15, 1.2, 1.25, 1.3]); expect(all('arcane-beacon', 'auraRange')).toEqual([160, 160, 160, 160]); });
  it('Stormcaller', () => { expectDerived('stormcaller', 1, 1); expect(all('stormcaller', 'chainCount')).toEqual([2, 3, 4, 5].map((n) => TOWERS.tempest.levels[3].chainCount! + n)); expect(all('stormcaller', 'chainCount')).toEqual([9, 10, 11, 12]); });
  it('Thunderlord', () => { expectDerived('thunderlord', 1.6, 1); expect(all('thunderlord', 'chainCount')).toEqual([3, 3, 3, 3]); expect(all('thunderlord', 'control')).toEqual(['stun', 'stun', 'stun', 'stun']); expect(all('thunderlord', 'controlMs')).toEqual([350, 350, 350, 350]); expect(all('thunderlord', 'bossControlMs')).toEqual([100, 100, 100, 100]); });
  it('keeps neutral defaults where a branch does not override', () => {
    expect(EVOLUTIONS.marksman.stats[0]).toMatchObject({ physicalArmorScale: 1, wardArmorScale: 1, burningField: false, vulnerabilityMultiplier: 1, vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0 });
  });
});
