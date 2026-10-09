import { describe, expect, it } from 'vitest';
import { getCampaignLevel } from '../src/game/campaign/config.ts';
import {
  CAMPAIGN_STORAGE_KEY,
  CAMPAIGN_UNAVAILABLE_WARNING,
  CAMPAIGN_NEWER_WARNING,
  CAMPAIGN_SAVE_FAILED_WARNING,
  CampaignRepository,
  campaignPowerUpPool,
  createEmptyCampaignProfile,
  isLevelUnlocked,
  isWorldUnlocked,
  totalMasteryStars,
  type CampaignStorage
} from '../src/game/campaign/progress.ts';

class MemoryStore implements CampaignStorage {
  value: string | null;
  writes = 0;
  failRead = false;
  failWrite = false;
  keys: string[] = [];

  constructor(initial: string | null = null) { this.value = initial; }

  getItem = (key: string): string | null => {
    this.keys.push(key);
    if (this.failRead) throw new Error('storage access denied');
    return this.value;
  };

  setItem = (key: string, value: string): void => {
    this.keys.push(key);
    if (this.failWrite) throw new Error('quota exceeded');
    this.value = value;
    this.writes++;
  };
}

function completeThrough(repository: CampaignRepository, through: number): void {
  for (let level = 1; level <= through; level++) {
    const definition = getCampaignLevel(level)!;
    expect(repository.recordClear(level, definition.mastery.scoreTarget, definition.mastery.minimumLivesForStar)).not.toBeNull();
  }
}

describe('campaign progress', () => {
  it('starts at level one with initialized choices and targeting preferences', () => {
    const store = new MemoryStore();
    const repository = new CampaignRepository(store);
    const view = repository.view();

    expect(view.profile.campaignVersion).toBe(1);
    expect(view.profile.progressionVersion).toBe(1);
    expect(view.profile.choices).toEqual({ longbow: null, ember: null, glacier: null, starfire: null, tempest: null });
    expect(view.profile.targeting).toEqual({ longbow: 'first', ember: 'first', glacier: 'first', starfire: 'first', tempest: 'first' });
    expect(view.highestUnlockedLevel).toBe(1);
    expect(isLevelUnlocked(1, view)).toBe(true);
    expect(isLevelUnlocked(2, view)).toBe(false);
    expect(store.writes).toBe(0);
  });

  it('accumulates each star independently and keeps best score and lives on replay', () => {
    const repository = new CampaignRepository(new MemoryStore());
    expect(repository.recordClear(2, 2500, 20)).toBeNull();
    expect(repository.recordClear(1, 2500, 0)).toBeNull();

    const first = repository.recordClear(1, 1000, 4)!;
    expect(first.newlyEarnedStars).toEqual(['completion']);
    expect(first.progress).toMatchObject({ completed: true, completionStar: true, livesStar: false, scoreStar: false, bestScore: 1000, bestRemainingLives: 4 });
    expect(first.totalMasteryStars).toBe(1);

    const replay = repository.recordClear(1, 1950, 12)!;
    expect(replay.newlyEarnedStars).toEqual(['lives', 'score']);
    expect(replay.progress).toMatchObject({ livesStar: true, scoreStar: true, bestScore: 1950, bestRemainingLives: 12 });
    expect(replay.totalMasteryStars).toBe(3);
    expect(isLevelUnlocked(2, repository.view())).toBe(true);

    const weakerReplay = repository.recordClear(1, 400, 1)!;
    expect(weakerReplay.newlyEarnedStars).toEqual([]);
    expect(weakerReplay.progress).toMatchObject({ completionStar: true, livesStar: true, scoreStar: true, bestScore: 1950, bestRemainingLives: 12 });
    expect(totalMasteryStars(repository.view().profile)).toBe(3);
  });

  it('derives the three world unlocks, milestone features, and campaign power-up pool', () => {
    const repository = new CampaignRepository(new MemoryStore());
    expect(isWorldUnlocked('emberfall', repository.view())).toBe(false);
    expect(campaignPowerUpPool(repository.view())).not.toContain('meteor_strike');

    completeThrough(repository, 10);
    const border = repository.view();
    expect(border.totalMasteryStars).toBe(30);
    expect(border.profile.worldSigils).toContain('border_sigil');
    expect(border.unlockedFeatures).toEqual(expect.arrayContaining([
      'aether_codex_tactics', 'tower_specialization_i', 'world_2', 'tower_visual_tier_ii',
      'hollow_warden_codex_entry', 'meteor_strike_powerup'
    ]));
    expect(isWorldUnlocked('emberfall', border)).toBe(true);
    expect(isLevelUnlocked(11, border)).toBe(true);
    expect(campaignPowerUpPool(border)).toContain('meteor_strike');
    expect(repository.recordClear(12, 10000, 20)).toBeNull();

    completeThrough(repository, 20);
    const ember = repository.view();
    expect(ember.profile.worldSigils).toContain('ember_sigil');
    expect(ember.unlockedFeatures).toEqual(expect.arrayContaining(['world_3', 'emberfall_cosmetics', 'battle_tempo_powerup']));
    expect(isWorldUnlocked('frostveil', ember)).toBe(true);
    expect(campaignPowerUpPool(ember)).toContain('battle_cry');

    completeThrough(repository, 30);
    const frost = repository.view();
    expect(frost.totalMasteryStars).toBe(90);
    expect(frost.profile.worldSigils).toEqual(['border_sigil', 'ember_sigil', 'frost_sigil']);
    expect(frost.unlockedFeatures).toEqual(expect.arrayContaining([
      'one_powerup_reroll_per_level', 'tower_visual_tier_iii', 'veteran_banner', 'advanced_codex_stats',
      'frostveil_conqueror_crest', 'frostbound_matriarch_codex_entry', 'time_lock_powerup'
    ]));
    expect(isLevelUnlocked(30, frost)).toBe(true);
    expect(isLevelUnlocked(31, frost)).toBe(false);
    expect(campaignPowerUpPool(frost)).toEqual(expect.arrayContaining(['meteor_strike', 'battle_cry', 'time_freeze']));
    expect(repository.view().profile.highestUnlockedLevel).toBe(30);
  });

  it('gates specialization and preparation controls, persists at most three presets, and reloads them', () => {
    const store = new MemoryStore();
    const repository = new CampaignRepository(store);
    expect(repository.setPreparationTargeting('longbow', 'last')).toBe(false);
    expect(repository.setSpecialization('longbow', 'longbow_bastion')).toBe(false);

    completeThrough(repository, 7);
    expect(repository.view().totalMasteryStars).toBe(21);
    expect(repository.setPreparationTargeting('starfire', 'strongest')).toBe(true);
    expect(repository.savePreparationPreset('opening', 'Opening')).toBe(true);
    expect(repository.setPreparationTargeting('starfire', 'last')).toBe(true);
    expect(repository.savePreparationPreset('rush', 'Runners')).toBe(true);
    expect(repository.savePreparationPreset('boss', 'Boss')).toBe(true);
    expect(repository.savePreparationPreset('fourth', 'Extra')).toBe(false);
    expect(repository.setPreparationTargeting('starfire', 'closest')).toBe(true);
    expect(repository.loadPreparationPreset('opening')).toBe(true);
    expect(repository.view().profile.targeting.starfire).toBe('strongest');
    expect(repository.deletePreparationPreset('rush')).toBe(true);
    expect(repository.savePreparationPreset('fourth', 'Extra')).toBe(true);

    completeThrough(repository, 10);
    expect(repository.setSpecialization('longbow', 'longbow_bastion')).toBe(true);
    expect(repository.setSpecialization('ember', 'longbow_bastion')).toBe(false);
    expect(repository.view().profile.choices.longbow).toBe('longbow_bastion');
    const reloaded = new CampaignRepository(store).view();
    expect(reloaded.profile.choices.longbow).toBe('longbow_bastion');
    expect(reloaded.profile.targeting.starfire).toBe('strongest');
    expect(reloaded.profile.preparationPresets).toHaveLength(3);
  });

  it('merges readable tab writes without losing stars or either best', () => {
    const store = new MemoryStore();
    const firstTab = new CampaignRepository(store);
    store.failWrite = true;
    const local = firstTab.recordClear(1, 1950, 4)!;
    expect(local.saved).toBe(false);
    expect(local.warning).toBe(CAMPAIGN_SAVE_FAILED_WARNING);
    store.failWrite = false;

    const secondTab = new CampaignRepository(store);
    secondTab.recordClear(1, 1000, 15);
    firstTab.reconcile();
    const merged = new CampaignRepository(store).view();
    expect(merged.profile.levels[1]).toMatchObject({
      completed: true, completionStar: true, scoreStar: true, livesStar: true,
      bestScore: 1950, bestRemainingLives: 15
    });
    expect(firstTab.view().unsaved).toBe(false);
    expect(store.keys.every((key) => key === CAMPAIGN_STORAGE_KEY)).toBe(true);
  });

  it('keeps a previously-read higher profile marked unsaved after a stale readable overwrite', () => {
    const store = new MemoryStore();
    const repository = new CampaignRepository(store);
    completeThrough(repository, 1);
    const emptyButReadable = JSON.stringify(createEmptyCampaignProfile());
    store.value = emptyButReadable;
    store.failWrite = true;

    const view = repository.view();
    expect(view.profile.levels[1]?.scoreStar).toBe(true);
    expect(view.unsaved).toBe(true);
    expect(view.unsavedLevels.has(1)).toBe(true);
    expect(repository.prepareSave().saved).toBe(false);

    store.failWrite = false;
    repository.reconcile();
    expect(repository.view().unsaved).toBe(false);
    expect(new CampaignRepository(store).view().profile.levels[1]?.livesStar).toBe(true);
  });

  it.each([
    '{broken',
    '{"campaignVersion":1,"progressionVersion":2,"future":"keep these bytes"}',
    '{"campaignVersion":1,"progressionVersion":1,"highestUnlockedLevel":1,"levels":{"1":{"completed":true}},"worldSigils":[],"unlockedFeatures":[],"choices":{},"targeting":{},"preparationPresets":[]}',
    JSON.stringify({ ...createEmptyCampaignProfile(), futureField: { keep: 'these bytes' } })
  ])('preserves malformed or future stored bytes while keeping session progress: %s', (raw) => {
    const store = new MemoryStore(raw);
    const repository = new CampaignRepository(store);
    const result = repository.recordClear(1, 1950, 12)!;
    expect(result.saved).toBe(false);
    expect(result.warning).not.toBeNull();
    if (raw.includes('"progressionVersion":2')) expect(repository.view().warning).toBe(CAMPAIGN_NEWER_WARNING);
    expect(repository.view().profile.levels[1]?.completionStar).toBe(true);
    repository.reconcile();
    expect(store.value).toBe(raw);
    expect(store.writes).toBe(0);

    store.value = null;
    repository.reconcile();
    expect(repository.view().warning).toBeNull();
    expect(repository.view().profile.levels[1]?.scoreStar).toBe(true);
    expect(store.writes).toBe(1);
  });

  it('derives unlocks from earned progress instead of trusting stored summary fields', () => {
    const forgedProfile = createEmptyCampaignProfile();
    forgedProfile.highestUnlockedLevel = 30;
    forgedProfile.unlockedFeatures = ['world_3', 'tower_specialization_i'];
    const forgedRaw = JSON.stringify(forgedProfile);
    const store = new MemoryStore(forgedRaw);
    const view = new CampaignRepository(store).view();
    expect(view.highestUnlockedLevel).toBe(1);
    expect(view.unlockedFeatures).toEqual([]);
    expect(isLevelUnlocked(30, view)).toBe(false);
    expect(isWorldUnlocked('frostveil', view)).toBe(false);
    expect(store.value).toBe(forgedRaw);
    expect(store.writes).toBe(0);

    const forgedSigil = createEmptyCampaignProfile();
    forgedSigil.worldSigils = ['border_sigil'];
    const sigilRaw = JSON.stringify(forgedSigil);
    const guardedStore = new MemoryStore(sigilRaw);
    const guardedRepository = new CampaignRepository(guardedStore);
    expect(guardedRepository.view().warning).not.toBeNull();
    guardedRepository.recordClear(1, 1950, 12);
    expect(guardedStore.value).toBe(sigilRaw);
    expect(guardedStore.writes).toBe(0);
  });

  it('keeps progress in session when storage is denied or unavailable and retries a failed write', () => {
    const denied = new MemoryStore();
    denied.failRead = true;
    const deniedRepository = new CampaignRepository(denied);
    const deniedResult = deniedRepository.recordClear(1, 1950, 12)!;
    expect(deniedResult.saved).toBe(false);
    expect(deniedResult.warning).toBe(CAMPAIGN_UNAVAILABLE_WARNING);
    expect(deniedRepository.view().profile.levels[1]?.completed).toBe(true);

    const unavailable = new CampaignRepository(null);
    unavailable.recordClear(1, 1950, 12);
    expect(unavailable.prepareSave().saved).toBe(false);
    expect(unavailable.prepareSave().warning).toBe(CAMPAIGN_UNAVAILABLE_WARNING);
    expect(createEmptyCampaignProfile().highestUnlockedLevel).toBe(1);

    const quota = new MemoryStore();
    quota.failWrite = true;
    const quotaRepository = new CampaignRepository(quota);
    quotaRepository.recordClear(1, 1950, 12);
    expect(quotaRepository.view().warning).toBe(CAMPAIGN_SAVE_FAILED_WARNING);
    quota.failWrite = false;
    quotaRepository.reconcile();
    expect(quotaRepository.view().unsaved).toBe(false);
    expect(quotaRepository.view().warning).toBeNull();
  });
});
