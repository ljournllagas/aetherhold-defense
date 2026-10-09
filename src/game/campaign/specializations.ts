import { TOWER_IDS } from '../config/towers.ts';
import type { TowerId } from '../../shared/progression.ts';
import type { CampaignSpecializationDefinition, CampaignSpecializationId } from './types.ts';

export const CAMPAIGN_SPECIALIZATION_UNLOCK_STARS = 30;

// These are campaign sidegrades. Multipliers modify the named base stat; an
// attack interval above 1 is slower. Combat applies the same definitions to
// all foundation levels, without adding a persistent account-wide bonus.
export const CAMPAIGN_SPECIALIZATIONS: readonly CampaignSpecializationDefinition[] = [
  {
    id: 'longbow_bastion', towerId: 'longbow', name: 'Longbow Bastion',
    description: 'Longer reach and heavier arrows, with a slower draw.',
    effects: { damageMultiplier: 1.15, rangeMultiplier: 1.15, attackIntervalMultiplier: 1.2 }
  },
  {
    id: 'repeater_tower', towerId: 'longbow', name: 'Repeater Tower',
    description: 'A short-range rapid volley with lighter arrows.',
    effects: { damageMultiplier: 0.82, rangeMultiplier: 0.86, attackIntervalMultiplier: 0.82 }
  },
  {
    id: 'siege_mortar', towerId: 'ember', name: 'Siege Mortar',
    description: 'A wider blast radius at a slower firing pace.',
    effects: { splashRadiusMultiplier: 1.25, attackIntervalMultiplier: 1.2 }
  },
  {
    id: 'ember_cannon', towerId: 'ember', name: 'Ember Cannon',
    description: 'Tighter, quicker shells that leave a short burning field.',
    effects: { damageMultiplier: 0.9, splashRadiusMultiplier: 0.78, attackIntervalMultiplier: 0.9, burnDurationMs: 1000, burnDamageMultiplier: 0.12 }
  },
  {
    id: 'glacial_spire', towerId: 'glacier', name: 'Glacial Spire',
    description: 'A stronger chill with a slower, slightly lighter bolt.',
    effects: { damageMultiplier: 0.92, attackIntervalMultiplier: 1.08, slowFactorMultiplier: 1.2 }
  },
  {
    id: 'shatter_spire', towerId: 'glacier', name: 'Shatter Spire',
    description: 'A weaker chill that makes slowed targets more vulnerable.',
    effects: { slowFactorMultiplier: 0.7, slowedTargetDamageMultiplier: 1.2 }
  },
  {
    id: 'aether_obelisk', towerId: 'starfire', name: 'Aether Obelisk',
    description: 'A harder single-target strike at shorter range and slower cadence.',
    effects: { damageMultiplier: 1.16, rangeMultiplier: 0.92, attackIntervalMultiplier: 1.12 }
  },
  {
    id: 'prism_tower', towerId: 'starfire', name: 'Prism Tower',
    description: 'Splits lighter arcane bolts between two foes.',
    effects: { damageMultiplier: 0.65, splitTargets: 2, splitDamageMultiplier: 0.5 }
  },
  {
    id: 'storm_conduit', towerId: 'tempest', name: 'Storm Conduit',
    description: 'Reaches two more foes, with weaker chain arcs.',
    effects: { chainTargetDelta: 2, chainDamageMultiplier: 0.78 }
  },
  {
    id: 'thunder_crown', towerId: 'tempest', name: 'Thunder Crown',
    description: 'A heavier first strike that reaches fewer foes.',
    effects: { chainTargetDelta: -2, primaryDamageMultiplier: 1.28, chainDamageMultiplier: 0.75 }
  }
];

const byTower = Object.fromEntries(TOWER_IDS.map((towerId) => [
  towerId,
  CAMPAIGN_SPECIALIZATIONS.filter((specialization) => specialization.towerId === towerId)
])) as Record<TowerId, CampaignSpecializationDefinition[]>;

export const SPECIALIZATIONS_BY_TOWER: Readonly<Record<TowerId, readonly CampaignSpecializationDefinition[]>> = byTower;

export function getCampaignSpecialization(id: CampaignSpecializationId): CampaignSpecializationDefinition | null {
  return CAMPAIGN_SPECIALIZATIONS.find((specialization) => specialization.id === id) ?? null;
}

export function getTowerSpecializations(towerId: TowerId): readonly CampaignSpecializationDefinition[] {
  return SPECIALIZATIONS_BY_TOWER[towerId];
}
