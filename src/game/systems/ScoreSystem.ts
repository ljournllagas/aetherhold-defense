import { SCORING } from '../config/scoring.ts';
import type { DifficultyConfig, ScoreBreakdown } from '../../shared/types.ts';

export interface ScoreInput {
  enemiesKilled: number;
  elitesKilled: number;
  wavesCompleted: number;
  bossesKilled: number;
  remainingLives: number;
  unusedGold?: number;
}

export function calculateScore(input: ScoreInput, difficulty: DifficultyConfig): ScoreBreakdown {
  const killScore = input.enemiesKilled * SCORING.killScoreBase + input.elitesKilled * SCORING.eliteKillBonus;
  // Wave bonus: sum of arithmetic series base + perWave*i
  let waveBonus = 0;
  for (let w = 1; w <= input.wavesCompleted; w++) {
    waveBonus += SCORING.waveBonusBase + SCORING.waveBonusPerWave * w;
  }
  const bossTiers = Math.floor(input.bossesKilled);
  const bossBonus = input.bossesKilled * SCORING.bossBonus + bossTiers * SCORING.bossBonusPerBossTier * 0; // flat per boss
  const livesBonus = Math.max(0, input.remainingLives) * SCORING.lifeBonusPerLife;
  const goldBonus = Math.floor((input.unusedGold ?? 0) * 0.05);
  const baseScore = killScore + waveBonus + bossBonus + livesBonus + goldBonus;
  const finalScore = Math.floor(baseScore * difficulty.scoreMultiplier);
  return {
    killScore,
    waveBonus,
    bossBonus,
    livesBonus,
    baseScore,
    difficultyMultiplier: difficulty.scoreMultiplier,
    finalScore
  };
}

export function rankScores<T extends { highestWave: number; finalScore: number; createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.highestWave !== a.highestWave) return b.highestWave - a.highestWave;
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
