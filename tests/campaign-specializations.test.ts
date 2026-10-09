import { describe, expect, it } from 'vitest';
import { TOWER_IDS } from '../src/game/config/towers.ts';
import { CAMPAIGN_SPECIALIZATION_UNLOCK_STARS, CAMPAIGN_SPECIALIZATIONS, SPECIALIZATIONS_BY_TOWER, getCampaignSpecialization, getTowerSpecializations } from '../src/game/campaign/specializations.ts';

describe('campaign tower specializations', () => {
  it('offers exactly two typed options for each existing tower archetype', () => {
    expect(CAMPAIGN_SPECIALIZATION_UNLOCK_STARS).toBe(30);
    expect(Object.keys(SPECIALIZATIONS_BY_TOWER).sort()).toEqual([...TOWER_IDS].sort());
    expect(CAMPAIGN_SPECIALIZATIONS).toHaveLength(10);
    for (const towerId of TOWER_IDS) {
      const choices = getTowerSpecializations(towerId);
      expect(choices).toHaveLength(2);
      expect(choices.every((choice) => choice.towerId === towerId)).toBe(true);
      expect(new Set(choices.map((choice) => choice.id)).size).toBe(2);
    }
    expect(getTowerSpecializations('longbow').map((choice) => choice.id)).toEqual(['longbow_bastion', 'repeater_tower']);
    expect(getTowerSpecializations('ember').map((choice) => choice.id)).toEqual(['siege_mortar', 'ember_cannon']);
    expect(getTowerSpecializations('glacier').map((choice) => choice.id)).toEqual(['glacial_spire', 'shatter_spire']);
    expect(getTowerSpecializations('starfire').map((choice) => choice.id)).toEqual(['aether_obelisk', 'prism_tower']);
    expect(getTowerSpecializations('tempest').map((choice) => choice.id)).toEqual(['storm_conduit', 'thunder_crown']);
  });

  it('expresses tradeoffs in each option and resolves stable specialization IDs', () => {
    for (const specialization of CAMPAIGN_SPECIALIZATIONS) {
      expect(specialization.name.length).toBeGreaterThan(0);
      expect(specialization.description.length).toBeGreaterThan(0);
      expect(Object.keys(specialization.effects).length).toBeGreaterThan(0);
    }

    expect(getCampaignSpecialization('ember_cannon')?.effects).toMatchObject({
      splashRadiusMultiplier: 0.78, burnDurationMs: 1000
    });
    expect(getCampaignSpecialization('shatter_spire')?.effects).toMatchObject({
      slowFactorMultiplier: 0.7, slowedTargetDamageMultiplier: 1.2
    });
    expect(getCampaignSpecialization('storm_conduit')?.effects).toMatchObject({
      chainTargetDelta: 2, chainDamageMultiplier: 0.78
    });
    expect(getCampaignSpecialization('thunder_crown')?.effects).toMatchObject({
      chainTargetDelta: -2, primaryDamageMultiplier: 1.28
    });
    expect(getCampaignSpecialization('longbow_bastion')?.towerId).toBe('longbow');
  });
});
