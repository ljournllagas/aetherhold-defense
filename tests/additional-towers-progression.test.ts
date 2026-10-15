import { describe, expect, it } from 'vitest';
import { ADDITIONAL_TOWERS, additionalTowerTotalInvested } from '../src/game/config/additionalTowers.ts';
import {
  ADDITIONAL_ALTERNATIVE_BRANCH,
  ADDITIONAL_EVOLUTIONS,
  ADDITIONAL_STARTER_BRANCH,
  type AdditionalBranchId
} from '../src/game/config/additionalEvolutions.ts';
import {
  DAMAGE_FACTORS,
  EVOLUTION_COST_FACTORS,
  EVOLUTION_RULES,
  INTERVAL_FACTORS,
  RANGE_FACTORS
} from '../src/game/config/evolutions.ts';
import { ADDITIONAL_SPECIALIZATIONS } from '../src/game/campaign/additionalSpecializations.ts';
import { refundForInvested } from '../src/game/config/towers.ts';

describe('additional tower foundations', () => {
  it('keeps totals in the 870-1110 sidegrade band', () => {
    expect(additionalTowerTotalInvested('sentinel', 4)).toBe(1035);
    expect(additionalTowerTotalInvested('cinder', 4)).toBe(1000);
  });
  it('uses physical + elemental with no new armor type', () => {
    expect(ADDITIONAL_TOWERS.sentinel.damageType).toBe('physical');
    expect(ADDITIONAL_TOWERS.cinder.damageType).toBe('elemental');
    for (const t of Object.values(ADDITIONAL_TOWERS)) {
      for (const lvl of t.levels) expect(lvl.damageType).toBe(t.damageType);
    }
  });
  it('sentinel loses base DPS but wins vs bosses via deadeye x2', () => {
    const l4 = ADDITIONAL_TOWERS.sentinel.levels[3];
    expect(l4.damage / l4.attackInterval).toBeLessThan(85 / 0.32); // ranger L4
    const deadeyeR3 = ADDITIONAL_EVOLUTIONS.deadeye.stats[3];
    expect(deadeyeR3.bossDamageMultiplier).toBe(2);
    expect(deadeyeR3.damage / deadeyeR3.attackInterval).toBeLessThan(388 / 0.36); // marksman R3 general
    expect((deadeyeR3.damage / deadeyeR3.attackInterval) * 2).toBeGreaterThan((388 / 0.36) * 1.5);
  });
  it('cinder loses direct DPS, wins coverage via larger splash', () => {
    const l4 = ADDITIONAL_TOWERS.cinder.levels[3];
    expect(l4.damage / l4.attackInterval).toBeLessThan(200 / 1.15); // ember L4
    expect(ADDITIONAL_EVOLUTIONS.pyre.stats[3].splashRadius).toBeGreaterThan(90);
  });
});

describe('additional evolutions mirror core factors', () => {
  it('has one starter + one alt per new tower with 4 ranks', () => {
    expect(Object.keys(ADDITIONAL_EVOLUTIONS)).toHaveLength(4);
    for (const id of ['sentinel', 'cinder'] as const) {
      expect(ADDITIONAL_EVOLUTIONS[ADDITIONAL_STARTER_BRANCH[id]].starter).toBe(true);
      expect(ADDITIONAL_EVOLUTIONS[ADDITIONAL_ALTERNATIVE_BRANCH[id]].starter).toBe(false);
    }
  });
  it('prices identically from L4 cost via shared factors', () => {
    expect(ADDITIONAL_EVOLUTIONS.deadeye.stats.map((s) => s.cost)).toEqual([720, 960, 1320, 3840]);
    expect(ADDITIONAL_EVOLUTIONS.pyre.stats.map((s) => s.cost)).toEqual([705, 940, 1293, 3760]);
    for (const b of Object.keys(ADDITIONAL_EVOLUTIONS) as AdditionalBranchId[]) {
      const ref = ADDITIONAL_TOWERS[ADDITIONAL_EVOLUTIONS[b].towerId].levels[3];
      ADDITIONAL_EVOLUTIONS[b].stats.forEach((s, r) => {
        expect(s.cost).toBe(Math.ceil(ref.cost * EVOLUTION_COST_FACTORS[r]));
        expect(s.range).toBeCloseTo(ref.range * RANGE_FACTORS[r]);
      });
    }
  });
  it('derives damage from shared DAMAGE_FACTORS with branch multipliers', () => {
    const check = (b: AdditionalBranchId, mul: number) => {
      const ref = ADDITIONAL_TOWERS[ADDITIONAL_EVOLUTIONS[b].towerId].levels[3];
      ADDITIONAL_EVOLUTIONS[b].stats.forEach((s, r) => {
        expect(s.damage).toBe(Math.round(ref.damage * DAMAGE_FACTORS[r] * mul));
        expect(s.attackInterval).toBeCloseTo(
          ref.attackInterval * INTERVAL_FACTORS[r] * (b === 'deadeye' ? 1.25 : 1)
        );
      });
    };
    check('deadeye', 1.35);
    check('headhunter', 0.75);
    check('pyre', 0.75);
    check('contagion', 0.6);
  });
  it('locks approved branch mechanics without new combat fields', () => {
    expect(ADDITIONAL_EVOLUTIONS.headhunter.stats.map((s) => s.volleyTargets)).toEqual([2, 2, 2, 2]);
    expect(ADDITIONAL_EVOLUTIONS.pyre.stats.map((s) => s.burningField)).toEqual([true, true, true, true]);
    expect(ADDITIONAL_EVOLUTIONS.contagion.stats.map((s) => s.vulnerabilityMultiplier)).toEqual([1.15, 1.2, 1.25, 1.3]);
    expect(EVOLUTION_RULES.fieldMs).toBe(3000);
  });
  it('keeps 70% sell and endless mastery math identical', () => {
    expect(refundForInvested(1035)).toBe(Math.floor(1035 * 0.7));
    expect(Math.ceil(3840 * 1.25)).toBe(4800);
    expect(Math.ceil(3760 * 1.25)).toBe(4700);
    expect(Math.round(958 * 1.05)).toBe(Math.round(958 * (1 + EVOLUTION_RULES.masteryGain)));
  });
});

describe('additional campaign specs', () => {
  it('provides 2 sidegrades per new tower', () => {
    expect(ADDITIONAL_SPECIALIZATIONS).toHaveLength(4);
    expect(ADDITIONAL_SPECIALIZATIONS.filter((s) => s.towerId === 'sentinel')).toHaveLength(2);
    expect(ADDITIONAL_SPECIALIZATIONS.filter((s) => s.towerId === 'cinder')).toHaveLength(2);
  });
});
