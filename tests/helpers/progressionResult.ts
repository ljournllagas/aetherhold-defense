import { DIFFICULTIES } from '../../src/game/config/difficulties.ts';
import { ENEMIES } from '../../src/game/config/enemies.ts';
import { calculateScore } from '../../src/game/systems/ScoreSystem.ts';
import { buildWave } from '../../src/game/systems/WaveSystem.ts';
import type { ResultProgress } from '../../src/shared/progression.ts';
import type { GameResultPayload } from '../../src/shared/types.ts';
import { GAME_VERSION, SCORE_VERSION } from '../../src/shared/version.ts';

export interface ResultFixtureOptions { runId?: string; escapedBossWaves?: readonly number[]; }
export function resultFixture(progress: ResultProgress, remainingLives = 10, options: ResultFixtureOptions = {}): GameResultPayload & ResultProgress {
  let enemiesKilled = 0, bossesKilled = 0, elitesKilled = 0;
  for (let wave = 1; wave <= progress.wavesCompleted; wave++) {
    for (const group of buildWave(wave).groups) {
      if (ENEMIES[group.enemyId].isBoss && options.escapedBossWaves?.includes(wave)) continue;
      enemiesKilled += group.count;
      if (ENEMIES[group.enemyId].isBoss) bossesKilled += group.count;
      if (ENEMIES[group.enemyId].isElite) elitesKilled += group.count;
    }
  }
  const score = calculateScore({ enemiesKilled, bossesKilled, elitesKilled, wavesCompleted: progress.wavesCompleted, remainingLives, unusedGold: 0 }, DIFFICULTIES.medium);
  return { ...progress, playerName: 'TestWarden', difficulty: 'medium', enemiesKilled, bossesKilled, remainingLives, finalScore: score.finalScore,
    gameDurationSeconds: 3600, runId: options.runId ?? 'progression-run-0001', gameVersion: GAME_VERSION, scoreVersion: SCORE_VERSION };
}
