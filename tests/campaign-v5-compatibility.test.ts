import { describe, expect, it } from 'vitest';
import legacyCloudCompleted30 from './fixtures/campaign-v5/legacy_cloud_completed_30.json';
import futureVersionRaw from './fixtures/campaign-v5/future_version_must_not_overwrite.json?raw';
import registryArtContract from './fixtures/campaign-v5/registry-art-contract.json';
import legacyLocalCompleted30 from './fixtures/campaign-v5/legacy_local_completed_30.json';
import legacyLocalPartial7 from './fixtures/campaign-v5/legacy_local_partial_7.json';
import { CAMPAIGN_LEVELS, CAMPAIGN_SIGILS, CAMPAIGN_WORLDS, getCampaignLevel } from '../src/game/campaign/config.ts';
import { CAMPAIGN_ROUTES, resolveCampaignMap } from '../src/game/campaign/maps.ts';
import { AVAILABLE_CAMPAIGN_ART_PATHS, CAMPAIGN_ART_MANIFEST } from '../src/game/campaign/artManifest.ts';
import {
  CampaignRepository,
  createEmptyCampaignProfile,
  isLevelUnlocked,
  isWorldUnlocked,
  parseCampaignProfile
} from '../src/game/campaign/progress.ts';
import { mergeCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';

function memoryStorage(value: string | null) {
  let saved = value;
  return {
    getItem: (_key: string) => saved,
    setItem: (_key: string, next: string) => { saved = next; },
    read: () => saved
  };
}

describe('Campaign v5 save compatibility', () => {
  it('keeps the 100-level registry contiguous across ten worlds', () => {
    expect(CAMPAIGN_WORLDS).toHaveLength(10);
    expect(CAMPAIGN_LEVELS).toHaveLength(100);
    expect(CAMPAIGN_LEVELS.map(({ level }) => level)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
    for (const world of CAMPAIGN_WORLDS) {
      expect(CAMPAIGN_LEVELS.slice(world.levelStart - 1, world.levelEnd).every(({ worldId }) => worldId === world.id)).toBe(true);
    }
    expect(getCampaignLevel(31)?.worldId).toBe(CAMPAIGN_WORLDS[3]!.id);
    expect(getCampaignLevel(100)?.worldId).toBe(CAMPAIGN_WORLDS[9]!.id);
  });

  it('places boss encounters at each ten-level boundary', () => {
    for (let level = 10; level <= 100; level += 10) expect(getCampaignLevel(level)?.bossEnemyId).toBeTruthy();
  });

  it('resolves every expansion map family with usable paths and build plots', () => {
    for (const level of CAMPAIGN_LEVELS.slice(30)) {
      const family = `${level.worldId}_${level.mapLayoutId.slice(level.worldId.length + 1)[0]}`;
      expect(CAMPAIGN_ROUTES[family]).toBeDefined();
      const map = resolveCampaignMap(level);
      expect(map.waypoints.length).toBeGreaterThan(2);
      expect(map.buildable.length).toBeGreaterThan(0);
      expect(map.waypoints[map.waypoints.length - 1]).toEqual(map.gate);
    }
  });

  it('allows only the accepted World 4–6 art and withholds every other expansion asset', () => {
    const newWorlds = ['whisperfen', 'sunken_aether', 'ironroot', 'sky_isles', 'dreadmoon', 'astral_rift', 'aether_crown'];
    const oldEnemies = ['marchling', 'skitter', 'stoneback', 'ironhide', 'veilborn', 'cinderling', 'ashrunner', 'magmahide', 'ember_brute', 'ashcaller', 'snowstalker', 'icebound', 'frostback', 'glacier_knight', 'frost_shaman'];
    const oldBosses = ['hollow_warden', 'cinder_colossus', 'frostbound_matriarch'];
    const newAssets = CAMPAIGN_ART_MANIFEST.filter(asset =>
      newWorlds.some(world => asset.id === `world-panel:${world}` || asset.id.startsWith(`map:${world}:`)) ||
      asset.id.startsWith('enemy:') && !oldEnemies.includes(asset.id.slice(6)) ||
      asset.id.startsWith('boss:') && !oldBosses.includes(asset.id.slice(5))
    );
    expect(newAssets).toHaveLength(77);
    const acceptedIds = new Set(registryArtContract.livePromotions.assets.map(asset => asset.id));
    const accepted = newAssets.filter(asset => asset.state === 'final');
    expect(accepted.map(asset => asset.id).sort()).toEqual([...acceptedIds].sort());
    expect(accepted.every(asset => asset.temporary === null
      && !asset.qualityFlags.includes('final_art_unverified')
      && !asset.qualityFlags.includes('provisional_starter_art')
      && AVAILABLE_CAMPAIGN_ART_PATHS.includes(asset.path))).toBe(true);
    const withheld = newAssets.filter(asset => asset.state === 'final_required');
    expect(withheld).toHaveLength(44);
    for (const asset of withheld) {
      expect(AVAILABLE_CAMPAIGN_ART_PATHS).not.toContain(asset.path);
      expect(asset.qualityFlags).toContain('final_art_unverified');
    }
  });

  it('round-trips actual v1 save fixtures and merges expanded progress without changing legacy settings', () => {
    const legacyLocal = parseCampaignProfile(legacyLocalCompleted30)!;
    const partialLocal = parseCampaignProfile(legacyLocalPartial7)!;
    const legacyCloud = validateCloudProgress(legacyCloudCompleted30)!;
    expect([legacyLocal.campaignVersion, legacyLocal.progressionVersion]).toEqual([1, 1]);
    expect(legacyLocal.levels[30]?.completed).toBe(true);
    expect(partialLocal.highestUnlockedLevel).toBe(8);
    expect(legacyCloud.levels[30]?.completed).toBe(true);
    expect(CAMPAIGN_SIGILS.find(({ id }) => id === 'frost_sigil')?.level).toBe(30);

    const completion = { completed: true, completionStar: true, livesStar: false, scoreStar: false, bestScore: 0, bestRemainingLives: 0 };
    const expandedCloud = structuredClone(legacyCloud);
    for (let level = 31; level <= 100; level++) expandedCloud.levels[level] = completion;
    expect(validateCloudProgress(expandedCloud)?.levels[100]).toEqual(completion);
    const afterOldCloudUpload = mergeCloudProgress(expandedCloud, legacyCloud);
    expect(afterOldCloudUpload.levels[31]).toEqual(completion);
    expect(afterOldCloudUpload.levels[100]).toEqual(completion);

    const storage = memoryStorage(JSON.stringify(legacyLocalCompleted30));
    const repository = new CampaignRepository(storage);
    repository.applyCloud(expandedCloud.levels);
    const reloaded = new CampaignRepository(storage).view();
    expect(reloaded.profile.levels[31]).toEqual(completion);
    expect(reloaded.profile.levels[40]).toEqual(completion);
    expect(reloaded.profile.levels[100]).toEqual(completion);
    expect(reloaded.profile.choices).toEqual(legacyLocal.choices);
    expect(reloaded.profile.targeting).toEqual(legacyLocal.targeting);
    expect(reloaded.profile.preparationPresets).toEqual(legacyLocal.preparationPresets);
    expect(reloaded.profile.worldSigils).toContain('frost_sigil');
    expect(reloaded.unlockedFeatures).toContain('campaign_100_clear');
    expect(isLevelUnlocked(100, reloaded)).toBe(true);
    expect(isWorldUnlocked(CAMPAIGN_WORLDS[3]!.id, reloaded)).toBe(true);
    expect(JSON.parse(storage.read()!).campaignVersion).toBe(1);
    expect(JSON.parse(storage.read()!).progressionVersion).toBe(1);

    for (const key of ['01', '101', '1e0']) {
      expect(parseCampaignProfile({ ...createEmptyCampaignProfile(), levels: { [key]: completion } })).toBeNull();
      expect(validateCloudProgress({ ...legacyCloudCompleted30, levels: { [key]: completion } })).toBeNull();
    }
  });

  it('preserves the exact future-version fixture bytes when attempting a local clear', () => {
    const storage = memoryStorage(futureVersionRaw);
    const repository = new CampaignRepository(storage);
    expect(repository.recordClear(1, 1950, 12)?.saved).toBe(false);
    expect(storage.read()).toBe(futureVersionRaw);
  });
});
