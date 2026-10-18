import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, getCampaignLevel } from '../src/game/campaign/config.ts';
import { campaignScoreMetadata, legacyCampaignScoreTarget } from '../src/shared/campaignScoring.ts';
import { emptyCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';
import { guestRunProgress } from '../src/game/systems/GuestProgress.ts';

/** A pre-`campaignScore` level entry: a raw best score carrying a score star. */
function legacyLevel(level: number, bestScore: number) {
  return {
    completed: true, completionStar: true, livesStar: false, scoreStar: true,
    bestScore, bestRemainingLives: 0
  };
}

function progressWith(level: number, entry: unknown) {
  return { ...emptyCloudProgress(), levels: { [level]: entry } };
}

describe('legacy campaign score target', () => {
  it('never exceeds the live bar on any level', () => {
    for (const { level } of CAMPAIGN_LEVELS) {
      const live = campaignScoreMetadata(level).scoreTarget;
      const legacy = legacyCampaignScoreTarget(level);
      expect(legacy, `level ${level}`).toBeLessThanOrEqual(live);
      expect(Number.isSafeInteger(legacy), `level ${level}`).toBe(true);
    }
  });

  it('keeps the authored bars that sit below the live bar, for levels 1 and 2', () => {
    for (const level of [1, 2]) {
      const authored = getCampaignLevel(level)!.mastery.scoreTarget;
      expect(authored).toBeLessThan(campaignScoreMetadata(level).scoreTarget);
      expect(legacyCampaignScoreTarget(level)).toBe(authored);
    }
    expect(legacyCampaignScoreTarget(1)).toBe(1950);
    expect(legacyCampaignScoreTarget(2)).toBe(2400);
  });

  it('drops the authored bars that sit above the perfect score down to the live bar', () => {
    // 98 of 100 levels author an unreachable bar; level 30 authors 21,500 against a
    // perfect score of 9,490.
    const unreachable = CAMPAIGN_LEVELS.filter(({ level }) => getCampaignLevel(level)!.mastery.scoreTarget > campaignScoreMetadata(level).perfectScore);
    expect(unreachable).toHaveLength(98);
    expect(unreachable.some(({ level }) => level === 30)).toBe(true);
    for (const { level } of unreachable) {
      expect(legacyCampaignScoreTarget(level), `level ${level}`).toBe(campaignScoreMetadata(level).scoreTarget);
    }
  });

  it('preserves a below-live legacy score star at level 1 and rejects one point short', () => {
    expect(validateCloudProgress(progressWith(1, legacyLevel(1, 1950)))).not.toBeNull();
    expect(validateCloudProgress(progressWith(1, legacyLevel(1, 1949)))).toBeNull();
  });

  it('now accepts a legacy score star that reaches the live bar on a previously unreachable level', () => {
    const live = campaignScoreMetadata(30).scoreTarget;
    expect(getCampaignLevel(30)!.mastery.scoreTarget).toBeGreaterThan(live);
    expect(validateCloudProgress(progressWith(30, legacyLevel(30, live)))).not.toBeNull();
    expect(validateCloudProgress(progressWith(30, legacyLevel(30, live - 1)))).toBeNull();
  });

  it('awards the legacy guest payload star at the clamped bar', () => {
    const level = getCampaignLevel(30)!;
    const live = campaignScoreMetadata(30).scoreTarget;
    const cleared = guestRunProgress({
      mode: 'campaign',
      payload: {
        runId: 'legacy-run-30', campaignVersion: 1, progressionVersion: 1, level: 30,
        outcome: 'victory', finalScore: live, remainingLives: level.mastery.minimumLivesForStar,
        gameDurationSeconds: 10, gameVersion: '0.3.0'
      }
    }, {});

    expect(cleared.progress.levels[30]).toMatchObject({ completed: true, scoreStar: true, bestScore: live });
    expect(validateCloudProgress(cleared.progress)).not.toBeNull();
  });
});
