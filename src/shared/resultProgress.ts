import type { ResultProgress } from './progression.ts';

function popcount(mask: number): number {
  let count = 0;
  for (let m = mask; m > 0; m >>= 1) count += m & 1;
  return count;
}

export function resultProgressErrors(progress: ResultProgress, remainingLives: number, bossesKilled: number): string[] {
  const { highestWave, wavesCompleted, outcome, siegeBossesDefeated: mask } = progress;
  const schema: string[] = [];
  if (!Number.isSafeInteger(highestWave) || highestWave < 1 || highestWave > 500) schema.push('highestWave must be an integer from 1 to 500');
  if (!Number.isSafeInteger(wavesCompleted) || wavesCompleted < 0 || wavesCompleted > highestWave) schema.push('wavesCompleted must be an integer from 0 to highestWave');
  if (outcome !== 'victory' && outcome !== 'defeat' && outcome !== 'siege-failed') schema.push('outcome must be victory, defeat or siege-failed');
  if (!Number.isSafeInteger(mask) || mask < 0 || mask > 7) schema.push('siegeBossesDefeated must be an integer from 0 to 7');
  if (schema.length > 0) return schema;

  const errors: string[] = [];
  if (popcount(mask) > bossesKilled) errors.push('siegeBossesDefeated has more milestones than bossesKilled');
  if (((mask & 1) && highestWave < 10) || ((mask & 2) && highestWave < 20) || ((mask & 4) && highestWave < 30)) {
    errors.push('siegeBossesDefeated marks a boss wave that was never entered');
  }
  if (highestWave >= 11 && !(mask & 1)) errors.push('Progress beyond wave 10 requires the wave-10 boss milestone');
  if (highestWave >= 31 && !(mask & 4)) errors.push('Progress beyond wave 30 requires the wave-30 boss milestone');
  if (outcome === 'victory') {
    if (!(highestWave === 30 && wavesCompleted === 30 && remainingLives > 0 && (mask & 5) === 5)) {
      errors.push('A victory requires 30 completed waves, lives remaining and the wave-10 and wave-30 milestones');
    }
  } else if (outcome === 'defeat') {
    if (!(remainingLives === 0 && wavesCompleted === highestWave - 1)) errors.push('A defeat requires zero lives and wavesCompleted = highestWave - 1');
  } else if (outcome === 'siege-failed') {
    const bit = highestWave === 10 ? 1 : 4;
    if (!((highestWave === 10 || highestWave === 30) && wavesCompleted === highestWave - 1 && remainingLives > 0 && !(mask & bit))) {
      errors.push('A siege failure requires wave 10 or 30, lives remaining, wavesCompleted = highestWave - 1 and no milestone for the escaped boss');
    }
  }
  return errors;
}

export function isValidResultProgress(progress: ResultProgress, remainingLives: number, bossesKilled: number): boolean {
  return resultProgressErrors(progress, remainingLives, bossesKilled).length === 0;
}
