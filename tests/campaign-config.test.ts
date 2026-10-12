import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, CAMPAIGN_MILESTONES, CAMPAIGN_SIGILS, CAMPAIGN_WORLDS, getCampaignLevel, getCampaignWorld } from '../src/game/campaign/config.ts';

describe('campaign configuration', () => {
  it('contains ten authored worlds and one hundred contiguous level entries', () => {
    expect(CAMPAIGN_WORLDS.map((world) => [world.id, world.levelStart, world.levelEnd, world.bossLevel])).toEqual([
      ['borderkeep', 1, 10, 10],
      ['emberfall', 11, 20, 20],
      ['frostveil', 21, 30, 30],
      ['whisperfen', 31, 40, 40],
      ['sunken_aether', 41, 50, 50],
      ['ironroot', 51, 60, 60],
      ['sky_isles', 61, 70, 70],
      ['dreadmoon', 71, 80, 80],
      ['astral_rift', 81, 90, 90],
      ['aether_crown', 91, 100, 100]
    ]);
    expect(CAMPAIGN_LEVELS).toHaveLength(100);
    expect(CAMPAIGN_LEVELS.map((level) => level.level)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
    expect(CAMPAIGN_LEVELS.map((level) => level.waveProfileId)).toEqual(Array.from({ length: 100 }, (_, index) => `campaign_level_${index + 1}`));
    expect(CAMPAIGN_LEVELS.map((level) => level.bossEnemyId).filter(Boolean)).toEqual([
      'hollow_warden', 'cinder_colossus', 'frostbound_matriarch', 'mireheart_hydra', 'drowned_oracle',
      'iron_tyrant', 'stormmaw_prime', 'umbral_regent', 'rift_sovereign', 'aether_devourer'
    ]);
    expect(CAMPAIGN_LEVELS.every((level) => level.difficultyRating >= 1 && level.difficultyRating <= 5)).toBe(true);
    expect(new Set(CAMPAIGN_LEVELS.map((level) => level.worldId))).toEqual(new Set(CAMPAIGN_WORLDS.map((world) => world.id)));
  });

  it('retains authored enemy compositions, mastery thresholds, and map variants', () => {
    expect(getCampaignLevel(1)).toMatchObject({
      worldId: 'borderkeep', mapLayoutId: 'borderkeep_a', enemyIds: ['marchling'],
      mastery: { minimumLivesForStar: 12, scoreTarget: 1950 }
    });
    expect(getCampaignLevel(10)).toMatchObject({
      mapLayoutId: 'borderkeep_d_boss', enemyIds: ['marchling', 'skitter'], bossEnemyId: 'hollow_warden',
      mastery: { minimumLivesForStar: 10, scoreTarget: 6000 }
    });
    expect(getCampaignLevel(16)).toMatchObject({
      worldId: 'emberfall', mapLayoutId: 'emberfall_b3', enemyIds: ['ashcaller', 'cinderling', 'ashrunner'],
      warnings: ['support'], mastery: { minimumLivesForStar: 11, scoreTarget: 9200 }
    });
    expect(getCampaignLevel(30)).toMatchObject({
      worldId: 'frostveil', mapLayoutId: 'frostveil_d_boss', bossEnemyId: 'frostbound_matriarch',
      mastery: { minimumLivesForStar: 8, scoreTarget: 21500 }
    });
    expect(getCampaignLevel(31)).toMatchObject({
      worldId: 'whisperfen', mapLayoutId: 'whisperfen_a', enemyIds: ['bogling'], bossEnemyId: null,
      mastery: { minimumLivesForStar: 11, scoreTarget: 10000 }
    });
    expect(getCampaignLevel(40)).toMatchObject({
      worldId: 'whisperfen', mapLayoutId: 'whisperfen_d_boss', bossEnemyId: 'mireheart_hydra'
    });
    expect(CAMPAIGN_LEVELS.slice(30, 40).map(level => level.mastery.scoreTarget)).toEqual([
      10000, 10300, 13500, 13000, 12000, 18000, 14000, 14500, 15500, 17000
    ]);
  });

  it('preserves the original milestones and registers all ten boss sigils', () => {
    expect(CAMPAIGN_MILESTONES.map((milestone) => milestone.stars)).toEqual([10, 20, 30, 45, 60, 75, 90]);
    expect(CAMPAIGN_SIGILS.map((sigil) => [sigil.id, sigil.level])).toEqual([
      ['border_sigil', 10], ['ember_sigil', 20], ['frost_sigil', 30], ['mire_sigil', 40],
      ['tide_sigil', 50], ['iron_sigil', 60], ['sky_sigil', 70], ['moon_sigil', 80],
      ['rift_sigil', 90], ['crown_sigil', 100]
    ]);
    expect(CAMPAIGN_SIGILS[0].unlocks).toContain('meteor_strike_powerup');
    expect(CAMPAIGN_SIGILS[0].unlocks).toContain('hollow_warden_codex_entry');
    expect(CAMPAIGN_SIGILS[1].unlocks).toContain('battle_tempo_powerup');
    expect(CAMPAIGN_SIGILS[2].unlocks).toContain('time_lock_powerup');
    expect(CAMPAIGN_SIGILS[2].unlocks).toContain('frostbound_matriarch_codex_entry');
    expect(CAMPAIGN_SIGILS[2].unlocks).toEqual(['worlds_1_3_milestone_complete', 'frostveil_cosmetics', 'frostbound_matriarch_codex_entry', 'time_lock_powerup']);
    expect(CAMPAIGN_SIGILS[3].unlocks).toEqual(['world_5']);
    expect(CAMPAIGN_SIGILS[9].unlocks).toEqual(['campaign_100_clear']);
  });

  it('rejects levels outside the campaign and resolves authored worlds', () => {
    expect(getCampaignLevel(0)).toBeNull();
    expect(getCampaignLevel(101)).toBeNull();
    expect(getCampaignLevel(1.5)).toBeNull();
    expect(getCampaignLevel(Number.NaN)).toBeNull();
    expect(getCampaignWorld('emberfall').bossEnemyId).toBe('cinder_colossus');
  });
});
