import { expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.ts';
import { calculateScore } from '../src/game/systems/ScoreSystem.ts';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';

vi.mock('phaser', () => ({ default: { Scene: class { constructor(_key?: string) {} } } }));

it('starts Campaign at zero and does not count resources as earned points', () => {
  const run: any = new GameScene(); run.init({ difficulty: 'medium' });
  run.lives = 20; run.gold = 600;
  expect(run.scoreSoFar()).toBe(0);
  run.enemiesKilled = 3; run.elitesKilled = 1; run.wavesCompleted = 1; run.bossesKilled = 1;
  expect(run.scoreSoFar()).toBe(930); // (30 + 15 + 75 + 500) * 1.5
  run.gold = 12345; run.lives = 1;
  expect(run.scoreSoFar()).toBe(930);
});

it('retains the existing 945 starting-resource bonus in the final calculator', () => {
  expect(calculateScore({ enemiesKilled: 0, elitesKilled: 0, wavesCompleted: 0,
    bossesKilled: 0, remainingLives: 20, unusedGold: 600 }, DIFFICULTIES.medium).finalScore).toBe(945);
});
