import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_MILESTONES,
  CAMPAIGN_SIGILS,
  CAMPAIGN_WORLDS,
  getCampaignLevel
} from '../src/game/campaign/config.ts';
import {
  CAMPAIGN_NEWER_WARNING,
  CAMPAIGN_STORAGE_KEY,
  CAMPAIGN_UNAVAILABLE_WARNING,
  CAMPAIGN_UNREADABLE_WARNING,
  CampaignRepository,
  campaignPowerUpPool,
  createEmptyCampaignProfile,
  isLevelUnlocked,
  isWorldUnlocked,
  totalMasteryStars,
  type CampaignStorage
} from '../src/game/campaign/progress.ts';

class IndependentStore implements CampaignStorage {
  value: string | null;
  writes = 0;
  failRead = false;
  failWrite = false;

  constructor(value: string | null = null) { this.value = value; }

  getItem = (key: string): string | null => {
    expect(key).toBe(CAMPAIGN_STORAGE_KEY);
    if (this.failRead) throw new Error('storage access denied');
    return this.value;
  };

  setItem = (key: string, value: string): void => {
    expect(key).toBe(CAMPAIGN_STORAGE_KEY);
    if (this.failWrite) throw new Error('quota exceeded');
    this.value = value;
    this.writes++;
  };
}

const AUTHORED_LEVELS = [
  [1, 'borderkeep', 'borderkeep_a', ['marchling'], null, 12, 1950, []],
  [2, 'borderkeep', 'borderkeep_a2', ['marchling', 'skitter'], null, 12, 2400, ['fast']],
  [3, 'borderkeep', 'borderkeep_a3', ['skitter', 'marchling'], null, 12, 2850, ['fast']],
  [4, 'borderkeep', 'borderkeep_b', ['marchling', 'stoneback'], null, 12, 3300, ['high_hp']],
  [5, 'borderkeep', 'borderkeep_b2', ['ironhide', 'marchling'], null, 12, 3750, ['physical_resistance']],
  [6, 'borderkeep', 'borderkeep_b3', ['skitter', 'stoneback', 'ironhide'], null, 12, 4200, ['fast', 'physical_resistance']],
  [7, 'borderkeep', 'borderkeep_c', ['veilborn', 'marchling'], null, 12, 4650, ['arcane_resistance']],
  [8, 'borderkeep', 'borderkeep_c2', ['ironhide', 'veilborn', 'stoneback'], null, 12, 5100, ['mixed_resistance']],
  [9, 'borderkeep', 'borderkeep_c3', ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn'], null, 12, 5550, ['world_mix']],
  [10, 'borderkeep', 'borderkeep_d_boss', ['marchling', 'skitter'], 'hollow_warden', 10, 6000, ['boss']],
  [11, 'emberfall', 'emberfall_a', ['cinderling'], null, 11, 5700, []],
  [12, 'emberfall', 'emberfall_a2', ['cinderling', 'ashrunner'], null, 11, 6400, ['fast']],
  [13, 'emberfall', 'emberfall_a3', ['ashrunner', 'cinderling', 'ember_brute'], null, 11, 7100, ['fast', 'high_hp']],
  [14, 'emberfall', 'emberfall_b', ['magmahide', 'cinderling'], null, 11, 7800, ['physical_resistance']],
  [15, 'emberfall', 'emberfall_b2', ['ember_brute', 'ashrunner'], null, 11, 8500, ['high_hp', 'fast']],
  [16, 'emberfall', 'emberfall_b3', ['ashcaller', 'cinderling', 'ashrunner'], null, 11, 9200, ['support']],
  [17, 'emberfall', 'emberfall_c', ['magmahide', 'ashcaller', 'ember_brute'], null, 11, 9900, ['armor', 'support']],
  [18, 'emberfall', 'emberfall_c2', ['cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller'], null, 11, 10600, ['world_mix']],
  [19, 'emberfall', 'emberfall_c3', ['ashrunner', 'magmahide', 'ember_brute', 'ashcaller'], null, 11, 11300, ['elite_mix']],
  [20, 'emberfall', 'emberfall_d_boss', ['cinderling', 'ashrunner', 'ashcaller'], 'cinder_colossus', 9, 12000, ['boss']],
  [21, 'frostveil', 'frostveil_a', ['icebound', 'snowstalker'], null, 10, 12950, ['fast']],
  [22, 'frostveil', 'frostveil_a2', ['snowstalker', 'icebound'], null, 10, 13900, ['fast']],
  [23, 'frostveil', 'frostveil_a3', ['frostback', 'icebound'], null, 10, 14850, ['high_hp']],
  [24, 'frostveil', 'frostveil_b', ['glacier_knight', 'snowstalker'], null, 10, 15800, ['slow_resistance']],
  [25, 'frostveil', 'frostveil_b2', ['frost_shaman', 'icebound'], null, 10, 16750, ['support']],
  [26, 'frostveil', 'frostveil_b3', ['frostback', 'glacier_knight'], null, 10, 17700, ['high_hp', 'slow_resistance']],
  [27, 'frostveil', 'frostveil_c', ['frost_shaman', 'snowstalker', 'glacier_knight'], null, 10, 18650, ['support', 'slow_resistance']],
  [28, 'frostveil', 'frostveil_c2', ['snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman'], null, 10, 19600, ['world_mix']],
  [29, 'frostveil', 'frostveil_c3', ['snowstalker', 'frostback', 'glacier_knight', 'frost_shaman'], null, 10, 20550, ['elite_mix']],
  [30, 'frostveil', 'frostveil_d_boss', ['icebound', 'snowstalker', 'frost_shaman'], 'frostbound_matriarch', 8, 21500, ['boss']]
] as const;

const BASE_POWER_UPS = [
  'gold_rush', 'arcane_surge', 'emergency_repair', 'treasure_goblin',
  'double_bounty', 'tower_overcharge', 'ancient_blessing'
];

function earnStar(repository: CampaignRepository, level: number, star: 'completion' | 'lives' | 'score') {
  const definition = getCampaignLevel(level)!;
  const attempt = {
    completion: [definition.mastery.scoreTarget - 1, definition.mastery.minimumLivesForStar - 1],
    lives: [definition.mastery.scoreTarget - 1, definition.mastery.minimumLivesForStar],
    score: [definition.mastery.scoreTarget, definition.mastery.minimumLivesForStar - 1]
  } as const;
  const [score, lives] = attempt[star];
  const result = repository.recordClear(level, score, lives);
  expect(result, `level ${level} ${star} attempt`).not.toBeNull();
  expect(result!.newlyEarnedStars).toEqual([star]);
  return result!;
}

function earnThreeStars(repository: CampaignRepository, level: number) {
  earnStar(repository, level, 'completion');
  earnStar(repository, level, 'lives');
  return earnStar(repository, level, 'score');
}

describe('independent campaign acceptance', () => {
  it('matches the 30 authored level sequence from the expansion data', () => {
    expect(CAMPAIGN_WORLDS.map(({ id, name, levelStart, levelEnd, bossLevel, bossEnemyId }) => [id, name, levelStart, levelEnd, bossLevel, bossEnemyId])).toEqual([
      ['borderkeep', 'The Borderkeep', 1, 10, 10, 'hollow_warden'],
      ['emberfall', 'Emberfall Highlands', 11, 20, 20, 'cinder_colossus'],
      ['frostveil', 'Frostveil Pass', 21, 30, 30, 'frostbound_matriarch']
    ]);
    expect(CAMPAIGN_LEVELS).toHaveLength(30);
    expect(CAMPAIGN_LEVELS.map(({ level, worldId, mapLayoutId, enemyIds, bossEnemyId, mastery, warnings }) => [
      level, worldId, mapLayoutId, [...enemyIds], bossEnemyId,
      mastery.minimumLivesForStar, mastery.scoreTarget, [...warnings]
    ])).toEqual(AUTHORED_LEVELS);
  });

  it('rejects invalid and locked clears, earns three distinct stars over replay, and never removes or duplicates them', () => {
    const store = new IndependentStore();
    const repository = new CampaignRepository(store);
    const first = getCampaignLevel(1)!;

    expect(isLevelUnlocked(1, repository.view())).toBe(true);
    expect(isLevelUnlocked(2, repository.view())).toBe(false);
    expect(repository.recordClear(2, first.mastery.scoreTarget, first.mastery.minimumLivesForStar)).toBeNull();
    expect(repository.recordClear(0, 5000, 20)).toBeNull();
    expect(repository.recordClear(31, 5000, 20)).toBeNull();
    expect(repository.recordClear(1, -1, 20)).toBeNull();
    expect(repository.recordClear(1, first.mastery.scoreTarget, 0)).toBeNull();
    expect(repository.recordClear(1, 1.5, 20)).toBeNull();
    expect(store.writes).toBe(0);

    const completion = earnStar(repository, 1, 'completion');
    expect(completion.totalMasteryStars).toBe(1);
    expect(completion.progress).toMatchObject({ completed: true, completionStar: true, livesStar: false, scoreStar: false });
    const lives = earnStar(repository, 1, 'lives');
    expect(lives.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: false, bestRemainingLives: first.mastery.minimumLivesForStar });
    expect(lives.totalMasteryStars).toBe(2);
    const score = earnStar(repository, 1, 'score');
    expect(score.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: true, bestScore: first.mastery.scoreTarget });
    expect(score.totalMasteryStars).toBe(3);

    const weakerReplay = repository.recordClear(1, 1, 1)!;
    expect(weakerReplay.newlyEarnedStars).toEqual([]);
    expect(weakerReplay.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: true, bestScore: first.mastery.scoreTarget, bestRemainingLives: first.mastery.minimumLivesForStar });
    expect(repository.recordClear(1, first.mastery.scoreTarget, first.mastery.minimumLivesForStar)!.totalMasteryStars).toBe(3);
    expect(totalMasteryStars(repository.view().profile)).toBe(3);
  });

  it('crosses all seven star gates exactly and awards each boss sigil and gated power-up', () => {
    const store = new IndependentStore();
    const repository = new CampaignRepository(store);
    const gate = (stars: number, feature: string) => {
      expect(repository.view().totalMasteryStars).toBe(stars);
      expect(repository.view().unlockedFeatures).toContain(feature);
    };

    expect(campaignPowerUpPool(repository.view())).toEqual(BASE_POWER_UPS);
    expect(isWorldUnlocked('borderkeep', repository.view())).toBe(true);
    expect(isWorldUnlocked('emberfall', repository.view())).toBe(false);
    expect(isWorldUnlocked('frostveil', repository.view())).toBe(false);
    for (const level of [1, 2, 3]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(9);
    expect(repository.view().unlockedFeatures).not.toContain('aether_codex_tactics');
    earnStar(repository, 4, 'completion');
    gate(10, 'aether_codex_tactics');

    earnStar(repository, 4, 'lives');
    earnStar(repository, 4, 'score');
    for (const level of [5, 6]) earnThreeStars(repository, level);
    earnStar(repository, 7, 'completion');
    expect(repository.view().totalMasteryStars).toBe(19);
    expect(repository.setPreparationTargeting('longbow', 'last')).toBe(false);
    expect(repository.savePreparationPreset('too-early', 'Too early')).toBe(false);
    earnStar(repository, 7, 'lives');
    gate(20, 'battle_preparation_presets');
    expect(repository.setPreparationTargeting('longbow', 'last')).toBe(true);
    expect(repository.setPreparationTargeting('starfire', 'strongest')).toBe(true);
    expect(repository.savePreparationPreset('opening', 'Opening')).toBe(true);
    earnStar(repository, 7, 'score');
    for (const level of [8, 9]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(27);
    expect(isLevelUnlocked(10, repository.view())).toBe(true);
    expect(isLevelUnlocked(11, repository.view())).toBe(false);
    expect(repository.setSpecialization('longbow', 'longbow_bastion')).toBe(false);
    expect(campaignPowerUpPool(repository.view())).toEqual(BASE_POWER_UPS);
    const border = earnStar(repository, 10, 'completion');
    earnStar(repository, 10, 'lives');
    expect(repository.view().totalMasteryStars).toBe(29);
    expect(repository.setSpecialization('longbow', 'longbow_bastion')).toBe(false);
    earnStar(repository, 10, 'score');
    gate(30, 'tower_specialization_i');
    expect(border.newlyEarnedSigils).toEqual(['border_sigil']);
    expect(repository.view().profile.worldSigils).toContain('border_sigil');
    expect(isWorldUnlocked('emberfall', repository.view())).toBe(true);
    expect(isLevelUnlocked(11, repository.view())).toBe(true);
    expect(campaignPowerUpPool(repository.view())).toEqual([...BASE_POWER_UPS, 'meteor_strike']);

    for (const [tower, choice] of [
      ['longbow', 'longbow_bastion'], ['ember', 'ember_cannon'], ['glacier', 'glacial_spire'],
      ['starfire', 'aether_obelisk'], ['tempest', 'storm_conduit']
    ] as const) expect(repository.setSpecialization(tower as never, choice as never)).toBe(true);
    expect(new CampaignRepository(store).view().profile.choices).toMatchObject({
      longbow: 'longbow_bastion', ember: 'ember_cannon', glacier: 'glacial_spire',
      starfire: 'aether_obelisk', tempest: 'storm_conduit'
    });
    expect(repository.setSpecialization('longbow', 'repeater_tower')).toBe(true);
    expect(repository.setSpecialization('longbow', null)).toBe(true);
    expect(repository.setSpecialization('ember', 'longbow_bastion')).toBe(false);
    expect(repository.setSpecialization('invalid' as never, null)).toBe(false);
    expect(repository.setSpecialization('longbow', 'unknown' as never)).toBe(false);
    expect(repository.setSpecialization('ember', 'ember_cannon')).toBe(true);
    expect(repository.setPreparationTargeting('tempest', 'closest')).toBe(true);
    expect(repository.savePreparationPreset('boss', 'Boss')).toBe(true);
    const bossPreset = new CampaignRepository(store).view().profile.preparationPresets.find(({ id }) => id === 'boss')!;
    expect(bossPreset.choices).toEqual(repository.view().profile.choices);
    expect(bossPreset.targeting).toEqual(repository.view().profile.targeting);
    expect(repository.setSpecialization('ember', null)).toBe(true);
    expect(repository.setPreparationTargeting('tempest', 'weakest')).toBe(true);
    expect(repository.loadPreparationPreset('boss')).toBe(true);
    expect(repository.view().profile.choices).toEqual(bossPreset.choices);
    expect(repository.view().profile.targeting).toEqual(bossPreset.targeting);
    expect(repository.savePreparationPreset('third', 'Third')).toBe(true);
    expect(repository.savePreparationPreset('fourth', 'Fourth')).toBe(false);
    expect(repository.loadPreparationPreset('opening')).toBe(true);
    expect(repository.view().profile.choices.ember).toBeNull();
    expect(repository.view().profile.targeting).toMatchObject({ longbow: 'last', starfire: 'strongest' });

    for (const level of [11, 12, 13, 14]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(42);
    expect(repository.view().unlockedFeatures).not.toContain('one_powerup_reroll_per_level');
    earnStar(repository, 15, 'completion');
    earnStar(repository, 15, 'lives');
    expect(repository.view().totalMasteryStars).toBe(44);
    expect(repository.view().unlockedFeatures).not.toContain('one_powerup_reroll_per_level');
    earnStar(repository, 15, 'score');
    gate(45, 'one_powerup_reroll_per_level');

    for (const level of [16, 17, 18, 19]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(57);
    expect(campaignPowerUpPool(repository.view())).toEqual([...BASE_POWER_UPS, 'meteor_strike']);
    expect(isWorldUnlocked('frostveil', repository.view())).toBe(false);
    expect(isLevelUnlocked(20, repository.view())).toBe(true);
    expect(isLevelUnlocked(21, repository.view())).toBe(false);
    const ember = earnStar(repository, 20, 'completion');
    earnStar(repository, 20, 'lives');
    expect(repository.view().totalMasteryStars).toBe(59);
    expect(repository.view().unlockedFeatures).not.toContain('tower_visual_tier_iii');
    earnStar(repository, 20, 'score');
    gate(60, 'tower_visual_tier_iii');
    expect(ember.newlyEarnedSigils).toEqual(['ember_sigil']);
    expect(isWorldUnlocked('frostveil', repository.view())).toBe(true);
    expect(isLevelUnlocked(21, repository.view())).toBe(true);
    expect(campaignPowerUpPool(repository.view())).toEqual([...BASE_POWER_UPS, 'meteor_strike', 'battle_cry']);

    for (const level of [21, 22, 23, 24]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(72);
    earnStar(repository, 25, 'completion');
    earnStar(repository, 25, 'lives');
    expect(repository.view().totalMasteryStars).toBe(74);
    expect(repository.view().unlockedFeatures).not.toContain('veteran_banner');
    earnStar(repository, 25, 'score');
    gate(75, 'veteran_banner');
    expect(repository.view().unlockedFeatures).toContain('advanced_codex_stats');

    for (const level of [26, 27, 28, 29]) earnThreeStars(repository, level);
    expect(repository.view().totalMasteryStars).toBe(87);
    expect(campaignPowerUpPool(repository.view())).toEqual([...BASE_POWER_UPS, 'meteor_strike', 'battle_cry']);
    const frost = earnStar(repository, 30, 'completion');
    earnStar(repository, 30, 'lives');
    expect(repository.view().totalMasteryStars).toBe(89);
    expect(repository.view().unlockedFeatures).not.toContain('frostveil_conqueror_crest');
    earnStar(repository, 30, 'score');
    gate(90, 'frostveil_conqueror_crest');
    expect(repository.view().totalMasteryStars).toBe(90);
    expect(repository.view().profile.worldSigils).toEqual(['border_sigil', 'ember_sigil', 'frost_sigil']);
    expect(frost.newlyEarnedSigils).toEqual(['frost_sigil']);
    expect(repository.view().unlockedFeatures).toEqual(expect.arrayContaining(['worlds_1_3_milestone_complete', 'frostbound_matriarch_codex_entry', 'time_lock_powerup']));
    expect(campaignPowerUpPool(repository.view())).toEqual([...BASE_POWER_UPS, 'meteor_strike', 'battle_cry', 'time_freeze']);
    expect(isLevelUnlocked(31, repository.view())).toBe(false);
    expect(repository.recordClear(30, 30000, 30)!.totalMasteryStars).toBe(90);
    expect(totalMasteryStars(repository.view().profile)).toBe(90);

    const reloaded = new CampaignRepository(store).view();
    expect(reloaded.highestUnlockedLevel).toBe(30);
    expect(totalMasteryStars(reloaded.profile)).toBe(90);
    expect(reloaded.profile.worldSigils).toEqual(['border_sigil', 'ember_sigil', 'frost_sigil']);
    expect(reloaded.profile.choices.ember).toBeNull();
    expect(reloaded.profile.targeting).toMatchObject({ longbow: 'last', starfire: 'strongest' });
    expect(reloaded.profile.preparationPresets).toHaveLength(3);
    expect(reloaded.profile.campaignVersion).toBe(1);
    expect(reloaded.profile.progressionVersion).toBe(1);
    expect(JSON.parse(store.value!).campaignVersion).toBe(1);
    expect(JSON.parse(store.value!).progressionVersion).toBe(1);
    expect(CAMPAIGN_SIGILS.map(({ id, level }) => [id, level])).toEqual([
      ['border_sigil', 10], ['ember_sigil', 20], ['frost_sigil', 30]
    ]);
    expect(CAMPAIGN_MILESTONES.map(({ stars, unlocks }) => [stars, [...unlocks]])).toEqual([
      [10, ['aether_codex_tactics']],
      [20, ['battle_preparation_presets']],
      [30, ['tower_specialization_i']],
      [45, ['one_powerup_reroll_per_level']],
      [60, ['tower_visual_tier_iii']],
      [75, ['veteran_banner', 'advanced_codex_stats']],
      [90, ['frostveil_conqueror_crest']]
    ]);
  });

  it('merges session earnings from readable tabs without losing stars or either best', () => {
    const store = new IndependentStore();
    const firstTab = new CampaignRepository(store);
    store.failWrite = true;
    const target = getCampaignLevel(1)!.mastery;
    const local = firstTab.recordClear(1, target.scoreTarget, 1)!;
    expect(local.saved).toBe(false);
    expect(local.progress.scoreStar).toBe(true);
    store.failWrite = false;

    const secondTab = new CampaignRepository(store);
    const remote = secondTab.recordClear(1, target.scoreTarget - 1, target.minimumLivesForStar + 5)!;
    expect(remote.progress.livesStar).toBe(true);
    firstTab.reconcile();
    const merged = new CampaignRepository(store).view().profile.levels[1]!;
    expect(merged).toMatchObject({
      completed: true, completionStar: true, livesStar: true, scoreStar: true,
      bestScore: target.scoreTarget, bestRemainingLives: target.minimumLivesForStar + 5
    });
    expect(firstTab.prepareSave().saved).toBe(true);
  });

  it.each([
    ['malformed JSON', '{broken', CAMPAIGN_UNREADABLE_WARNING],
    ['unsupported earlier campaign version', JSON.stringify({ ...createEmptyCampaignProfile(), campaignVersion: 0, preserve: 'bytes' }), CAMPAIGN_UNREADABLE_WARNING],
    ['future campaign version', JSON.stringify({ ...createEmptyCampaignProfile(), campaignVersion: 2, preserve: 'bytes' }), CAMPAIGN_NEWER_WARNING],
    ['future progression version', JSON.stringify({ ...createEmptyCampaignProfile(), progressionVersion: 2, preserve: 'bytes' }), CAMPAIGN_NEWER_WARNING],
    ['unknown schema field', JSON.stringify({ ...createEmptyCampaignProfile(), preserve: { opaque: true } }), CAMPAIGN_UNREADABLE_WARNING]
  ])('preserves %s bytes and keeps new earnings only for the session', (_label, raw, warning) => {
    const store = new IndependentStore(raw);
    const repository = new CampaignRepository(store);
    const result = repository.recordClear(1, getCampaignLevel(1)!.mastery.scoreTarget, getCampaignLevel(1)!.mastery.minimumLivesForStar)!;

    expect(result.saved).toBe(false);
    expect(result.warning).toBe(warning);
    expect(repository.view().profile.levels[1]?.completionStar).toBe(true);
    repository.reconcile();
    expect(store.value).toBe(raw);
    expect(store.writes).toBe(0);
  });

  it('reports denied storage, keeps session progress, and retries without losing it', () => {
    const deniedStore = new IndependentStore();
    deniedStore.failRead = true;
    const denied = new CampaignRepository(deniedStore);
    const deniedClear = denied.recordClear(1, 1950, 12)!;
    expect(deniedClear.saved).toBe(false);
    expect(deniedClear.warning).toBe(CAMPAIGN_UNAVAILABLE_WARNING);
    expect(denied.view().profile.levels[1]?.completed).toBe(true);
    expect(deniedStore.writes).toBe(0);

    const retryStore = new IndependentStore();
    retryStore.failWrite = true;
    const retry = new CampaignRepository(retryStore);
    expect(retry.recordClear(1, 1950, 12)!.warning).not.toBeNull();
    expect(retry.prepareSave().saved).toBe(false);
    retryStore.failWrite = false;
    retry.reconcile();
    expect(retry.prepareSave().saved).toBe(true);
    expect(new CampaignRepository(retryStore).view().profile.levels[1]).toMatchObject({ completed: true, livesStar: true, scoreStar: true });

    const noStorage = new CampaignRepository(null);
    expect(noStorage.recordClear(1, 1950, 12)!.warning).toBe(CAMPAIGN_UNAVAILABLE_WARNING);
    expect(noStorage.prepareSave().saved).toBe(false);
    expect(noStorage.prepareSave().profile.levels[1]?.completed).toBe(true);
  });
});
