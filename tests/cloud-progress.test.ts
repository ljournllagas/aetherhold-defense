import { describe, expect, it } from 'vitest';
import legacyCloudCompleted30 from './fixtures/campaign-v5/legacy_cloud_completed_30.json';
import { emptyCloudProgress, mergeCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';
import type { CloudProgress } from '../src/shared/account.ts';
import { createEmptyCampaignProfile, isLevelUnlocked } from '../src/game/campaign/progress.ts';
import { getCampaignLevel } from '../src/game/campaign/config.ts';
import { campaignScoreMetadata } from '../src/shared/campaignScoring.ts';
import { validateCampaignResult } from '../src/shared/campaignResult.ts';

function unlockedLevels(progress: CloudProgress): number[] {
  const profile = { ...createEmptyCampaignProfile(), levels: progress.levels };
  return [1, 2, 3, 4].filter(level => isLevelUnlocked(level, profile));
}

describe('cloud progress', () => {
  it('merges earned stars and retains maxima', () => {
    const a = emptyCloudProgress(), b = emptyCloudProgress();
    a.levels[1] = { completed:true, completionStar:true, livesStar:true, scoreStar:false, bestScore:100, bestRemainingLives:20 };
    b.levels[1] = { completed:true, completionStar:true, livesStar:false, scoreStar:true, bestScore:100000, bestRemainingLives:10 };
    expect(mergeCloudProgress(a,b).levels[1]).toEqual({ completed:true, completionStar:true, livesStar:true, scoreStar:true, bestScore:100000, bestRemainingLives:20 });
    expect(mergeCloudProgress(a,b)).toEqual(mergeCloudProgress(b,a));
  });
  it('rejects future versions, unknown fields and inconsistent awards', () => {
    expect(validateCloudProgress(emptyCloudProgress())).not.toBeNull();
    expect(validateCloudProgress({...emptyCloudProgress(),version:99})).toBeNull();
    expect(validateCloudProgress({...emptyCloudProgress(),admin:true})).toBeNull();
    expect(validateCloudProgress({...emptyCloudProgress(),levels:{1:{completed:false,completionStar:false,livesStar:true,scoreStar:false,bestScore:1,bestRemainingLives:20}}})).toBeNull();
  });
  it('round-trips the legacy fixture and accepts only canonical registered level IDs through 100', () => {
    expect(validateCloudProgress(legacyCloudCompleted30)?.levels[30]).toMatchObject({ completed:true, completionStar:true });
    const progress=emptyCloudProgress(), completion={completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:0,bestRemainingLives:0};
    for(const level of [31,40,100]) progress.levels[level]=completion;
    expect(validateCloudProgress(progress)?.levels).toEqual(progress.levels);
    for(const key of ['01','101','1e0']) expect(validateCloudProgress({...progress,levels:{[key]:completion}})).toBeNull();
    const oldUpload=validateCloudProgress(legacyCloudCompleted30)!;
    const merged=mergeCloudProgress(progress,oldUpload);
    expect(merged.levels[31]).toEqual(completion);
    expect(merged.levels[100]).toEqual(completion);
    expect(merged.levels[30]).toMatchObject({completed:true,completionStar:true});
  });
  it('parses and merges two devices with independent Campaign bests and derived unlocks', () => {
    const metadata = campaignScoreMetadata(1);
    const mastery = getCampaignLevel(1)!.mastery;
    const a = emptyCloudProgress(), b = emptyCloudProgress();
    a.levels[1] = {
      completed:true, completionStar:true, livesStar:true, scoreStar:false,
      bestScore:mastery.scoreTarget - 1, bestRemainingLives:mastery.minimumLivesForStar,
      campaignScore:{version:1,bestScore:metadata.scoreTarget - 1}
    };
    b.levels[1] = {
      completed:true, completionStar:true, livesStar:false, scoreStar:true,
      bestScore:mastery.scoreTarget - 2, bestRemainingLives:Math.max(0,mastery.minimumLivesForStar - 1),
      campaignScore:{version:1,bestScore:metadata.scoreTarget}
    };
    b.levels[2] = {completed:true,completionStar:true,livesStar:false,scoreStar:false,bestScore:0,bestRemainingLives:0};
    a.bests=[
      {score:100,wave:10,difficulty:'easy',date:'2026-01-01T00:00:00Z',scoreVersion:1},
      {score:300,wave:10,difficulty:'hard',date:'2026-01-02T00:00:00Z',scoreVersion:3}
    ];
    b.bests=[
      {score:125,wave:12,difficulty:'easy',date:'2026-01-03T00:00:00Z',scoreVersion:1},
      {score:250,wave:9,difficulty:'hard',date:'2026-01-04T00:00:00Z',scoreVersion:3}
    ];

    const parsedA = validateCloudProgress(a)!;
    expect(parsedA.levels[1]).toEqual(a.levels[1]);
    parsedA.levels[1]!.campaignScore!.bestScore = 1;
    expect(a.levels[1]!.campaignScore!.bestScore).toBe(metadata.scoreTarget - 1);
    expect(validateCloudProgress({
      ...a,
      levels:{...a.levels,1:{...a.levels[1]!,campaignScore:{version:2,bestScore:metadata.scoreTarget}}}
    })).toBeNull();

    const mergedAB = mergeCloudProgress(a,b);
    const mergedBA = mergeCloudProgress(b,a);
    expect(mergedAB.levels[1]).toEqual(mergedBA.levels[1]);
    expect(mergedAB.levels[1]).toMatchObject({
      completed:true, completionStar:true, livesStar:true, scoreStar:true,
      bestScore:mastery.scoreTarget - 1,
      campaignScore:{version:1,bestScore:metadata.scoreTarget}
    });
    expect(mergedAB.bests.map(({score,scoreVersion})=>[score,scoreVersion])).toEqual([[125,1],[300,3]]);
    expect(mergedAB.bests).toEqual(mergedBA.bests);
    expect(unlockedLevels(mergedAB)).toEqual([1,2,3]);
    expect(unlockedLevels(mergedBA)).toEqual([1,2,3]);

    mergedAB.levels[1]!.campaignScore!.bestScore = 1;
    expect(a.levels[1]!.campaignScore!.bestScore).toBe(metadata.scoreTarget - 1);
    expect(b.levels[1]!.campaignScore!.bestScore).toBe(metadata.scoreTarget);
    expect(mergedBA.levels[1]!.campaignScore!.bestScore).toBe(metadata.scoreTarget);
  });
  it('preserves separate score eras and existing ties', () => {
    const a=emptyCloudProgress(), b=emptyCloudProgress();
    a.bests=[{score:100,wave:10,difficulty:'easy',date:'2026-01-01T00:00:00Z',scoreVersion:1}];
    b.bests=[{...a.bests[0],scoreVersion:3}];
    expect(mergeCloudProgress(a,b).bests).toHaveLength(2);
  });
});
it('rejects invalid campaign results', () => {
  const result={runId:'run-test-123',campaignVersion:1,progressionVersion:1,level:1,outcome:'victory',finalScore:100,remainingLives:10,gameDurationSeconds:20,gameVersion:'0.3.0'};
  expect(validateCampaignResult(result)).not.toBeNull();
  expect(validateCampaignResult({...result,remainingLives:0})).toBeNull();
  expect(validateCampaignResult({...result,level:31})).not.toBeNull();
  expect(validateCampaignResult({...result,level:100})).not.toBeNull();
  expect(validateCampaignResult({...result,level:101})).toBeNull();
  expect(validateCampaignResult({...result,finalScore:Infinity})).toBeNull();
});
