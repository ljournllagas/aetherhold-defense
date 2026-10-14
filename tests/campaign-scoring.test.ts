import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, CAMPAIGN_WORLDS } from '../src/game/campaign/config.ts';
import { DIFFICULTY_LIST } from '../src/game/config/difficulties.ts';
import {
  CAMPAIGN_SCORE_VERSION,
  calculateCampaignLiveScore,
  calculateCampaignScore,
  campaignScoreMetadata
} from '../src/shared/campaignScoring.ts';

describe('Campaign scoring', () => {
  it('settles the lives bonus once and keeps opening live score zero', () => {
    const input = { scheduledEnemiesKilled: 7, wavesCompleted: 2, missionBossesKilled: 1, remainingLives: 18 };
    expect(CAMPAIGN_SCORE_VERSION).toBe(1);
    expect(Object.keys(input)).toEqual(['scheduledEnemiesKilled', 'wavesCompleted', 'missionBossesKilled', 'remainingLives']);
    expect(calculateCampaignScore(input)).toEqual({
      killScore: 70, waveBonus: 200, bossBonus: 500, livesBonus: 900, finalScore: 1670
    });
    expect(calculateCampaignLiveScore(input)).toBe(770);
    expect(calculateCampaignLiveScore({ ...input, scheduledEnemiesKilled: 0, wavesCompleted: 0, missionBossesKilled: 0 })).toBe(0);
  });

  it('scores ordinary and boss missions with the same counter weights', () => {
    const ordinary = { scheduledEnemiesKilled: 10, wavesCompleted: 4, missionBossesKilled: 0, remainingLives: 3 };
    const boss = { ...ordinary, missionBossesKilled: 1 };
    expect(calculateCampaignScore(ordinary).finalScore).toBe(650);
    expect(calculateCampaignScore(boss).finalScore).toBe(1150);
    expect(new Set(DIFFICULTY_LIST.map(({ scoreMultiplier, enemyCountMultiplier }) => `${scoreMultiplier}/${enemyCountMultiplier}`)).size).toBeGreaterThan(1);
    expect(DIFFICULTY_LIST.map(() => calculateCampaignScore(ordinary).finalScore)).toEqual([650, 650, 650]);
  });

  it('has reachable targets for every registered mission', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(100);
    for (const def of CAMPAIGN_LEVELS) {
      const metadata = campaignScoreMetadata(def.level);
      expect(campaignScoreMetadata(def.level)).toBe(metadata);
      expect(Object.isFrozen(metadata)).toBe(true);
      expect(Object.isFrozen(metadata.scheduledEnemiesThroughWave)).toBe(true);
      expect(metadata.scoreTarget).toBe(Math.ceil(0.9 * metadata.perfectScore / 10) * 10);
      expect(metadata.scoreTarget).toBeGreaterThan(0);
      expect(metadata.scoreTarget).toBeLessThanOrEqual(metadata.perfectScore);
      expect(metadata.scheduledEnemiesThroughWave[0]).toBe(0);
      expect(metadata.scheduledEnemiesThroughWave[metadata.scheduledEnemiesThroughWave.length - 1]).toBe(metadata.scheduledEnemyCount);
      expect(metadata.scheduledEnemiesThroughWave).toHaveLength(metadata.waveCount + 1);
      expect(calculateCampaignScore({
        scheduledEnemiesKilled: metadata.scheduledEnemyCount,
        wavesCompleted: metadata.waveCount,
        missionBossesKilled: Number(metadata.hasBoss),
        remainingLives: 20
      }).finalScore).toBe(metadata.perfectScore);
    }
  });

  it('has an attainable imperfect score-star example in every world', () => {
    for (const world of CAMPAIGN_WORLDS) {
      const metadata = campaignScoreMetadata(world.levelStart);
      let example: { lives: number; kills: number; score: number } | undefined;
      let combinationsChecked = 0;
      for (let lives = 1; lives <= 19; lives++) {
        for (let kills = 0; kills <= metadata.scheduledEnemyCount; kills++) {
          combinationsChecked++;
          const score = calculateCampaignScore({
            scheduledEnemiesKilled: kills,
            wavesCompleted: metadata.waveCount,
            missionBossesKilled: Number(metadata.hasBoss),
            remainingLives: lives
          }).finalScore;
          if (!example && score >= metadata.scoreTarget && score < metadata.perfectScore) {
            example = { lives, kills, score };
          }
        }
      }
      expect(example, JSON.stringify({ world: world.id, level: world.levelStart, scheduledEnemyCount: metadata.scheduledEnemyCount, waveCount: metadata.waveCount, scoreTarget: metadata.scoreTarget, perfectScore: metadata.perfectScore, combinationsChecked, example })).toBeDefined();
    }
  });
});
