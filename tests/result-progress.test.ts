import { describe, expect, it } from 'vitest';
import { isValidResultProgress, resultProgressErrors } from '../src/shared/resultProgress.ts';
import type { ResultProgress, RunOutcome } from '../src/shared/progression.ts';
import { resultFixture } from './helpers/progressionResult.ts';

const p = (highestWave: number, wavesCompleted: number, outcome: RunOutcome, siegeBossesDefeated: number): ResultProgress => ({ highestWave, wavesCompleted, outcome, siegeBossesDefeated });

describe('terminal result validity', () => {
  it.each([
    ['victory', p(30, 30, 'victory', 5), 10, 2], ['victory with wave-20 boss', p(30, 30, 'victory', 7), 10, 3],
    ['first boss escaped', p(10, 9, 'siege-failed', 0), 15, 0], ['final boss escaped', p(30, 29, 'siege-failed', 3), 4, 2],
    ['final boss escaped without wave-20 boss', p(30, 29, 'siege-failed', 1), 4, 1], ['defeat after wave 10', p(14, 13, 'defeat', 1), 0, 1],
    ['early defeat', p(1, 0, 'defeat', 0), 0, 0], ['endless defeat', p(31, 30, 'defeat', 7), 0, 3], ['deep endless defeat', p(45, 44, 'defeat', 5), 0, 4]
  ] as Array<[string, ResultProgress, number, number]>)('accepts %s', (_name, progress, lives, bosses) => {
    expect(resultProgressErrors(progress, lives, bosses)).toEqual([]);
    expect(isValidResultProgress(progress, lives, bosses)).toBe(true);
  });
  it.each([
    ['highestWave 0', p(0, 0, 'defeat', 0), 0, 0], ['wave 11 without the wave-10 bit', p(11, 10, 'defeat', 0), 0, 1],
    ['wave 31 without the wave-30 bit', p(31, 30, 'defeat', 3), 0, 3], ['defeat with lives left', p(12, 11, 'defeat', 1), 5, 1],
    ['victory with zero lives', p(30, 30, 'victory', 5), 0, 2], ['siege failure with zero lives', p(10, 9, 'siege-failed', 0), 0, 0],
    ['siege failure at another wave', p(20, 19, 'siege-failed', 1), 5, 1], ['siege failure holding the escaped bit', p(10, 9, 'siege-failed', 1), 5, 1],
    ['final siege failure holding the wave-30 bit', p(30, 29, 'siege-failed', 5), 5, 2], ['bit for an unentered wave', p(15, 14, 'defeat', 3), 0, 2],
    ['wave-30 bit before wave 30', p(25, 24, 'defeat', 5), 0, 2], ['more bits than bosses killed', p(31, 30, 'defeat', 7), 0, 2],
    ['victory short of 30 completions', p(30, 29, 'victory', 5), 10, 2], ['victory missing the wave-30 bit', p(30, 30, 'victory', 1), 10, 1],
    ['defeat with wrong completion', p(12, 12, 'defeat', 1), 0, 1], ['mask out of range', p(31, 30, 'defeat', 15), 0, 9],
    ['non-finite completion', p(12, Number.NaN, 'defeat', 1), 0, 1], ['unknown outcome', p(12, 11, 'won' as RunOutcome, 1), 0, 1]
  ] as Array<[string, ResultProgress, number, number]>)('rejects %s', (_name, progress, lives, bosses) => {
    expect(resultProgressErrors(progress, lives, bosses).length).toBeGreaterThan(0);
  });
  it('builds config-derived fixtures that satisfy the rules', () => {
    const victory = resultFixture(p(30, 30, 'victory', 7));
    expect(victory.bossesKilled).toBe(3);
    expect(isValidResultProgress(victory, victory.remainingLives, victory.bossesKilled)).toBe(true);
    const noTwenty = resultFixture(p(30, 30, 'victory', 5), 10, { escapedBossWaves: [20] });
    expect([noTwenty.bossesKilled, noTwenty.enemiesKilled]).toEqual([2, victory.enemiesKilled - 1]);
    expect(noTwenty.finalScore).toBeLessThan(victory.finalScore);
    expect(resultFixture(p(10, 9, 'siege-failed', 0), 10, { runId: 'progression-run-0002' }).runId).toBe('progression-run-0002');
  });
});
