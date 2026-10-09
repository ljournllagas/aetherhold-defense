import { describe, expect, it } from 'vitest';
import { validateScorePayload } from '../src/shared/validation.ts';
import { SCORE_VERSION } from '../src/shared/version.ts';
import { resultFixture } from './helpers/progressionResult.ts';

describe('explicit completion validation', () => {
  const victory = resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7 });
  it('accepts a legitimate wave-30 victory and returns the progress fields', () => {
    const result = validateScorePayload(victory);
    expect(result.errors).toEqual([]);
    expect(result.value).toMatchObject({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 7, remainingLives: 10 });
  });
  it('accepts a victory whose wave-20 boss escaped', () => {
    expect(validateScorePayload(resultFixture({ highestWave: 30, wavesCompleted: 30, outcome: 'victory', siegeBossesDefeated: 5 }, 5, { escapedBossWaves: [20] })).errors).toEqual([]);
  });
  it('rejects victories without 30 completions, required bits or lives', () => {
    for (const forged of [{ ...victory, wavesCompleted: 29 }, { ...victory, siegeBossesDefeated: 3 }, { ...victory, remainingLives: 0 }]) expect(validateScorePayload(forged).ok).toBe(false);
  });
  it.each([11, 20, 30])('rejects progress past wave 10 without its boss bit at wave %i', (highestWave) => {
    expect(validateScorePayload(resultFixture({ highestWave, wavesCompleted: highestWave - 1, outcome: 'defeat', siegeBossesDefeated: 0 }, 0)).ok).toBe(false);
  });
  it.each([10, 30])('accepts a positive-lives siege failure at wave %i', (wave) => {
    const failed = resultFixture({ highestWave: wave, wavesCompleted: wave - 1, outcome: 'siege-failed', siegeBossesDefeated: wave === 30 ? 3 : 0 }, 10);
    expect(validateScorePayload(failed).errors).toEqual([]);
    expect(validateScorePayload({ ...failed, wavesCompleted: wave }).ok).toBe(false);
    expect(validateScorePayload({ ...failed, remainingLives: 0 }).ok).toBe(false);
  });
  it('accepts an endless defeat only after the siege milestones', () => {
    const defeat = resultFixture({ highestWave: 31, wavesCompleted: 30, outcome: 'defeat', siegeBossesDefeated: 7 }, 0);
    expect(validateScorePayload(defeat).errors).toEqual([]);
    expect(validateScorePayload({ ...defeat, siegeBossesDefeated: 1 }).ok).toBe(false);
    expect(validateScorePayload({ ...defeat, remainingLives: 10 }).ok).toBe(false);
    expect(validateScorePayload({ ...defeat, highestWave: 0 }).ok).toBe(false);
  });
  it('requires every new field, finite values and the current score version', () => {
    const { wavesCompleted: _w, ...missing } = victory; void _w;
    for (const bad of [missing, { ...victory, outcome: 'won' }, { ...victory, siegeBossesDefeated: Number.POSITIVE_INFINITY }, { ...victory, wavesCompleted: 29.5 }, { ...victory, scoreVersion: SCORE_VERSION - 1 }]) {
      expect(validateScorePayload(bad).ok).toBe(false);
    }
  });
});
