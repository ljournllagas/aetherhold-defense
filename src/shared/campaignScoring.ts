import { getCampaignLevel } from '../game/campaign/config.ts';
import { getCampaignWave, getCampaignWaveCount } from '../game/campaign/waveProfile.ts';

export const CAMPAIGN_SCORE_VERSION = 1;

export interface CampaignScoreInput {
  scheduledEnemiesKilled: number;
  wavesCompleted: number;
  missionBossesKilled: number;
  remainingLives: number;
}

export interface CampaignScoreBreakdown {
  killScore: number;
  waveBonus: number;
  bossBonus: number;
  livesBonus: number;
  finalScore: number;
}

export interface CampaignScoreMetadata {
  level: number;
  waveCount: number;
  scheduledEnemyCount: number;
  scheduledEnemiesThroughWave: readonly number[];
  hasBoss: boolean;
  perfectScore: number;
  scoreTarget: number;
}

const metadataByLevel = new Map<number, CampaignScoreMetadata>();

export function calculateCampaignScore(input: CampaignScoreInput): CampaignScoreBreakdown {
  const killScore = input.scheduledEnemiesKilled * 10;
  const waveBonus = input.wavesCompleted * 100;
  const bossBonus = input.missionBossesKilled * 500;
  const livesBonus = input.remainingLives * 50;
  return { killScore, waveBonus, bossBonus, livesBonus, finalScore: killScore + waveBonus + bossBonus + livesBonus };
}

export function calculateCampaignLiveScore(input: CampaignScoreInput): number {
  return calculateCampaignScore({ ...input, remainingLives: 0 }).finalScore;
}

export function campaignScoreMetadata(level: number): CampaignScoreMetadata {
  const cached = metadataByLevel.get(level);
  if (cached) return cached;
  const definition = getCampaignLevel(level);
  if (!definition) throw new Error('Campaign level is locked or invalid');
  const waveCount = getCampaignWaveCount(level);
  const throughWave = [0];
  for (let wave = 1; wave <= waveCount; wave++) {
    throughWave.push(throughWave[wave - 1]! + getCampaignWave(level, wave).spawns.length);
  }
  const scheduledEnemyCount = throughWave[waveCount]!;
  const hasBoss = definition.bossEnemyId !== null;
  const perfectScore = calculateCampaignScore({
    scheduledEnemiesKilled: scheduledEnemyCount,
    wavesCompleted: waveCount,
    missionBossesKilled: Number(hasBoss),
    remainingLives: 20
  }).finalScore;
  const metadata = Object.freeze({
    level,
    waveCount,
    scheduledEnemyCount,
    scheduledEnemiesThroughWave: Object.freeze(throughWave),
    hasBoss,
    perfectScore,
    scoreTarget: Math.ceil(0.9 * perfectScore / 10) * 10
  });
  metadataByLevel.set(level, metadata);
  return metadata;
}

/**
 * The legacy score-star bar: the authored `mastery.scoreTarget`, clamped so it can
 * never exceed the live bar (`campaignScoreMetadata(level).scoreTarget`, 90% of the
 * perfect score).
 *
 * Levels 3–100 author a value above the level's own perfect score, so it is
 * unreachable and the clamp drops it to the live bar. Levels 1–2 author a value
 * *below* the live bar and keep it, so a legacy save that earned a score star through
 * the old bar still validates. The clamp is therefore never narrowing: it can only
 * accept more than the raw authored value.
 */
export function legacyCampaignScoreTarget(level: number): number {
  const definition = getCampaignLevel(level);
  if (!definition) throw new Error('Campaign level is locked or invalid');
  return Math.min(definition.mastery.scoreTarget, campaignScoreMetadata(level).scoreTarget);
}
