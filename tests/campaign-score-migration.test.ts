import { describe, expect, it } from 'vitest';
import legacyCloudCompleted30 from './fixtures/campaign-v5/legacy_cloud_completed_30.json';
import legacyLocalCompleted30 from './fixtures/campaign-v5/legacy_local_completed_30.json';
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import {
  CampaignRepository,
  parseCampaignProfile,
  type CampaignStorage
} from '../src/game/campaign/progress.ts';
import {
  CAMPAIGN_SCORE_VERSION,
  campaignScoreMetadata
} from '../src/shared/campaignScoring.ts';
import {
  applyCampaignClear,
  cloneCampaignLevelProgress,
  mergeCampaignLevelProgress,
  validateCampaignLevelProgress
} from '../src/shared/campaignProgress.ts';
import {
  emptyCloudProgress,
  mergeCloudProgress,
  validateCloudProgress
} from '../src/shared/cloudProgress.ts';

class MemoryStore implements CampaignStorage {
  writes = 0;

  constructor(public value: string | null) {}

  getItem = (_key: string): string | null => this.value;
  setItem = (_key: string, value: string): void => {
    this.value = value;
    this.writes++;
  };
}

describe('Campaign current-score migration', () => {
  it('keeps real legacy bests and stars separate from current-era bests', () => {
    const local = parseCampaignProfile(legacyLocalCompleted30)!;
    const cloud = validateCloudProgress(legacyCloudCompleted30)!;
    const legacyLevel = {
      completed: true,
      completionStar: true,
      livesStar: true,
      scoreStar: true,
      bestScore: 3000,
      bestRemainingLives: 20
    };

    expect(local.levels[1]).toEqual(legacyLevel);
    expect(cloud.levels[1]).toEqual(legacyLevel);
    expect(local.levels[1]?.campaignScore).toBeUndefined();
    expect(cloud.levels[1]?.campaignScore).toBeUndefined();
    expect(validateCampaignLevelProgress(legacyLevel, 1)).toEqual(legacyLevel);
    expect(CAMPAIGN_SCORE_VERSION).toBe(1);

    const storage = new MemoryStore(JSON.stringify(legacyLocalCompleted30));
    const repository = new CampaignRepository(storage);
    const score = campaignScoreMetadata(31).scoreTarget;
    const clear = repository.recordClear(31, score, 20)!;
    const reloaded = new CampaignRepository(storage).view().profile;

    expect(clear.progress).toMatchObject({ bestScore: 0, campaignScore: { version: 1, bestScore: score } });
    expect(reloaded.levels[1]).toEqual(legacyLevel);
    expect(reloaded.levels[31]).toEqual(clear.progress);
  });

  it('awards score stars at the current target for all missions', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(100);
    for (const definition of CAMPAIGN_LEVELS) {
      const metadata = campaignScoreMetadata(definition.level);
      expect(applyCampaignClear(undefined, definition.level, metadata.scoreTarget, 20)?.scoreStar).toBe(true);
      expect(applyCampaignClear(undefined, definition.level, metadata.scoreTarget - 1, 20)?.scoreStar).toBe(false);
      expect(applyCampaignClear(undefined, definition.level, metadata.perfectScore, 20)?.scoreStar).toBe(true);
    }
  });

  it('retains legacy maxima and current-era maxima independently across stale uploads', () => {
    const current = emptyCloudProgress();
    current.levels[1] = applyCampaignClear(undefined, 1, campaignScoreMetadata(1).perfectScore, 20)!;
    const merged = mergeCloudProgress(current, validateCloudProgress(legacyCloudCompleted30)!);
    const reverse = mergeCloudProgress(validateCloudProgress(legacyCloudCompleted30)!, current);

    expect(merged.levels[1]).toEqual(reverse.levels[1]);
    expect(merged.levels[1]).toMatchObject({
      bestScore: 3000,
      campaignScore: { version: 1, bestScore: campaignScoreMetadata(1).perfectScore }
    });
    merged.levels[1]!.campaignScore!.bestScore = 1;
    expect(current.levels[1]?.campaignScore?.bestScore).toBe(campaignScoreMetadata(1).perfectScore);

    const currentOnly = applyCampaignClear(undefined, 1, campaignScoreMetadata(1).perfectScore, 8)!;
    const strongerLegacy = validateCampaignLevelProgress({
      completed: true,
      completionStar: true,
      livesStar: true,
      scoreStar: true,
      bestScore: 3000,
      bestRemainingLives: 20
    }, 1)!;
    expect(mergeCampaignLevelProgress(currentOnly, strongerLegacy)).toEqual({
      completed: true,
      completionStar: true,
      livesStar: true,
      scoreStar: true,
      bestScore: 3000,
      bestRemainingLives: 20,
      campaignScore: { version: 1, bestScore: campaignScoreMetadata(1).perfectScore }
    });
  });

  it('deep-clones current score data and rejects unsupported nested score saves', () => {
    const current = applyCampaignClear(undefined, 1, campaignScoreMetadata(1).perfectScore, 20)!;
    const clone = cloneCampaignLevelProgress(current);
    clone.campaignScore!.bestScore = 1;
    expect(current.campaignScore?.bestScore).toBe(campaignScoreMetadata(1).perfectScore);

    expect(validateCampaignLevelProgress({ ...current, campaignScore: { version: 2, bestScore: 1 } }, 1)).toBeNull();
    expect(validateCampaignLevelProgress({ ...current, campaignScore: { ...current.campaignScore, extra: true } }, 1)).toBeNull();
    expect(validateCampaignLevelProgress({ ...current, campaignScore: { version: 1, bestScore: campaignScoreMetadata(1).perfectScore + 1 } }, 1)).toBeNull();
    expect(validateCampaignLevelProgress({ ...current, completed: false, completionStar: false }, 1)).toBeNull();

    const raw = JSON.stringify({
      ...legacyLocalCompleted30,
      levels: {
        ...legacyLocalCompleted30.levels,
        1: { ...legacyLocalCompleted30.levels['1'], campaignScore: { version: 2, bestScore: 3000 } }
      }
    });
    const storage = new MemoryStore(raw);
    const repository = new CampaignRepository(storage);
    expect(repository.recordClear(1, campaignScoreMetadata(1).scoreTarget, 20)?.saved).toBe(false);
    expect(storage.value).toBe(raw);
    expect(storage.writes).toBe(0);
    expect(validateCloudProgress({
      ...legacyCloudCompleted30,
      levels: {
        ...legacyCloudCompleted30.levels,
        1: { ...legacyCloudCompleted30.levels['1'], campaignScore: { version: 2, bestScore: 3000 } }
      }
    })).toBeNull();
  });
});
