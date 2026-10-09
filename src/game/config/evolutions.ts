import type { BranchId, EffectiveTowerStats, TowerId } from '../../shared/progression.ts';
import { TOWERS } from './towers.ts';

export interface EvolutionDefinition { id: BranchId; towerId: TowerId; name: string; description: string; starter: boolean; stats: readonly EffectiveTowerStats[]; }

export const DAMAGE_FACTORS: readonly number[] = [1.2, 1.55, 2, 2.6];
export const INTERVAL_FACTORS: readonly number[] = [1, 0.97, 0.94, 0.9];
export const RANGE_FACTORS: readonly number[] = [1, 1.03, 1.06, 1.1];
export const EVOLUTION_COST_FACTORS: readonly number[] = [1.5, 2, 2.75, 3.75];

export const EVOLUTION_RULES: {
  fieldMs: number; tickMs: number; fieldFraction: number; controlCadence: number; controlImmunityMs: number; masteryGain: number; masteryCostGrowth: number;
} = { fieldMs: 3000, tickMs: 500, fieldFraction: 0.3, controlCadence: 5, controlImmunityMs: 1500, masteryGain: 0.05, masteryCostGrowth: 1.25 };

const TEMPEST_BASE_CHAIN = TOWERS.tempest.levels[3].chainCount;
if (TEMPEST_BASE_CHAIN === undefined) throw new Error('evolutions: TOWERS.tempest.levels[3].chainCount is undefined');
const tempestBaseChain: number = TEMPEST_BASE_CHAIN;

const RANKED_BONUS = [1.15, 1.2, 1.25, 1.3];
const STORM_CHAIN_BONUS = [2, 3, 4, 5];

function branchStats(towerId: TowerId, damage: number, interval: number, modifiers: (rank: number) => Partial<EffectiveTowerStats>): EffectiveTowerStats[] {
  const f = TOWERS[towerId].levels[3];
  return DAMAGE_FACTORS.map((factor, rank) => ({
    ...f, damage: Math.round(f.damage * factor * damage), attackInterval: f.attackInterval * INTERVAL_FACTORS[rank] * interval,
    range: f.range * RANGE_FACTORS[rank], cost: Math.ceil(f.cost * EVOLUTION_COST_FACTORS[rank]),
    bossDamageMultiplier: 1, physicalArmorScale: 1, wardArmorScale: 1, volleyTargets: 1, burningField: false, vulnerabilityMultiplier: 1,
    vulnerabilityMs: 0, auraDamageMultiplier: 1, auraRange: 0, control: null, controlMs: 0, bossControlMs: 0, ...modifiers(rank)
  }));
}

export const EVOLUTIONS: Readonly<Record<BranchId, EvolutionDefinition>> = {
  marksman: {
    id: 'marksman', towerId: 'longbow', name: 'Marksman', description: 'Heavy single arrows; +50% damage to bosses.', starter: true,
    stats: branchStats('longbow', 1.35, 1.25, () => ({ bossDamageMultiplier: 1.5 }))
  },
  volley: {
    id: 'volley', towerId: 'longbow', name: 'Volley', description: 'Each attack looses up to three arrows at different foes.', starter: false,
    stats: branchStats('longbow', 0.55, 1, () => ({ volleyTargets: 3 }))
  },
  siegebreaker: {
    id: 'siegebreaker', towerId: 'ember', name: 'Siegebreaker', description: 'Splash shells that treat physical armor as half.', starter: true,
    stats: branchStats('ember', 1, 1, () => ({ physicalArmorScale: 0.5 }))
  },
  'flame-mortar': {
    id: 'flame-mortar', towerId: 'ember', name: 'Flame Mortar', description: 'Lighter shells that leave a burning field for 3 s.', starter: false,
    stats: branchStats('ember', 0.75, 1, () => ({ burningField: true }))
  },
  winterguard: {
    id: 'winterguard', towerId: 'glacier', name: 'Winterguard', description: 'Strong slow; every fifth hit freezes the target.', starter: true,
    stats: branchStats('glacier', 1, 1, () => ({ control: 'freeze', controlMs: 500, bossControlMs: 150 }))
  },
  'brittle-ice': {
    id: 'brittle-ice', towerId: 'glacier', name: 'Brittle Ice', description: 'Weaker slow that makes targets take more damage.', starter: false,
    stats: branchStats('glacier', 1, 1, (rank) => ({ slowFactor: 0.3, slowDuration: 2, vulnerabilityMultiplier: RANKED_BONUS[rank], vulnerabilityMs: 3000 }))
  },
  spellbreaker: {
    id: 'spellbreaker', towerId: 'starfire', name: 'Spellbreaker', description: 'Arcane bolts that treat ward armor as half.', starter: true,
    stats: branchStats('starfire', 1, 1, () => ({ wardArmorScale: 0.5 }))
  },
  'arcane-beacon': {
    id: 'arcane-beacon', towerId: 'starfire', name: 'Arcane Beacon', description: 'Weaker bolts; nearby towers deal more damage.', starter: false,
    stats: branchStats('starfire', 0.6, 1, (rank) => ({ auraDamageMultiplier: RANKED_BONUS[rank], auraRange: 160 }))
  },
  stormcaller: {
    id: 'stormcaller', towerId: 'tempest', name: 'Stormcaller', description: 'Chain lightning that reaches more foes.', starter: true,
    stats: branchStats('tempest', 1, 1, (rank) => ({ chainCount: tempestBaseChain + STORM_CHAIN_BONUS[rank] }))
  },
  thunderlord: {
    id: 'thunderlord', towerId: 'tempest', name: 'Thunderlord', description: 'Heavy short chains; every fifth hit stuns the target.', starter: false,
    stats: branchStats('tempest', 1.6, 1, () => ({ chainCount: 3, control: 'stun', controlMs: 350, bossControlMs: 100 }))
  }
};

export const STARTER_BRANCH: Readonly<Record<TowerId, BranchId>> = {
  longbow: 'marksman', ember: 'siegebreaker', glacier: 'winterguard', starfire: 'spellbreaker', tempest: 'stormcaller'
};

export const ALTERNATIVE_BRANCH: Readonly<Record<TowerId, BranchId>> = {
  longbow: 'volley', ember: 'flame-mortar', glacier: 'brittle-ice', starfire: 'arcane-beacon', tempest: 'thunderlord'
};
