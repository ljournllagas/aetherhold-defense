import { expect,it } from 'vitest';
import { canonicalResult } from '../worker/accountScores.ts';
import { campaignScoreMetadata, calculateCampaignScore } from '../src/shared/campaignScoring.ts';
import { validateCampaignResult } from '../src/shared/campaignResult.ts';
it('ignores client nickname while comparing immutable score data',()=>{
  const p={runId:'run-test-123',playerName:'Old',difficulty:'easy',highestWave:1,finalScore:100,enemiesKilled:1,bossesKilled:0,remainingLives:0,gameDurationSeconds:10,gameVersion:'0.3.0',scoreVersion:3,wavesCompleted:0,outcome:'defeat',siegeBossesDefeated:0};
  expect(canonicalResult({mode:'classic',payload:p})).toBe(canonicalResult({mode:'classic',payload:{...p,playerName:'New'}}));
  expect(canonicalResult({mode:'classic',payload:{...p,finalScore:101}})).not.toBe(canonicalResult({mode:'classic',payload:p}));
});

it('keeps every current Campaign arithmetic field in run identity',()=>{
  const metadata=campaignScoreMetadata(10),payload={runId:'campaign-run-123',campaignVersion:1,progressionVersion:1,level:10,outcome:'victory',finalScore:metadata.perfectScore,remainingLives:20,gameDurationSeconds:10,gameVersion:'0.3.0',campaignScoreVersion:1,scheduledEnemiesKilled:metadata.scheduledEnemyCount,wavesCompleted:metadata.waveCount,missionBossesKilled:1};
  const canonical=canonicalResult({mode:'campaign',payload});
  expect(canonicalResult({mode:'campaign',payload:{...payload,scheduledEnemiesKilled:payload.scheduledEnemiesKilled-1}})).not.toBe(canonical);
  expect(canonicalResult({mode:'campaign',payload:{...payload,wavesCompleted:payload.wavesCompleted-1}})).not.toBe(canonical);
  expect(canonicalResult({mode:'campaign',payload:{...payload,campaignScoreVersion:2}})).not.toBe(canonical);

  const defeatedBoss = {
    ...payload, outcome: 'defeat', remainingLives: 0,
    scheduledEnemiesKilled: metadata.scheduledEnemyCount - 1,
    wavesCompleted: metadata.waveCount - 1, missionBossesKilled: 1,
    finalScore: calculateCampaignScore({
      scheduledEnemiesKilled: metadata.scheduledEnemyCount - 1,
      wavesCompleted: metadata.waveCount - 1, missionBossesKilled: 1, remainingLives: 0
    }).finalScore
  };
  const bossSurvived = {
    ...defeatedBoss, missionBossesKilled: 0,
    finalScore: calculateCampaignScore({
      scheduledEnemiesKilled: metadata.scheduledEnemyCount - 1,
      wavesCompleted: metadata.waveCount - 1, missionBossesKilled: 0, remainingLives: 0
    }).finalScore
  };
  expect(validateCampaignResult(defeatedBoss)).toEqual(defeatedBoss);
  expect(validateCampaignResult(bossSurvived)).toEqual(bossSurvived);
  expect(defeatedBoss.finalScore - bossSurvived.finalScore).toBe(500);
  const bossCanonical = canonicalResult({mode:'campaign',payload:defeatedBoss});
  const survivedCanonical = canonicalResult({mode:'campaign',payload:bossSurvived});
  expect(bossCanonical).toContain('"missionBossesKilled":1');
  expect(survivedCanonical).toContain('"missionBossesKilled":0');
  expect(bossCanonical).not.toBe(survivedCanonical);
});
