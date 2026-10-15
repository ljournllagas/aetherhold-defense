import type { AdditionalTowerId } from '../config/additionalTowers.ts';

// Campaign sidegrades for the extension roster — same shape as
// CAMPAIGN_SPECIALIZATIONS in ../campaign/specializations.ts:10-61.
// Multipliers modify the named base stat; interval above 1 is slower.
export interface AdditionalSpecializationDefinition {
  id: string;
  towerId: AdditionalTowerId;
  name: string;
  description: string;
  effects: {
    damageMultiplier?: number;
    rangeMultiplier?: number;
    attackIntervalMultiplier?: number;
    splashRadiusMultiplier?: number;
    slowedTargetDamageMultiplier?: number;
    burnDurationMs?: number;
    burnDamageMultiplier?: number;
  };
}

export const ADDITIONAL_SPECIALIZATIONS: readonly AdditionalSpecializationDefinition[] = [
  {
    id: 'sentinel_bastion',
    towerId: 'sentinel',
    name: 'Sentinel Bastion',
    description: 'Longer reach and heavier bolts, with a slower draw.',
    effects: { damageMultiplier: 1.15, rangeMultiplier: 1.12, attackIntervalMultiplier: 1.2 }
  },
  {
    id: 'sentinel_repeater',
    towerId: 'sentinel',
    name: 'Sentinel Repeater',
    description: 'Short-range rapid bolts with lighter hits.',
    effects: { damageMultiplier: 0.8, rangeMultiplier: 0.88, attackIntervalMultiplier: 0.82 }
  },
  {
    id: 'cinder_mortar',
    towerId: 'cinder',
    name: 'Cinder Mortar',
    description: 'A wider burning pool at a slower firing pace.',
    effects: { splashRadiusMultiplier: 1.25, attackIntervalMultiplier: 1.2 }
  },
  {
    id: 'cinder_cannon',
    towerId: 'cinder',
    name: 'Cinder Cannon',
    description: 'Tighter, quicker shells with a shorter burn.',
    effects: { damageMultiplier: 0.9, splashRadiusMultiplier: 0.8, attackIntervalMultiplier: 0.9, burnDurationMs: 1000, burnDamageMultiplier: 0.12 }
  }
];

export const ADDITIONAL_SPECIALIZATIONS_BY_TOWER: Readonly<Record<AdditionalTowerId, readonly AdditionalSpecializationDefinition[]>> = {
  sentinel: ADDITIONAL_SPECIALIZATIONS.filter((s) => s.towerId === 'sentinel'),
  cinder: ADDITIONAL_SPECIALIZATIONS.filter((s) => s.towerId === 'cinder')
};
