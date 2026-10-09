import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../src/game/config/difficulties.ts';
import { ENEMIES } from '../src/game/config/enemies.ts';
import { killReward, waveClearBonus } from '../src/game/systems/EconomySystem.ts';
import { buildWave } from '../src/game/systems/WaveSystem.ts';
import { MIXED_BUILD, cheapestFullEvolution, ordinaryIncomeByWave, simulatePurchases, verifyTrace, type ProgressionTrace } from './helpers/progressionTrace.ts';

const passing: ProgressionTrace = { difficulty: 'medium', debugAssisted: false, unlocked: [], purchases: [], firstEvolutionWave: 12, firstRank2Wave: 19, fullyEvolvedAtVictory: 3, siegeWon: true, ordinaryRewardsOnly: true, duration1xSeconds: 1500, maxForcedWaitWaves: 3, goldByWave: [], leaksByWave: [], relics: [] };
describe('trace reporter (synthetic data, not gameplay evidence)', () => {
  it('accepts a trace that meets every gate', () => expect(verifyTrace(passing)).toEqual([]));
  it.each([11, 13])('accepts first evolution at boundary wave %i', (firstEvolutionWave) => expect(verifyTrace({ ...passing, firstEvolutionWave })).toEqual([]));
  it.each([
    [{ firstEvolutionWave: 10 }, 'First evolution must be affordable during waves 11–13'],
    [{ firstEvolutionWave: 14 }, 'First evolution must be affordable during waves 11–13'], [{ firstEvolutionWave: null }, 'First evolution must be affordable during waves 11–13'],
    [{ firstRank2Wave: 20 }, 'Rank 2 must be achievable before wave 20'], [{ duration1xSeconds: 900 }, 'Medium siege duration must be 1200–1800 seconds'],
    [{ duration1xSeconds: 1801 }, 'Medium siege duration must be 1200–1800 seconds'], [{ fullyEvolvedAtVictory: 1 }, 'A successful mixed build must have 2–5 fully evolved towers at victory'],
    [{ fullyEvolvedAtVictory: 6 }, 'A successful mixed build must have 2–5 fully evolved towers at victory'], [{ maxForcedWaitWaves: 4 }, 'No forced wait may exceed three consecutive completed waves'],
    [{ debugAssisted: true }, 'Trace must not be debug-assisted'], [{ siegeWon: false }, 'Trace must record a siege victory']
  ] as Array<[Partial<ProgressionTrace>, string]>)('reports %o', (patch, message) => expect(verifyTrace({ ...passing, ...patch })).toContain(message));
  it('applies the duration gate only to Medium', () => expect(verifyTrace({ ...passing, difficulty: 'hard', duration1xSeconds: 900 })).toEqual([]));
});
describe('deterministic ordinary economy (Medium, no relics, no selling)', () => {
  const income = ordinaryIncomeByWave('medium', 30), trace = simulatePurchases('medium', MIXED_BUILD, 30), medium = DIFFICULTIES.medium;
  const kills = (wave: number) => buildWave(wave).groups.reduce((sum, g) => sum + g.count * killReward(ENEMIES[g.enemyId].baseReward, medium, false), 0);
  it('derives income from the real wave, reward and clear-bonus functions', () => {
    expect(income[0]).toBe(medium.startingGold);
    expect(income[1] - income[0]).toBe(kills(1) + waveClearBonus(1));
    expect(income[10] - income[9]).toBe(kills(10) + waveClearBonus(10) * 2);
  });
  it('affords the first evolution during waves 11–13', () => {
    const first = trace.find((p) => p.rank === 0);
    expect(first?.wave).toBeGreaterThanOrEqual(11); expect(first?.wave).toBeLessThanOrEqual(13);
  });
  it('reaches a rank-2 evolution before wave 20', () => expect(trace.find((p) => p.rank === 2)?.wave).toBeLessThan(20));
  it('cannot fully evolve nine plots before wave 25 from ordinary income', () => expect(9 * cheapestFullEvolution()).toBeGreaterThan(income[24]));
  it('never spends gold it does not have', () => expect(trace.every((p) => p.goldAfter >= 0 && Number.isSafeInteger(p.goldAfter))).toBe(true));
});
