import type { DifficultyConfig, DifficultyId } from '../../shared/types.ts';

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    description: 'For new wardens. Generous gold and sturdy walls.',
    startingGold: 700,
    startingLives: 25,
    maxLives: 25,
    enemyHpMultiplier: 0.8,
    enemySpeedMultiplier: 0.9,
    enemyCountMultiplier: 0.9,
    goldRewardMultiplier: 1.15,
    scoreMultiplier: 1.0
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    description: 'The intended siege. Balanced and fair.',
    startingGold: 600,
    startingLives: 20,
    maxLives: 20,
    enemyHpMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemyCountMultiplier: 1.0,
    goldRewardMultiplier: 1.0,
    scoreMultiplier: 1.5
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'For veterans. Relentless Gloomtide, greater glory.',
    startingGold: 500,
    startingLives: 15,
    maxLives: 15,
    enemyHpMultiplier: 1.3,
    enemySpeedMultiplier: 1.1,
    enemyCountMultiplier: 1.1,
    goldRewardMultiplier: 0.9,
    scoreMultiplier: 2.0
  }
};

export const DIFFICULTY_LIST = [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard];

export function getDifficulty(id: string): DifficultyConfig {
  if (id === 'easy' || id === 'medium' || id === 'hard') return DIFFICULTIES[id];
  return DIFFICULTIES.medium;
}
