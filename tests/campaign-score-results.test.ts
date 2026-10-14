import { expect, it } from 'vitest';
import { campaignScoreMetadata, calculateCampaignScore } from '../src/shared/campaignScoring.ts';
import { validateCampaignResult } from '../src/shared/campaignResult.ts';

function currentResult(level: number, overrides: Record<string, unknown> = {}) {
  const metadata = campaignScoreMetadata(level);
  return {
    runId: 'campaign-run-123', campaignVersion: 1, progressionVersion: 1, level,
    outcome: 'victory' as const, remainingLives: 20, gameDurationSeconds: 100,
    gameVersion: '0.3.0', campaignScoreVersion: 1,
    scheduledEnemiesKilled: metadata.scheduledEnemyCount,
    wavesCompleted: metadata.waveCount,
    missionBossesKilled: Number(metadata.hasBoss), finalScore: metadata.perfectScore,
    ...overrides
  };
}

it('recalculates a current-era victory and rejects changed arithmetic', () => {
  const metadata = campaignScoreMetadata(10);
  const payload = currentResult(10);
  expect(validateCampaignResult(payload)).toEqual(payload);
  expect(validateCampaignResult({ ...payload, scheduledEnemiesKilled: payload.scheduledEnemiesKilled - 1 })).toBeNull();
  expect(validateCampaignResult({ ...payload, wavesCompleted: metadata.waveCount - 1 })).toBeNull();
  expect(validateCampaignResult({ ...payload, finalScore: payload.finalScore + 1 })).toBeNull();
  expect(validateCampaignResult({ ...payload, campaignScoreVersion: 2 })).toBeNull();
});

it('treats unversioned results as legacy and rejects partial current payloads', () => {
  const legacy = {
    runId: 'legacy-run-123', campaignVersion: 1, progressionVersion: 1, level: 1,
    outcome: 'victory' as const, finalScore: 999_999, remainingLives: 20,
    gameDurationSeconds: 10, gameVersion: '0.3.0'
  };
  expect(validateCampaignResult(legacy)).toEqual(legacy);
  expect(validateCampaignResult({ ...legacy, scheduledEnemiesKilled: 5 })).toBeNull();
  expect(validateCampaignResult({ ...legacy, campaignScoreVersion: 1 })).toBeNull();
});

it('bounds current kills by completed and active waves and requires the authored boss timing', () => {
  const metadata = campaignScoreMetadata(10);
  const completed = metadata.waveCount - 2;
  const scheduledEnemiesKilled = metadata.scheduledEnemiesThroughWave[completed + 1]!;
  const impossibleBoss = calculateCampaignScore({ scheduledEnemiesKilled, wavesCompleted: completed, missionBossesKilled: 1, remainingLives: 0 }).finalScore;
  expect(validateCampaignResult(currentResult(10, {
    outcome: 'defeat', remainingLives: 0, wavesCompleted: completed,
    scheduledEnemiesKilled, missionBossesKilled: 1, finalScore: impossibleBoss
  }))).toBeNull();

  const partialFinalWave = metadata.waveCount - 1;
  const finalWaveKills = metadata.scheduledEnemiesThroughWave[metadata.waveCount]!;
  const bossVictoryInProgress = calculateCampaignScore({ scheduledEnemiesKilled: finalWaveKills, wavesCompleted: partialFinalWave, missionBossesKilled: 1, remainingLives: 0 }).finalScore;
  expect(validateCampaignResult(currentResult(10, {
    outcome: 'defeat', remainingLives: 0, wavesCompleted: partialFinalWave,
    scheduledEnemiesKilled: finalWaveKills, missionBossesKilled: 1, finalScore: bossVictoryInProgress
  }))).not.toBeNull();
});

it('requires current siege failure to leave the authored boss alive and rejects quit results', () => {
  const metadata = campaignScoreMetadata(10);
  const bossDefeated = calculateCampaignScore({
    scheduledEnemiesKilled: metadata.scheduledEnemyCount, wavesCompleted: metadata.waveCount,
    missionBossesKilled: 1, remainingLives: 20
  }).finalScore;
  expect(validateCampaignResult(currentResult(10, { outcome: 'siege-failed', finalScore: bossDefeated }))).toBeNull();
  expect(validateCampaignResult(currentResult(10, { outcome: 'quit' }))).toBeNull();
});
