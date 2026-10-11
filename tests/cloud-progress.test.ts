import { describe, expect, it } from 'vitest';
import { emptyCloudProgress, mergeCloudProgress, validateCloudProgress } from '../src/shared/cloudProgress.ts';
import { validateCampaignResult } from '../src/shared/campaignResult.ts';
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
  expect(validateCampaignResult({...result,level:99})).toBeNull();
  expect(validateCampaignResult({...result,finalScore:Infinity})).toBeNull();
});
