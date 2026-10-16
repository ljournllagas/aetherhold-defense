import type { EffectiveTowerStats } from '../../shared/progression.ts';
import {
  DAMAGE_FACTORS,
  EVOLUTION_COST_FACTORS,
  INTERVAL_FACTORS,
  RANGE_FACTORS
} from './evolutions.ts';
import { ADDITIONAL_TOWERS, type AdditionalTowerId } from './additionalTowers.ts';

export type AdditionalBranchId = 'deadeye' | 'headhunter' | 'pyre' | 'contagion';

export interface AdditionalEvolutionDefinition {
  id: AdditionalBranchId;
  towerId: AdditionalTowerId;
  name: string;
  description: string;
  starter: boolean;
  stats: readonly EffectiveTowerStats[];
}

// Mirrors branchStats() in evolutions.ts:27-35 exactly — same factors, same
// ceil(L4cost*factor) pricing, same neutral defaults. No CombatSystem change:
// every modifier uses an existing EffectiveTowerStats field.
function additionalBranchStats(
  towerId: AdditionalTowerId,
  damage: number,
  interval: number,
  modifiers: (rank: number) => Partial<EffectiveTowerStats>
): EffectiveTowerStats[] {
  const f = ADDITIONAL_TOWERS[towerId].levels[3];
  return DAMAGE_FACTORS.map((factor, rank) => ({
    ...f,
    damage: Math.round(f.damage * factor * damage),
    attackInterval: f.attackInterval * INTERVAL_FACTORS[rank] * interval,
    range: f.range * RANGE_FACTORS[rank],
    cost: Math.ceil(f.cost * EVOLUTION_COST_FACTORS[rank]),
    bossDamageMultiplier: 1,
    physicalArmorScale: 1,
    wardArmorScale: 1,
    volleyTargets: 1,
    burningField: false,
    vulnerabilityMultiplier: 1,
    vulnerabilityMs: 0,
    auraDamageMultiplier: 1,
    auraRange: 0,
    control: null,
    controlMs: 0,
    bossControlMs: 0,
    ...modifiers(rank)
  }));
}

const RANKED_VULN = [1.15, 1.2, 1.25, 1.3];

export const ADDITIONAL_EVOLUTIONS: Readonly<Record<AdditionalBranchId, AdditionalEvolutionDefinition>> = {
  deadeye: {
    id: 'deadeye',
    towerId: 'sentinel',
    name: 'Deadeye',
    description: 'Heavy execution bolts; double damage to bosses.',
    starter: true,
    stats: additionalBranchStats('sentinel', 1.35, 1.25, () => ({ bossDamageMultiplier: 2 }))
  },
  headhunter: {
    id: 'headhunter',
    towerId: 'sentinel',
    name: 'Headhunter',
    description: 'Lighter bolts split between two foes. Cleanup build.',
    starter: false,
    stats: additionalBranchStats('sentinel', 0.75, 1, () => ({ volleyTargets: 2 }))
  },
  pyre: {
    id: 'pyre',
    towerId: 'cinder',
    name: 'Pyre',
    description: 'Wide burning pools deny large zones. Weaker direct hit.',
    starter: true,
    stats: additionalBranchStats('cinder', 0.75, 1, () => ({ burningField: true, splashRadius: 110 }))
  },
  contagion: {
    id: 'contagion',
    towerId: 'cinder',
    name: 'Contagion',
    description: 'Smaller burning pools that make targets take more damage.',
    starter: false,
    stats: additionalBranchStats('cinder', 0.6, 1, (rank) => ({
      burningField: true,
      vulnerabilityMultiplier: RANKED_VULN[rank],
      vulnerabilityMs: 3000
    }))
  }
};

export const ADDITIONAL_STARTER_BRANCH: Readonly<Record<AdditionalTowerId, AdditionalBranchId>> = {
  sentinel: 'deadeye',
  cinder: 'pyre'
};

export const ADDITIONAL_ALTERNATIVE_BRANCH: Readonly<Record<AdditionalTowerId, AdditionalBranchId>> = {
  sentinel: 'headhunter',
  cinder: 'contagion'
};

// Derived reference (computed by same formula — asserted in tests):
// sentinel L4 480 -> evo costs [720, 960, 1320, 3840], total w/ foundation 7875.
// cinder L4 470 -> evo costs [705, 940, 1293, 3760], total w/ foundation 7698.
// deadeye R0-R3 dmg [405, 523, 878, 1141], headhunter [225, 291, 488, 634],
// pyre [111, 143, 240, 312], contagion [89, 114, 192, 249].
